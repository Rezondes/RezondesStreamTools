//! Runtime of a streamer (template: `server/streamer.ts`): owns the connections of its profile and ends them in
//! `stop`. It checks the Twitch tokens hourly (a rejected login ends the runtime and deletes the tokens) and reads
//! the chat and, with the feature alerts, `EventSub`. Chat lines fire triggers (features triggers and fx), move the
//! minimes (feature minimes) and ask for the help command. Every task runs supervised: a panic ends only that task,
//! which is logged and starts again after a pause, never the server. With the feature music and a Spotify app the
//! current track goes to the overlays.

use std::collections::BTreeMap;
use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use rst_domain::access::Feature;
use rst_domain::chat::irc::IrcMessage;
use rst_domain::chat::line::{banned_login, to_chat_line};
use rst_domain::identity::values::{Login, StreamerId};
use rst_domain::settings::file::minime_rules_of;
use rst_domain::twitch::eventsub::{EventSubMessage, subscriptions};
use serde_json::json;
use tokio_util::sync::CancellationToken;

use crate::channel::alerts;
use crate::channel::chat::{listen, relay};
use crate::channel::help::HelpResponder;
use crate::channel::minimes::MinimeRunner;
use crate::channel::registry::Runtime;
use crate::channel::token_keeper::{CHECK_SECONDS, TokenKeeper, Validity};
use crate::channel::triggers::TriggerRunner;
use crate::commands::public_commands;
use crate::events::{Hubs, ServerMessage};
use crate::music::SpotifyPlayer;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::socket::SocketConnector;
use crate::ports::spotify::SpotifyApi;
use crate::ports::twitch::{ChatSender, EventSubscriber, ProviderError, Said, TwitchAuth};
use crate::profile::Profile;
use crate::vault::VaultError;

/// Pause before a panicked task starts again
pub const RESTART_PAUSE: Duration = Duration::from_secs(5);

/// Runs `task` until it returns or `cancel` fires; after a panic it starts again after [`RESTART_PAUSE`]
pub fn supervise<F, Fut>(name: String, cancel: CancellationToken, task: F)
where
    F: Fn() -> Fut + Send + 'static,
    Fut: Future<Output = ()> + Send + 'static,
{
    tokio::spawn(async move {
        loop {
            let run = tokio::spawn(task());
            let outcome = tokio::select! {
                () = cancel.cancelled() => return,
                outcome = run => outcome,
            };
            match outcome {
                Err(error) if error.is_panic() => {
                    eprintln!("{name} failed and starts again in {} s", RESTART_PAUSE.as_secs());
                    tokio::select! {
                        () = cancel.cancelled() => return,
                        () = tokio::time::sleep(RESTART_PAUSE) => {}
                    }
                }
                _ => return,
            }
        }
    });
}

/// What a runtime needs
pub struct RuntimeSetup<T, S, K, C, P> {
    pub id: StreamerId,
    pub login: Login,
    pub twitch: T,
    pub profile: Profile<S, K>,
    pub sockets: Arc<C>,
    pub irc_url: String,
    pub eventsub_url: String,
    pub hubs: Arc<Hubs>,
    pub features: BTreeMap<Feature, bool>,
    /// URL of the public commands page, for the help reply
    pub link: String,
    /// The Spotify app; `None` when it is not set up or the feature music is off
    pub spotify: Option<Arc<P>>,
    /// The clock in ms
    pub now: fn() -> i64,
}

pub struct StreamerRuntime<T, S, K, P> {
    pub id: StreamerId,
    pub login: Login,
    pub keeper: Arc<TokenKeeper<T, S, K>>,
    /// Only with the features triggers and fx
    pub triggers: Option<Arc<TriggerRunner>>,
    /// Only with the feature minimes
    pub minimes: Option<Arc<MinimeRunner<S, K>>>,
    pub help: Arc<HelpResponder>,
    /// Only with the feature music and a Spotify app
    pub spotify: Option<Arc<SpotifyPlayer<P, S, K>>>,
    cancel: CancellationToken,
}

/// What the tasks of a runtime share
struct Shared<T, S, K> {
    id: StreamerId,
    login: Login,
    hubs: Arc<Hubs>,
    chat_on: bool,
    triggers: Option<Arc<TriggerRunner>>,
    minimes: Option<Arc<MinimeRunner<S, K>>>,
    help: Arc<HelpResponder>,
    keeper: Arc<TokenKeeper<T, S, K>>,
    twitch: T,
    profile: Profile<S, K>,
    features: BTreeMap<Feature, bool>,
    now: fn() -> i64,
}

impl<T, S, K> Shared<T, S, K>
where
    T: TwitchAuth + EventSubscriber + ChatSender + Clone + 'static,
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Checks the tokens hourly; a rejected login ends the runtime and deletes the tokens
    async fn check_tokens(self: Arc<Self>, cancel: CancellationToken) {
        loop {
            tokio::select! {
                () = cancel.cancelled() => return,
                () = tokio::time::sleep(Duration::from_secs(CHECK_SECONDS)) => {}
            }
            if self.keeper.valid((self.now)()).await == Validity::Rejected {
                eprintln!("Twitch login of {} is no longer valid, please reconnect", self.login);
                self.keeper.stop();
                cancel.cancel();
                if let Err(error) = self.profile.delete_twitch_tokens(&self.id).await {
                    eprintln!("Deleting the tokens of {} failed: {error}", self.login);
                }
                return;
            }
        }
    }

    /// `EventSub`: alerts to the overlays, the end of the stream to the minimes
    async fn read_events<C: SocketConnector>(self: Arc<Self>, sockets: Arc<C>, url: String, cancel: CancellationToken) {
        let subscribe = |session_id: String| subscribe_all(&self.keeper, &self.twitch, session_id, self.now);
        alerts::listen(&*sockets, &url, &cancel, subscribe, |message| match message {
            EventSubMessage::Alert(alert) => self.hubs.emit(&self.id, &ServerMessage::Alert { alert }),
            EventSubMessage::Offline => self.minimes.iter().for_each(MinimeRunner::offline),
            _ => {}
        })
        .await;
    }

    async fn read_chat<C: SocketConnector>(self: Arc<Self>, sockets: Arc<C>, url: String, cancel: CancellationToken) {
        listen(&*sockets, &url, self.login.as_str(), &cancel, |message| self.read(message)).await;
    }

    fn read(self: &Arc<Self>, message: &IrcMessage) {
        // Only the own channel: a line of another channel must not fire triggers or help replies here
        if message.channel().is_some_and(|channel| channel != self.login.as_str()) {
            return;
        }
        relay(message, &self.hubs, &self.id, self.chat_on);
        if let (Some(minimes), Some(banned)) = (&self.minimes, banned_login(message)) {
            minimes.ban(&banned);
        }
        let Some(line) = to_chat_line(message) else { return };
        if self.help.is_echo(&line) {
            return;
        }
        let now = (self.now)();
        if let Some(triggers) = &self.triggers {
            triggers.handle(&line, u64::try_from(now).unwrap_or_default());
        }
        if let Some(minimes) = &self.minimes {
            minimes.handle(&line);
        }
        if self.help.wants_reply(&line, now) {
            let reader = Arc::clone(self);
            tokio::spawn(async move {
                if let Err(error) = reader.reply().await {
                    eprintln!("Help reply for {} failed: {error}", reader.login);
                }
            });
        }
    }

    /// The help reply as the streamer; without valid tokens it counts as a missing scope
    async fn reply(&self) -> Result<(), ProviderError> {
        let commands = public_commands(&self.profile, &self.id, &self.login, &self.features)
            .await
            .map_err(|error| ProviderError::new(error.to_string()))?;
        let say = |message: String| async move {
            match self.keeper.valid((self.now)()).await {
                Validity::Valid(tokens) => self.twitch.say(&tokens, &message).await,
                Validity::Rejected | Validity::Unknown => Ok(Said::MissingScope),
            }
        };
        self.help.reply(&commands, say).await
    }
}

impl<T, S, K, P> Runtime for StreamerRuntime<T, S, K, P>
where
    T: TwitchAuth,
    S: RecordStore,
    K: KeyStore,
    P: SpotifyApi,
{
    fn stop(&self) {
        self.keeper.stop();
        self.cancel.cancel();
    }

    fn stopped(&self) -> bool {
        self.cancel.is_cancelled()
    }
}

impl<T, S, K, P> StreamerRuntime<T, S, K, P>
where
    P: SpotifyApi,
    T: TwitchAuth + EventSubscriber + ChatSender + Clone + 'static,
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Starts the runtime of a streamer with Twitch tokens; `None` without tokens
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer, `Store` when the database fails.
    pub async fn start<C: SocketConnector>(setup: RuntimeSetup<T, S, K, C, P>) -> Result<Option<Self>, VaultError> {
        let RuntimeSetup {
            id,
            login,
            twitch,
            profile,
            sockets,
            irc_url,
            eventsub_url,
            hubs,
            features,
            link,
            spotify,
            now,
        } = setup;
        let Some(tokens) = profile.twitch_tokens(&id).await? else { return Ok(None) };
        let on = |feature: Feature| features.get(&feature) == Some(&true);
        let triggers = if on(Feature::Triggers) && on(Feature::Fx) {
            Some(Arc::new(TriggerRunner::new(id.clone(), Arc::clone(&hubs), &profile.triggers(&id).await?)))
        } else {
            None
        };
        let minimes = if on(Feature::Minimes) {
            let rules = profile.settings(&id).await?.as_ref().and_then(minime_rules_of);
            Some(MinimeRunner::load(id.clone(), Arc::clone(&hubs), profile.clone(), rules, now).await?)
        } else {
            None
        };
        let help = Arc::new(HelpResponder::new(login.as_str(), &link, profile.help(&id).await?));
        let spotify = match spotify {
            Some(api) => {
                Some(Arc::new(SpotifyPlayer::load(id.clone(), api, profile.clone(), Arc::clone(&hubs), now).await?))
            }
            None => None,
        };
        let keeper = Arc::new(TokenKeeper::new(id.clone(), tokens, twitch.clone(), profile.clone()));
        let cancel = CancellationToken::new();
        {
            let (help, twitch, tokens) = (Arc::clone(&help), twitch.clone(), keeper.current());
            tokio::spawn(async move { help.set_can_chat(twitch.can_chat(&tokens).await) });
        }
        let shared = Arc::new(Shared {
            id: id.clone(),
            login: login.clone(),
            hubs,
            chat_on: on(Feature::Chat),
            triggers: triggers.clone(),
            minimes: minimes.clone(),
            help: Arc::clone(&help),
            keeper: Arc::clone(&keeper),
            twitch,
            profile,
            features: features.clone(),
            now,
        });
        let name = |task: &str| format!("{task} of {login}");
        {
            let (shared, stop) = (Arc::clone(&shared), cancel.clone());
            supervise(name("Token check"), cancel.clone(), move || Arc::clone(&shared).check_tokens(stop.clone()));
        }
        if let Some(spotify) = &spotify {
            let (spotify, stop) = (Arc::clone(spotify), cancel.clone());
            supervise(name("Spotify"), cancel.clone(), move || Arc::clone(&spotify).poll_until(stop.clone()));
        }
        if let Some(minimes) = &minimes {
            let (minimes, stop) = (Arc::clone(minimes), cancel.clone());
            supervise(name("Minimes"), cancel.clone(), move || Arc::clone(&minimes).prune_until(stop.clone()));
        }
        if on(Feature::Alerts) {
            let (shared, sockets, stop) = (Arc::clone(&shared), Arc::clone(&sockets), cancel.clone());
            let events =
                move || Arc::clone(&shared).read_events(Arc::clone(&sockets), eventsub_url.clone(), stop.clone());
            supervise(name("EventSub"), cancel.clone(), events);
        }
        {
            let (shared, stop) = (Arc::clone(&shared), cancel.clone());
            let chat = move || Arc::clone(&shared).read_chat(Arc::clone(&sockets), irc_url.clone(), stop.clone());
            supervise(name("Chat"), cancel.clone(), chat);
        }
        Ok(Some(Self { id, login, keeper, triggers, minimes, help, spotify, cancel }))
    }
}

/// Requests every subscription for the `EventSub` session with checked tokens; a refused one is logged
async fn subscribe_all<T, S, K>(keeper: &TokenKeeper<T, S, K>, twitch: &T, session_id: String, now: fn() -> i64)
where
    T: TwitchAuth + EventSubscriber,
    S: RecordStore,
    K: KeyStore,
{
    let Validity::Valid(tokens) = keeper.valid(now()).await else { return };
    let transport = json!({ "method": "websocket", "session_id": session_id });
    for mut subscription in subscriptions(tokens.user_id.as_str()) {
        subscription["transport"] = transport.clone();
        if let Err(error) = twitch.subscribe(&tokens.access, &subscription).await {
            eprintln!("EventSub subscription {} for {} failed: {error}", subscription["type"], tokens.login);
        }
    }
    eprintln!("EventSub connected as {}", tokens.login);
}

/// Starts every streamer through `start`; a broken profile is logged and holds up nobody else. Returns how many run.
pub async fn start_all<F, Fut>(ids: Vec<StreamerId>, start: F) -> usize
where
    F: Fn(StreamerId) -> Fut,
    Fut: Future<Output = Result<bool, String>>,
{
    let mut running = 0;
    for id in ids {
        match start(id.clone()).await {
            Ok(true) => running += 1,
            Ok(false) => {}
            Err(error) => eprintln!("Runtime of streamer {} did not start: {error}", id.as_str()),
        }
    }
    running
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicU32, Ordering};

    use rst_domain::identity::values::TwitchUserId;
    use rst_domain::twitch::tokens::TwitchTokens;

    use super::*;
    use crate::ports::twitch::ProviderError;
    use crate::testing::{MemoryKeys, MemoryRecords, MemorySockets, NoSpotify};
    use crate::vault::Vault;

    /// Accepts every login while `valid` is true
    #[derive(Clone, Default)]
    struct FakeTwitch {
        valid: bool,
        subscribed: Arc<std::sync::Mutex<Vec<String>>>,
        said: Arc<std::sync::Mutex<Vec<String>>>,
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl TwitchAuth for FakeTwitch {
        async fn exchange(&self, _code: &str) -> Result<Option<TwitchTokens>, ProviderError> {
            Ok(None)
        }

        async fn revoke(&self, _access: &str) -> Result<(), ProviderError> {
            Ok(())
        }

        async fn validate(&self, tokens: &TwitchTokens) -> Result<Option<TwitchTokens>, ProviderError> {
            Ok(self.valid.then(|| tokens.clone()))
        }
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl ChatSender for FakeTwitch {
        async fn say(&self, _tokens: &TwitchTokens, message: &str) -> Result<Said, ProviderError> {
            self.said.lock().expect("said").push(message.to_owned());
            Ok(Said::Sent)
        }

        async fn can_chat(&self, _tokens: &TwitchTokens) -> Option<bool> {
            Some(true)
        }
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl EventSubscriber for FakeTwitch {
        async fn subscribe(&self, _access: &str, subscription: &serde_json::Value) -> Result<(), ProviderError> {
            self.subscribed
                .lock()
                .expect("subscribed")
                .push(subscription["type"].as_str().unwrap_or_default().to_owned());
            Ok(())
        }
    }

    fn id(byte: u8) -> StreamerId {
        StreamerId::from_bytes([byte; 16])
    }

    fn login() -> Login {
        Login::parse("neo").expect("login")
    }

    fn zero() -> i64 {
        0
    }

    fn setup(
        id: StreamerId,
        valid: bool,
        profile: Profile<MemoryRecords, MemoryKeys>,
        irc: &MemorySockets,
    ) -> RuntimeSetup<FakeTwitch, MemoryRecords, MemoryKeys, MemorySockets, NoSpotify> {
        RuntimeSetup {
            id,
            login: login(),
            twitch: FakeTwitch { valid, ..FakeTwitch::default() },
            profile,
            sockets: Arc::new(irc.clone()),
            irc_url: "wss://irc".to_owned(),
            eventsub_url: "wss://eventsub".to_owned(),
            link: "https://x/s/neo/".to_owned(),
            spotify: None,
            hubs: Arc::new(Hubs::default()),
            features: Feature::ALL.into_iter().map(|feature| (feature, true)).collect(),
            now: zero,
        }
    }

    async fn profile_with_tokens(id: &StreamerId) -> Profile<MemoryRecords, MemoryKeys> {
        let keys = MemoryKeys::default();
        keys.create(id).await.expect("key");
        let profile = Profile::new(Vault::new(MemoryRecords::default(), keys));
        let tokens = TwitchTokens {
            access: "a".to_owned(),
            refresh: "r".to_owned(),
            user_id: TwitchUserId::parse("7").expect("id"),
            login: login(),
        };
        profile.save_twitch_tokens(id, &tokens, 0).await.expect("tokens");
        profile
    }

    #[tokio::test(start_paused = true)]
    async fn a_rejected_login_ends_the_runtime_and_deletes_the_tokens() {
        let profile = profile_with_tokens(&id(1)).await;
        let irc = MemorySockets::default();
        let runtime =
            StreamerRuntime::start(setup(id(1), false, profile.clone(), &irc)).await.expect("start").expect("runtime");
        assert!(!runtime.stopped());
        tokio::time::sleep(Duration::from_millis(10)).await;
        assert!(irc.sent().iter().any(|line| line == "JOIN #neo"), "the chat is read");
        tokio::time::sleep(Duration::from_secs(CHECK_SECONDS + 1)).await;
        assert!(runtime.stopped());
        assert_eq!(profile.twitch_tokens(&id(1)).await.expect("tokens"), None);
        let empty = Profile::new(Vault::new(MemoryRecords::default(), MemoryKeys::default()));
        assert!(StreamerRuntime::start(setup(id(2), true, empty, &irc)).await.is_err());
    }

    #[tokio::test(start_paused = true)]
    async fn with_the_feature_alerts_eventsub_subscribes_and_sends_alerts() {
        let profile = profile_with_tokens(&id(1)).await;
        let sockets = MemorySockets::default();
        let welcome = r#"{"metadata":{"message_type":"session_welcome"},"payload":{"session":{"id":"s1"}}}"#;
        let follow = r#"{"metadata":{"message_type":"notification","subscription_type":"channel.follow"},"payload":{"event":{"user_name":"Neo"}}}"#;
        sockets.script_at("wss://eventsub", vec![welcome.to_owned(), follow.to_owned()]);
        let setup = setup(id(1), true, profile, &sockets);
        let (twitch, hubs) = (setup.twitch.clone(), Arc::clone(&setup.hubs));
        let mut stream = hubs.subscribe(&id(1), false).expect("stream");
        let runtime = StreamerRuntime::start(setup).await.expect("start").expect("runtime");
        let alert = stream.next().await.expect("alert");
        assert!(alert.contains(r#""type":"alert""#) && alert.contains("Neo"), "{alert}");
        let subscribed = twitch.subscribed.lock().expect("subscribed").clone();
        assert_eq!(subscribed.len(), 10);
        assert!(subscribed.iter().any(|kind| kind == "stream.offline"));
        runtime.stop();
    }

    #[tokio::test(start_paused = true)]
    async fn chat_lines_fire_triggers_and_the_help_reply_without_its_echo() {
        let profile = profile_with_tokens(&id(1)).await;
        let lizard = serde_json::json!([{ "name": "lizard", "when": { "type": "word", "match": "lizard" }, "do": [{ "type": "text", "text": "x" }] }]);
        profile.save_triggers(&id(1), lizard.as_array().expect("list"), 0).await.expect("triggers");
        let sockets = MemorySockets::default();
        let say = |login: &str, text: &str| format!(":{login}!{login}@{login}.tmi.twitch.tv PRIVMSG #neo :{text}");
        sockets.script_at("wss://irc", vec![say("smith", "lizard"), say("smith", "!befehle")]);
        let setup = setup(id(1), true, profile, &sockets);
        let (twitch, hubs) = (setup.twitch.clone(), Arc::clone(&setup.hubs));
        let mut stream = hubs.subscribe(&id(1), false).expect("stream");
        let runtime = StreamerRuntime::start(setup).await.expect("start").expect("runtime");
        let fx = loop {
            let message = stream.next().await.expect("event");
            if message.contains(r#""type":"fx""#) {
                break message;
            }
        };
        assert!(fx.contains(r#""user":"smith""#), "{fx}");
        tokio::time::sleep(Duration::from_millis(10)).await;
        let said = twitch.said.lock().expect("said").clone();
        assert_eq!(said.len(), 1);
        let echo =
            rst_domain::chat::line::ChatLine { login: "neo".to_owned(), text: said[0].clone(), ..Default::default() };
        assert!(runtime.help.is_echo(&echo));
        assert_eq!(runtime.help.can_chat(), Some(true));
        assert!(runtime.triggers.as_ref().expect("triggers").fire("lizard"));
        runtime.stop();
    }

    #[tokio::test]
    async fn broken_profile_does_not_block() {
        let good = profile_with_tokens(&id(1)).await;
        let irc = MemorySockets::default();
        let started = start_all(vec![id(2), id(1)], |streamer| {
            let (good, irc) = (good.clone(), irc.clone());
            async move {
                // Streamer 2 has no data key: like a shredded or broken profile
                let profile = if streamer == id(1) {
                    good
                } else {
                    Profile::new(Vault::new(MemoryRecords::default(), MemoryKeys::default()))
                };
                let runtime = StreamerRuntime::start(setup(streamer, true, profile, &irc))
                    .await
                    .map_err(|error| error.to_string())?;
                Ok(runtime.is_some())
            }
        })
        .await;
        assert_eq!(started, 1);
    }

    #[tokio::test(start_paused = true)]
    async fn panic_is_contained() {
        let runs = Arc::new(AtomicU32::new(0));
        let cancel = CancellationToken::new();
        let counter = Arc::clone(&runs);
        supervise("test task".to_owned(), cancel.clone(), move || {
            let counter = Arc::clone(&counter);
            async move {
                assert!(counter.fetch_add(1, Ordering::SeqCst) > 0, "first run panics");
                std::future::pending::<()>().await;
            }
        });
        tokio::time::sleep(Duration::from_millis(10)).await;
        assert_eq!(runs.load(Ordering::SeqCst), 1);
        tokio::time::sleep(RESTART_PAUSE).await;
        assert_eq!(runs.load(Ordering::SeqCst), 2);
        cancel.cancel();
    }
}
