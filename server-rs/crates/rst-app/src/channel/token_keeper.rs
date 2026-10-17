//! Keeps the Twitch tokens of a streamer current (template: `server/tokenKeeper.ts`): checks them on demand and
//! hourly, saves renewed ones. Simultaneous checks share one request: two renewals with the same refresh token would
//! make the second fail, and that would look like a rejected login. After `stop` (e.g. disconnect) a running check
//! saves nothing, and tokens it renewed are revoked.

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};

use rst_domain::identity::values::StreamerId;
use rst_domain::twitch::tokens::TwitchTokens;

use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::twitch::TwitchAuth;
use crate::profile::Profile;

/// Twitch requires an hourly check
pub const CHECK_SECONDS: u64 = 3600;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Validity {
    Valid(TwitchTokens),
    /// Twitch rejected the login: the runtime ends and the tokens are deleted
    Rejected,
    /// Twitch unreachable or the keeper stopped: try again later
    Unknown,
}

pub struct TokenKeeper<T, S, K> {
    id: StreamerId,
    twitch: T,
    profile: Profile<S, K>,
    tokens: Mutex<TwitchTokens>,
    /// The result of the last check; whoever waited for a running check takes it
    gate: tokio::sync::Mutex<Validity>,
    rounds: AtomicU64,
    stopped: AtomicBool,
}

impl<T: TwitchAuth, S: RecordStore, K: KeyStore> TokenKeeper<T, S, K> {
    pub fn new(id: StreamerId, tokens: TwitchTokens, twitch: T, profile: Profile<S, K>) -> Self {
        Self {
            id,
            twitch,
            profile,
            tokens: Mutex::new(tokens),
            gate: tokio::sync::Mutex::new(Validity::Unknown),
            rounds: AtomicU64::new(0),
            stopped: AtomicBool::new(false),
        }
    }

    fn tokens(&self) -> MutexGuard<'_, TwitchTokens> {
        self.tokens.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[must_use]
    pub fn current(&self) -> TwitchTokens {
        self.tokens().clone()
    }

    /// Valid tokens; callers that arrive during a running check share its result
    pub async fn valid(&self, now: i64) -> Validity {
        let seen = self.rounds.load(Ordering::SeqCst);
        let mut gate = self.gate.lock().await;
        if self.rounds.load(Ordering::SeqCst) != seen {
            return gate.clone();
        }
        let result = self.check(now).await;
        gate.clone_from(&result);
        self.rounds.fetch_add(1, Ordering::SeqCst);
        result
    }

    async fn check(&self, now: i64) -> Validity {
        let current = self.current();
        let checked = match self.twitch.validate(&current).await {
            Ok(checked) => checked,
            Err(error) => {
                eprintln!("Token check for {} failed: {error}", current.login);
                return Validity::Unknown;
            }
        };
        if self.stopped.load(Ordering::SeqCst) {
            if let Some(renewed) = checked.filter(|checked| *checked != current)
                && let Err(error) = self.twitch.revoke(&renewed.access).await
            {
                eprintln!("Revoking a token failed: {error}");
            }
            return Validity::Unknown;
        }
        let Some(checked) = checked else { return Validity::Rejected };
        if checked != current {
            self.tokens().clone_from(&checked);
            if let Err(error) = self.profile.save_twitch_tokens(&self.id, &checked, now).await {
                eprintln!("Saving renewed tokens of {} failed: {error}", checked.login);
            }
        }
        Validity::Valid(checked)
    }

    pub fn stop(&self) {
        self.stopped.store(true, Ordering::SeqCst);
    }

    /// Waits for a running check (with its save); afterwards the stored tokens no longer change
    pub async fn idle(&self) {
        drop(self.gate.lock().await);
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rst_domain::identity::values::{Login, TwitchUserId};
    use tokio::sync::Notify;

    use super::*;
    use crate::ports::twitch::ProviderError;
    use crate::testing::{MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    fn tokens(access: &str, refresh: &str) -> TwitchTokens {
        TwitchTokens {
            access: access.to_owned(),
            refresh: refresh.to_owned(),
            user_id: TwitchUserId::parse("1").expect("id"),
            login: Login::parse("neo").expect("login"),
        }
    }

    /// Twitch accepts every refresh token only once; each validation waits for `release`
    #[derive(Default)]
    struct FakeTwitch {
        release: Notify,
        refreshes: Mutex<u32>,
        revoked: Mutex<Vec<String>>,
        rejecting: bool,
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl TwitchAuth for Arc<FakeTwitch> {
        async fn exchange(&self, _code: &str) -> Result<Option<TwitchTokens>, ProviderError> {
            Ok(None)
        }

        async fn revoke(&self, access: &str) -> Result<(), ProviderError> {
            self.revoked.lock().map_err(|_| ProviderError::new("lock"))?.push(access.to_owned());
            Ok(())
        }

        async fn validate(&self, current: &TwitchTokens) -> Result<Option<TwitchTokens>, ProviderError> {
            if self.rejecting {
                return Ok(None);
            }
            self.release.notified().await;
            if current.refresh != "r1" {
                return Ok(Some(current.clone()));
            }
            let mut refreshes = self.refreshes.lock().map_err(|_| ProviderError::new("lock"))?;
            *refreshes += 1;
            Ok((*refreshes == 1).then(|| tokens("a2", "r2")))
        }
    }

    async fn keeper(
        twitch: &Arc<FakeTwitch>,
    ) -> (Arc<TokenKeeper<Arc<FakeTwitch>, MemoryRecords, MemoryKeys>>, Profile<MemoryRecords, MemoryKeys>) {
        let id = StreamerId::from_bytes([1; 16]);
        let keys = MemoryKeys::default();
        keys.create(&id).await.expect("key");
        let profile = Profile::new(Vault::new(MemoryRecords::default(), keys));
        (Arc::new(TokenKeeper::new(id, tokens("a1", "r1"), Arc::clone(twitch), profile.clone())), profile)
    }

    #[tokio::test]
    async fn simultaneous_checks_share_one_renewal() {
        let twitch = Arc::new(FakeTwitch::default());
        let (keeper, profile) = keeper(&twitch).await;
        let first = tokio::spawn({
            let keeper = Arc::clone(&keeper);
            async move { keeper.valid(1).await }
        });
        let second = tokio::spawn({
            let keeper = Arc::clone(&keeper);
            async move { keeper.valid(1).await }
        });
        tokio::task::yield_now().await;
        twitch.release.notify_one();
        let fresh = Validity::Valid(tokens("a2", "r2"));
        assert_eq!(first.await.expect("first"), fresh);
        assert_eq!(second.await.expect("second"), fresh);
        assert_eq!(*twitch.refreshes.lock().expect("lock"), 1);
        assert_eq!(keeper.current(), tokens("a2", "r2"));
        assert_eq!(
            profile.twitch_tokens(&StreamerId::from_bytes([1; 16])).await.expect("saved"),
            Some(tokens("a2", "r2"))
        );
        // Afterwards a new check with the new tokens
        let again = tokio::spawn({
            let keeper = Arc::clone(&keeper);
            async move { keeper.valid(2).await }
        });
        tokio::task::yield_now().await;
        twitch.release.notify_one();
        assert_eq!(again.await.expect("again"), fresh);
    }

    #[tokio::test]
    async fn a_rejected_login_is_reported() {
        let twitch = Arc::new(FakeTwitch { rejecting: true, ..FakeTwitch::default() });
        let (keeper, _) = keeper(&twitch).await;
        assert_eq!(keeper.valid(1).await, Validity::Rejected);
    }

    #[tokio::test]
    async fn after_stop_nothing_is_saved_and_late_tokens_are_revoked() {
        let twitch = Arc::new(FakeTwitch::default());
        let (keeper, profile) = keeper(&twitch).await;
        let pending = tokio::spawn({
            let keeper = Arc::clone(&keeper);
            async move { keeper.valid(1).await }
        });
        tokio::task::yield_now().await;
        keeper.stop();
        twitch.release.notify_one();
        keeper.idle().await;
        assert_eq!(pending.await.expect("pending"), Validity::Unknown);
        assert_eq!(profile.twitch_tokens(&StreamerId::from_bytes([1; 16])).await.expect("saved"), None);
        assert_eq!(*twitch.revoked.lock().expect("lock"), ["a2"]);
    }
}
