//! Dashboard sessions: a random token in the cookie, only its hash in the store. Logging out or disconnecting ends
//! the session at once, so a copied cookie stops working (unlike the signed cookie of the Node server). Sessions
//! last 30 days.

use rst_domain::identity::session::{SESSION_DAYS, SessionToken};
use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;
use crate::ports::sessions::SessionStore;

pub const SESSION_MS: i64 = SESSION_DAYS * 86_400_000;

#[derive(Debug, Clone)]
pub struct Sessions<P> {
    store: P,
}

impl<P: SessionStore> Sessions<P> {
    pub const fn new(store: P) -> Self {
        Self { store }
    }

    /// New session from random bytes the caller draws; the token goes into the cookie
    ///
    /// # Errors
    /// When storing fails.
    pub async fn create(&self, streamer: &StreamerId, random: [u8; 32], now: i64) -> Result<SessionToken, StoreError> {
        let token = SessionToken::from_bytes(random);
        self.store.insert(token.hash().as_bytes(), streamer, now + SESSION_MS).await?;
        Ok(token)
    }

    /// Streamer of the cookie; `None` for a missing, unknown, revoked or expired session
    ///
    /// # Errors
    /// When the store fails.
    pub async fn resolve(&self, cookie: Option<&str>, now: i64) -> Result<Option<StreamerId>, StoreError> {
        let Some(token) = cookie.and_then(SessionToken::parse) else { return Ok(None) };
        let hash = token.hash();
        match self.store.find(hash.as_bytes()).await? {
            Some((streamer, expires_at)) if expires_at > now => Ok(Some(streamer)),
            Some(_) => {
                self.store.delete(hash.as_bytes()).await?;
                Ok(None)
            }
            None => Ok(None),
        }
    }

    /// Ends the session of the cookie (log out)
    ///
    /// # Errors
    /// When the store fails.
    pub async fn revoke(&self, cookie: Option<&str>) -> Result<(), StoreError> {
        match cookie.and_then(SessionToken::parse) {
            Some(token) => self.store.delete(token.hash().as_bytes()).await,
            None => Ok(()),
        }
    }

    /// Ends every session of the streamer (disconnect, access revoked)
    ///
    /// # Errors
    /// When the store fails.
    pub async fn revoke_all(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        self.store.delete_streamer(streamer).await
    }

    /// # Errors
    /// When the store fails.
    pub async fn clean_up(&self, now: i64) -> Result<u64, StoreError> {
        self.store.delete_expired(now).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::MemorySessions;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    #[tokio::test]
    async fn a_session_resolves_until_it_expires() {
        let sessions = Sessions::new(MemorySessions::default());
        let token = sessions.create(&neo(), [5; 32], 1000).await.expect("create");
        let cookie = token.to_text();
        assert_eq!(sessions.resolve(Some(&cookie), 2000).await.expect("resolve"), Some(neo()));
        assert_eq!(sessions.resolve(Some(&cookie), 1000 + SESSION_MS).await.expect("expired"), None);
        assert_eq!(sessions.resolve(Some(&cookie), 2000).await.expect("gone"), None);
        assert_eq!(sessions.resolve(Some("broken"), 2000).await.expect("broken"), None);
        assert_eq!(sessions.resolve(None, 2000).await.expect("none"), None);
    }

    #[tokio::test]
    async fn log_out_and_disconnect_end_sessions_at_once() {
        let sessions = Sessions::new(MemorySessions::default());
        let first = sessions.create(&neo(), [5; 32], 0).await.expect("create").to_text();
        let second = sessions.create(&neo(), [6; 32], 0).await.expect("create").to_text();
        let trinity = sessions.create(&StreamerId::from_bytes([2; 16]), [7; 32], 0).await.expect("create").to_text();
        sessions.revoke(Some(&first)).await.expect("log out");
        assert_eq!(sessions.resolve(Some(&first), 1).await.expect("resolve"), None);
        assert_eq!(sessions.resolve(Some(&second), 1).await.expect("resolve"), Some(neo()));
        sessions.revoke_all(&neo()).await.expect("disconnect");
        assert_eq!(sessions.resolve(Some(&second), 1).await.expect("resolve"), None);
        assert!(sessions.resolve(Some(&trinity), 1).await.expect("resolve").is_some());
    }

    #[tokio::test]
    async fn only_the_hash_is_stored() {
        let store = MemorySessions::default();
        let sessions = Sessions::new(store.clone());
        let token = sessions.create(&neo(), [5; 32], 0).await.expect("create");
        assert_eq!(store.hashes(), [*token.hash().as_bytes()]);
        assert_ne!(store.hashes()[0], [5; 32]);
        assert_eq!(sessions.clean_up(SESSION_MS + 1).await.expect("clean up"), 1);
    }
}
