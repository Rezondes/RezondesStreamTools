//! Port of the streamer table: only the internal ID and the lookup digests of Twitch user ID and login. The login
//! itself lives encrypted in the vault.

use std::future::Future;

use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StreamerRow {
    pub id: StreamerId,
    pub user_id_digest: [u8; 32],
    pub login_digest: [u8; 32],
}

pub trait StreamerRepository: Send + Sync {
    /// # Errors
    /// Also when the ID, the user ID digest or the login digest is taken.
    fn insert(&self, row: &StreamerRow, now: i64) -> impl Future<Output = Result<(), StoreError>> + Send;

    fn find_by_user_id(
        &self,
        digest: &[u8; 32],
    ) -> impl Future<Output = Result<Option<StreamerRow>, StoreError>> + Send;

    fn find_by_login(&self, digest: &[u8; 32]) -> impl Future<Output = Result<Option<StreamerRow>, StoreError>> + Send;

    /// After a rename on Twitch
    fn set_login(&self, id: &StreamerId, digest: &[u8; 32]) -> impl Future<Output = Result<(), StoreError>> + Send;

    /// All IDs in the order of registration
    fn ids(&self) -> impl Future<Output = Result<Vec<StreamerId>, StoreError>> + Send;

    /// When the streamer registered (ms since the epoch); `None` for an unknown ID
    fn created_at(&self, id: &StreamerId) -> impl Future<Output = Result<Option<i64>, StoreError>> + Send;

    fn delete(&self, id: &StreamerId) -> impl Future<Output = Result<(), StoreError>> + Send;
}
