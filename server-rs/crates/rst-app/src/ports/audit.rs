//! Port of the audit log: append-only by design, there is neither update nor delete. Entries are ciphertext; the
//! streamer is `None` for server-wide entries.

use std::future::Future;

use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoredEntry {
    pub id: i64,
    pub created_at: i64,
    pub ciphertext: Vec<u8>,
}

pub trait AuditStore: Send + Sync {
    /// Returns the ID of the new entry
    fn append(
        &self,
        streamer: Option<&StreamerId>,
        created_at: i64,
        ciphertext: &[u8],
    ) -> impl Future<Output = Result<i64, StoreError>> + Send;

    /// The newest `limit` entries of the streamer (or the server-wide ones), newest first
    fn list(
        &self,
        streamer: Option<&StreamerId>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<StoredEntry>, StoreError>> + Send;
}
