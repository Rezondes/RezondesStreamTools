//! Runtime of a streamer (template: `server/streamer.ts`): owns the connections of its profile and ends them in
//! `stop`. It checks the Twitch tokens hourly (a rejected login ends the runtime and deletes the tokens) and reads
//! the chat and, with the feature alerts, `EventSub`. Every task runs supervised: a panic ends only that task, which is
//! logged and starts again after a pause, never the server. Triggers, minimes and Spotify join with their packages.

use std::collections::BTreeMap;
use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use rst_domain::access::Feature;
use rst_domain::identity::values::{Login, StreamerId};
use rst_domain::twitch::eventsub::{EventSubMessage, subscriptions};
use serde_json::json;
use tokio_util::sync::CancellationToken;

use crate::channel::alerts;
use crate::channel::chat::{listen, relay};
use crate::channel::registry::Runtime;
use crate::channel::token_keeper::{CHECK_SECONDS, TokenKeeper, Validity};
use crate::events::{Hubs, ServerMessage};
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::socket::SocketConnector;
use crate::ports::twitch::{EventSubscriber, TwitchAuth};
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
pub struct RuntimeSetup<T, S, K, C> {
    pub id: StreamerId,
    pub login: Login,
    pub twitch: T,
    pub profile: Profile<S, K>,
    pub sockets: Arc<C>,
    pub irc_url: String,
    pub eventsub_url: String,
    pub hubs: Arc<Hubs>,
    pub features: BTreeMap<Feature, bool>,
    /// The clock in ms
    pub now: fn() -> i64,
}

pub struct StreamerRuntime<T, S, K> {
    pub id: StreamerId,
    pub login: Login,
    pub keeper: Arc<TokenKeeper<T, S, K>>,
    cancel: CancellationToken,
}

impl<T, S, K> Runtime for StreamerRuntime<T, S, K>
where
    T: TwitchAuth,
    S: RecordStore,
    K: KeyStore,
{
    fn stop(&self) {
        self.keeper.stop();
        self.cancel.cancel();
    }

    fn stopped(&self) -> bool {
        self.cancel.is_cancelled()
    }
}

impl<T, S, K> StreamerRuntime<T, S, K>
where
    T: TwitchAuth + EventSubscriber + Clone + 'static,
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Starts the runtime of a streamer with Twitch tokens; `None` without tokens
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer, `Store` when the database fails.
    pub async fn start<C: SocketConnector>(setup: RuntimeSetup<T, S, K, C>) -> Result<Option<Self>, VaultError> {
        let RuntimeSetup { id, login, twitch, profile, sockets, irc_url, eventsub_url, hubs, features, now } = setup;
        let Some(tokens) = profile.twitch_tokens(&id).await? else { return Ok(None) };
        let keeper = Arc::new(TokenKeeper::new(id.clone(), tokens, twitch.clone(), profile.clone()));
        let cancel = CancellationToken::new();
        let check = {
            let (keeper, cancel, id, login) = (Arc::clone(&keeper), cancel.clone(), id.clone(), login.clone());
            move || {
                let (keeper, cancel, profile, id, login) =
                    (Arc::clone(&keeper), cancel.clone(), profile.clone(), id.clone(), login.clone());
                async move {
                    loop {
                        tokio::select! {
                            () = cancel.cancelled() => return,
                            () = tokio::time::sleep(Duration::from_secs(CHECK_SECONDS)) => {}
                        }
                        if keeper.valid(now()).await == Validity::Rejected {
                            eprintln!("Twitch login of {login} is no longer valid, please reconnect");
                            keeper.stop();
                            cancel.cancel();
                            if let Err(error) = profile.delete_twitch_tokens(&id).await {
                                eprintln!("Deleting the tokens of {login} failed: {error}");
                            }
                            return;
                        }
                    }
                }
            }
        };
        supervise(format!("Token check of {login}"), cancel.clone(), check);
        let chat_on = features.get(&Feature::Chat) == Some(&true);
        if features.get(&Feature::Alerts) == Some(&true) {
            let events = {
                let (sockets, hubs, keeper, cancel, id) =
                    (Arc::clone(&sockets), Arc::clone(&hubs), Arc::clone(&keeper), cancel.clone(), id.clone());
                move || {
                    let (sockets, url, hubs, keeper, twitch, cancel, id) = (
                        Arc::clone(&sockets),
                        eventsub_url.clone(),
                        Arc::clone(&hubs),
                        Arc::clone(&keeper),
                        twitch.clone(),
                        cancel.clone(),
                        id.clone(),
                    );
                    async move {
                        let subscribe = |session_id: String| subscribe_all(&keeper, &twitch, session_id, now);
                        alerts::listen(&*sockets, &url, &cancel, subscribe, |message| {
                            if let EventSubMessage::Alert(alert) = message {
                                hubs.emit(&id, &ServerMessage::Alert { alert });
                            }
                        })
                        .await;
                    }
                }
            };
            supervise(format!("EventSub of {login}"), cancel.clone(), events);
        }
        let chat = {
            let (cancel, id, login) = (cancel.clone(), id.clone(), login.clone());
            move || {
                let (sockets, irc_url, hubs, cancel, id, login) = (
                    Arc::clone(&sockets),
                    irc_url.clone(),
                    Arc::clone(&hubs),
                    cancel.clone(),
                    id.clone(),
                    login.clone(),
                );
                async move {
                    listen(&*sockets, &irc_url, login.as_str(), &cancel, |message| relay(message, &hubs, &id, chat_on))
                        .await;
                }
            }
        };
        supervise(format!("Chat of {login}"), cancel.clone(), chat);
        Ok(Some(Self { id, login, keeper, cancel }))
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
    use crate::testing::{MemoryKeys, MemoryRecords, MemorySockets};
    use crate::vault::Vault;

    /// Accepts every login while `valid` is true
    #[derive(Clone, Default)]
    struct FakeTwitch {
        valid: bool,
        subscribed: Arc<std::sync::Mutex<Vec<String>>>,
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
    ) -> RuntimeSetup<FakeTwitch, MemoryRecords, MemoryKeys, MemorySockets> {
        RuntimeSetup {
            id,
            login: login(),
            twitch: FakeTwitch { valid, ..FakeTwitch::default() },
            profile,
            sockets: Arc::new(irc.clone()),
            irc_url: "wss://irc".to_owned(),
            eventsub_url: "wss://eventsub".to_owned(),
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
