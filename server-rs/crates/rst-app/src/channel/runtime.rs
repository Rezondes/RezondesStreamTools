//! Runtime of a streamer (template: `server/streamer.ts`): owns the connections of its profile and ends them in
//! `stop`. It checks the Twitch tokens hourly; a rejected login ends the runtime and deletes the tokens. Every task
//! runs supervised: a panic ends only that task, which is logged and starts again after a pause, never the server.
//! Chat, `EventSub`, triggers, minimes and Spotify join with their packages.

use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use rst_domain::identity::values::{Login, StreamerId};
use tokio_util::sync::CancellationToken;

use crate::channel::registry::Runtime;
use crate::channel::token_keeper::{CHECK_SECONDS, TokenKeeper, Validity};
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::twitch::TwitchAuth;
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
    T: TwitchAuth + 'static,
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Starts the runtime of a streamer with Twitch tokens; `None` without tokens. `now`: the clock in ms.
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer, `Store` when the database fails.
    pub async fn start(
        id: StreamerId,
        login: Login,
        twitch: T,
        profile: Profile<S, K>,
        now: fn() -> i64,
    ) -> Result<Option<Self>, VaultError> {
        let Some(tokens) = profile.twitch_tokens(&id).await? else { return Ok(None) };
        let keeper = Arc::new(TokenKeeper::new(id.clone(), tokens, twitch, profile.clone()));
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
        Ok(Some(Self { id, login, keeper, cancel }))
    }
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
    use crate::testing::{MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    /// Accepts every login while `valid` is true
    #[derive(Clone)]
    struct FakeTwitch {
        valid: bool,
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

    fn id(byte: u8) -> StreamerId {
        StreamerId::from_bytes([byte; 16])
    }

    fn login() -> Login {
        Login::parse("neo").expect("login")
    }

    fn zero() -> i64 {
        0
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
        let runtime = StreamerRuntime::start(id(1), login(), FakeTwitch { valid: false }, profile.clone(), zero)
            .await
            .expect("start")
            .expect("runtime");
        assert!(!runtime.stopped());
        tokio::time::sleep(Duration::from_secs(CHECK_SECONDS + 1)).await;
        assert!(runtime.stopped());
        assert_eq!(profile.twitch_tokens(&id(1)).await.expect("tokens"), None);
        let empty = Profile::new(Vault::new(MemoryRecords::default(), MemoryKeys::default()));
        assert!(StreamerRuntime::start(id(2), login(), FakeTwitch { valid: true }, empty, zero).await.is_err());
    }

    #[tokio::test]
    async fn broken_profile_does_not_block() {
        let good = profile_with_tokens(&id(1)).await;
        let started = start_all(vec![id(2), id(1)], |streamer| {
            let good = good.clone();
            async move {
                // Streamer 2 has no data key: like a shredded or broken profile
                let profile = if streamer == id(1) {
                    good
                } else {
                    Profile::new(Vault::new(MemoryRecords::default(), MemoryKeys::default()))
                };
                let runtime = StreamerRuntime::start(streamer, login(), FakeTwitch { valid: true }, profile, zero)
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
