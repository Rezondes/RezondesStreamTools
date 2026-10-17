//! Port of the session store: only the SHA-256 of a session token, the streamer and the expiry.

use std::future::Future;

use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;

pub trait SessionStore: Send + Sync {
    fn insert(
        &self,
        hash: &[u8; 32],
        streamer: &StreamerId,
        expires_at: i64,
    ) -> impl Future<Output = Result<(), StoreError>> + Send;

    /// Streamer and expiry of the session
    fn find(&self, hash: &[u8; 32]) -> impl Future<Output = Result<Option<(StreamerId, i64)>, StoreError>> + Send;

    fn delete(&self, hash: &[u8; 32]) -> impl Future<Output = Result<(), StoreError>> + Send;

    /// Ends every session of the streamer (disconnect, revoked access)
    fn delete_streamer(&self, streamer: &StreamerId) -> impl Future<Output = Result<(), StoreError>> + Send;

    /// Removes expired sessions; returns how many
    fn delete_expired(&self, now: i64) -> impl Future<Output = Result<u64, StoreError>> + Send;
}
