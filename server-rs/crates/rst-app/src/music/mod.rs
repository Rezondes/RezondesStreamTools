//! Spotify "Now Playing" of a running streamer (template: `spotifyClient` in `server/spotify.ts`): connecting with
//! the code from the callback, renewing the tokens and asking for the current track every three seconds, but only
//! while an overlay of the streamer is open. A 429 pauses the questions. Simultaneous renewals share one request, and
//! every connect and logout starts a new generation: answers that belong to an older one are dropped.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use rst_domain::identity::values::StreamerId;
use rst_domain::spotify::{POLL_MS, SpotifyDetails, SpotifyTokens, Track, changed, progressed, to_track};
use tokio_util::sync::CancellationToken;

use crate::events::{DashboardChange, Hubs, ServerMessage};
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::spotify::{Playing, SpotifyApi, TokenAnswer};
use crate::ports::twitch::ProviderError;
use crate::profile::Profile;
use crate::vault::VaultError;

/// Tokens are renewed this long before they expire, in ms
const RENEW_EARLY_MS: i64 = 60_000;
/// Without a lifetime in the answer Spotify tokens hold an hour
const DEFAULT_LIFETIME_S: i64 = 3600;

#[derive(Debug, Default)]
struct Player {
    tokens: Option<SpotifyTokens>,
    /// The last sent state and when it was sent
    track: Option<Track>,
    sent_at: i64,
    /// After a 429 no questions until then
    blocked_until: i64,
    /// Name of the account, asked once; `None` = not known yet
    account: Option<String>,
    /// Counts connects and logouts
    generation: u64,
}

pub struct SpotifyPlayer<A, S, K> {
    id: StreamerId,
    api: Arc<A>,
    profile: Profile<S, K>,
    hubs: Arc<Hubs>,
    now: fn() -> i64,
    player: Mutex<Player>,
    /// Renewals one after another; whoever waited for a running one does not start another
    renewing: tokio::sync::Mutex<()>,
    renewals: AtomicU64,
}

impl<A, S, K> SpotifyPlayer<A, S, K>
where
    A: SpotifyApi,
    S: RecordStore,
    K: KeyStore,
{
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn load(
        id: StreamerId,
        api: Arc<A>,
        profile: Profile<S, K>,
        hubs: Arc<Hubs>,
        now: fn() -> i64,
    ) -> Result<Self, VaultError> {
        let tokens = profile.spotify_tokens(&id).await?;
        Ok(Self {
            id,
            api,
            profile,
            hubs,
            now,
            player: Mutex::new(Player { tokens, ..Player::default() }),
            renewing: tokio::sync::Mutex::new(()),
            renewals: AtomicU64::new(0),
        })
    }

    fn player(&self) -> MutexGuard<'_, Player> {
        self.player.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[must_use]
    pub fn connected(&self) -> bool {
        self.player().tokens.is_some()
    }

    fn listening(&self) -> bool {
        self.hubs.overlay_count(&self.id) > 0
    }

    /// The current state with the progress moved on, e.g. for a newly connected overlay
    #[must_use]
    pub fn current(&self) -> Option<Track> {
        let player = self.player();
        progressed(player.track.as_ref(), player.sent_at, (self.now)())
    }

    pub async fn details(&self) -> SpotifyDetails {
        let unknown = {
            let player = self.player();
            player.tokens.is_some() && player.account.is_none()
        };
        if unknown {
            let account = match self.fresh_access().await {
                Ok(Some(access)) => self.api.account(&access).await,
                _ => None,
            };
            self.player().account = account;
        }
        let account = self.player().account.clone();
        SpotifyDetails { account, track: self.current(), polling: self.listening() }
    }

    /// Exchanges the code from the callback; `false` when Spotify refuses it
    ///
    /// # Errors
    /// When Spotify cannot be reached or the tokens cannot be stored.
    pub async fn connect(&self, code: &str) -> Result<bool, ProviderError> {
        let generation = {
            let mut player = self.player();
            player.generation += 1;
            player.generation
        };
        let Some(answer) = self.api.exchange(code).await? else { return Ok(false) };
        if self.player().generation == generation {
            self.player().account = None;
            self.save(&answer, generation).await?;
            self.hubs.changed(&self.id, DashboardChange::Account);
            self.hubs.changed(&self.id, DashboardChange::Spotify);
        }
        Ok(true)
    }

    /// Forgets the login: the overlays get silence, the stored tokens are deleted
    ///
    /// # Errors
    /// When the tokens cannot be deleted.
    pub async fn logout(&self) -> Result<(), VaultError> {
        {
            let mut player = self.player();
            player.generation += 1;
            player.tokens = None;
            player.track = None;
            player.account = None;
        }
        self.hubs.emit(&self.id, &ServerMessage::Music { track: None });
        self.hubs.changed(&self.id, DashboardChange::Account);
        self.hubs.changed(&self.id, DashboardChange::Spotify);
        self.profile.delete_spotify_tokens(&self.id).await
    }

    async fn save(&self, answer: &TokenAnswer, generation: u64) -> Result<(), ProviderError> {
        let now = (self.now)();
        let tokens = {
            let mut player = self.player();
            if player.generation != generation {
                return Ok(());
            }
            let refresh =
                answer.refresh.clone().or_else(|| player.tokens.as_ref().map(|tokens| tokens.refresh.clone()));
            let (Some(access), Some(refresh)) = (answer.access.clone(), refresh) else {
                return Err(ProviderError::new("Spotify sent incomplete tokens"));
            };
            let expires_at = now + answer.expires_in.unwrap_or(DEFAULT_LIFETIME_S) * 1000;
            let tokens = SpotifyTokens { access, refresh, expires_at };
            player.tokens = Some(tokens.clone());
            tokens
        };
        self.profile.save_spotify_tokens(&self.id, &tokens, now).await.map_err(ProviderError::new)
    }

    /// Renews the tokens; a refused refresh token ends the login
    async fn renew(&self) -> Result<(), ProviderError> {
        let seen = self.renewals.load(Ordering::SeqCst);
        let _gate = self.renewing.lock().await;
        if self.renewals.load(Ordering::SeqCst) != seen {
            return Ok(());
        }
        let result = self.renew_now().await;
        self.renewals.fetch_add(1, Ordering::SeqCst);
        result
    }

    async fn renew_now(&self) -> Result<(), ProviderError> {
        let (generation, refresh) = {
            let player = self.player();
            (player.generation, player.tokens.as_ref().map(|tokens| tokens.refresh.clone()))
        };
        let Some(refresh) = refresh else { return Ok(()) };
        let answer = self.api.refresh(&refresh).await?;
        // Logged out or connected again meanwhile: the answer belongs to an old login
        if self.player().generation != generation {
            return Ok(());
        }
        if let Some(answer) = answer {
            return self.save(&answer, generation).await;
        }
        eprintln!("Spotify login expired, please reconnect");
        self.logout().await.map_err(ProviderError::new)
    }

    /// The access token, renewed shortly before it expires; `None` when logged out
    async fn fresh_access(&self) -> Result<Option<String>, ProviderError> {
        let now = (self.now)();
        let expiring = self.player().tokens.as_ref().is_some_and(|tokens| now > tokens.expires_at - RENEW_EARLY_MS);
        if expiring {
            self.renew().await?;
        }
        Ok(self.player().tokens.as_ref().map(|tokens| tokens.access.clone()))
    }

    /// Asks for the current track once and sends changes to the overlays
    ///
    /// # Errors
    /// When Spotify cannot be reached or answers with an unexpected status.
    pub async fn poll(&self) -> Result<(), ProviderError> {
        let generation = self.player().generation;
        let Some(access) = self.fresh_access().await? else { return Ok(()) };
        let next = match self.api.playing(&access).await? {
            Playing::Answer(answer) => to_track(&answer),
            Playing::Nothing => None,
            Playing::Limited(seconds) => {
                let pause = i64::try_from(seconds).unwrap_or(i64::MAX).saturating_mul(1000);
                self.player().blocked_until = (self.now)().saturating_add(pause);
                return Ok(());
            }
            Playing::Unauthorized => return self.renew().await,
        };
        let now = (self.now)();
        {
            let mut player = self.player();
            // Logged out meanwhile: the answer is late
            let before = progressed(player.track.as_ref(), player.sent_at, now);
            if player.generation != generation || !changed(before.as_ref(), next.as_ref()) {
                return Ok(());
            }
            player.track.clone_from(&next);
            player.sent_at = now;
        }
        self.hubs.emit(&self.id, &ServerMessage::Music { track: next });
        self.hubs.changed(&self.id, DashboardChange::Spotify);
        Ok(())
    }

    /// Asks every three seconds until `cancel`, but only with tokens, an open overlay and no 429 pause
    pub async fn poll_until(self: Arc<Self>, cancel: CancellationToken) {
        loop {
            tokio::select! {
                () = cancel.cancelled() => return,
                () = tokio::time::sleep(Duration::from_millis(POLL_MS)) => {}
            }
            let due = {
                let player = self.player();
                player.tokens.is_some() && (self.now)() >= player.blocked_until
            };
            if due
                && self.listening()
                && let Err(error) = self.poll().await
            {
                eprintln!("Spotify poll failed: {error}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::VecDeque;
    use std::sync::atomic::AtomicI64;

    use serde_json::json;

    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    /// Answers from a script; counts token requests
    #[derive(Default)]
    struct FakeSpotify {
        tokens: Mutex<VecDeque<Option<TokenAnswer>>>,
        playing: Mutex<VecDeque<Playing>>,
        token_requests: AtomicU64,
        /// Holds a token request until released
        hold: tokio::sync::Mutex<()>,
    }

    impl FakeSpotify {
        async fn next_tokens(&self) -> Result<Option<TokenAnswer>, ProviderError> {
            self.token_requests.fetch_add(1, Ordering::SeqCst);
            drop(self.hold.lock().await);
            Ok(self.tokens.lock().expect("tokens").pop_front().flatten())
        }
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers from a script")]
    impl SpotifyApi for FakeSpotify {
        async fn exchange(&self, _code: &str) -> Result<Option<TokenAnswer>, ProviderError> {
            self.next_tokens().await
        }

        async fn refresh(&self, _refresh: &str) -> Result<Option<TokenAnswer>, ProviderError> {
            self.next_tokens().await
        }

        async fn playing(&self, _access: &str) -> Result<Playing, ProviderError> {
            Ok(self.playing.lock().expect("playing").pop_front().unwrap_or(Playing::Nothing))
        }

        async fn account(&self, _access: &str) -> Option<String> {
            Some("Neo".to_owned())
        }
    }

    /// Only the polling test moves the clock; the other test does not depend on it
    static NOW: AtomicI64 = AtomicI64::new(0);

    fn now() -> i64 {
        NOW.load(Ordering::SeqCst)
    }

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn answer(access: &str) -> TokenAnswer {
        TokenAnswer { access: Some(access.to_owned()), refresh: Some("refresh".to_owned()), expires_in: Some(3600) }
    }

    fn song(id: &str) -> Playing {
        Playing::Answer(
            json!({ "is_playing": true, "progress_ms": 0, "item": { "id": id, "name": id, "duration_ms": 200_000 } }),
        )
    }

    type TestPlayer = Arc<SpotifyPlayer<FakeSpotify, MemoryRecords, MemoryKeys>>;

    async fn start(api: &Arc<FakeSpotify>) -> (TestPlayer, Arc<Hubs>) {
        let keys = MemoryKeys::default();
        KeyStore::create(&keys, &neo()).await.expect("key");
        let profile = Profile::new(Vault::new(MemoryRecords::default(), keys));
        let hubs = Arc::new(Hubs::default());
        let player =
            SpotifyPlayer::load(neo(), Arc::clone(api), profile, Arc::clone(&hubs), now).await.expect("player");
        (Arc::new(player), hubs)
    }

    #[tokio::test(start_paused = true)]
    async fn polls_only_with_an_open_overlay_and_pauses_after_429() {
        NOW.store(0, Ordering::SeqCst);
        let api = Arc::new(FakeSpotify::default());
        api.tokens.lock().expect("tokens").push_back(Some(answer("a1")));
        api.playing.lock().expect("playing").extend([Playing::Limited(30), song("one")]);
        let (player, hubs) = start(&api).await;
        assert!(player.connect("code").await.expect("connect"));
        let cancel = CancellationToken::new();
        tokio::spawn(Arc::clone(&player).poll_until(cancel.clone()));
        // Without an overlay nothing is asked
        tokio::time::sleep(Duration::from_secs(10)).await;
        assert_eq!(api.playing.lock().expect("playing").len(), 2);
        let mut overlay = hubs.subscribe(&neo(), false).expect("overlay");
        tokio::time::sleep(Duration::from_millis(POLL_MS + 10)).await;
        assert_eq!(api.playing.lock().expect("playing").len(), 1, "the 429 was asked");
        NOW.store(10_000, Ordering::SeqCst);
        tokio::time::sleep(Duration::from_millis(POLL_MS)).await;
        assert_eq!(api.playing.lock().expect("playing").len(), 1, "paused after the 429");
        NOW.store(31_000, Ordering::SeqCst);
        let music = overlay.next().await.expect("music");
        assert!(music.contains(r#""type":"music""#) && music.contains(r#""id":"one""#), "{music}");
        assert_eq!(player.details().await.account.as_deref(), Some("Neo"));
        cancel.cancel();
    }

    #[tokio::test]
    async fn renewals_share_one_request_and_late_answers_after_logout_are_dropped() {
        let api = Arc::new(FakeSpotify::default());
        api.tokens.lock().expect("tokens").extend([Some(answer("a1")), Some(answer("a2"))]);
        let (player, _hubs) = start(&api).await;
        assert!(player.connect("code").await.expect("connect"));
        let held = api.hold.lock().await;
        let (first, second) = (Arc::clone(&player), Arc::clone(&player));
        let renewals = tokio::spawn(async move { tokio::join!(first.renew(), second.renew()) });
        tokio::task::yield_now().await;
        player.logout().await.expect("logout");
        drop(held);
        let (one, two) = renewals.await.expect("renewals");
        assert!(one.is_ok() && two.is_ok());
        assert_eq!(api.token_requests.load(Ordering::SeqCst), 2, "connect and one renewal");
        assert!(!player.connected(), "the late renewal does not log in again");
        let refused = Arc::new(FakeSpotify::default());
        refused.tokens.lock().expect("tokens").push_back(None);
        let (other, _hubs) = start(&refused).await;
        assert!(!other.connect("bad").await.expect("connect"));
    }
}
