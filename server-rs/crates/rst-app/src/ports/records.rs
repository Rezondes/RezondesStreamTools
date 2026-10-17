//! Port of the record store: encrypted blocks per streamer, kind and key. The use cases encrypt before `put` and
//! decrypt after `get`; an adapter only ever sees ciphertext.

use std::future::Future;

use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;

/// One block with its place, for backups
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoredRecord {
    pub streamer_id: StreamerId,
    pub kind: String,
    pub key: String,
    pub ciphertext: Vec<u8>,
    /// Milliseconds since the epoch
    pub updated_at: i64,
}

pub trait RecordStore: Send + Sync {
    /// Stores or replaces the block
    fn put(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
        ciphertext: &[u8],
        now: i64,
    ) -> impl Future<Output = Result<(), StoreError>> + Send;

    fn get(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
    ) -> impl Future<Output = Result<Option<Vec<u8>>, StoreError>> + Send;

    /// All blocks of a kind, sorted by key
    fn list(
        &self,
        streamer: &StreamerId,
        kind: &str,
    ) -> impl Future<Output = Result<Vec<(String, Vec<u8>)>, StoreError>> + Send;

    /// `true` if there was a block
    fn delete(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
    ) -> impl Future<Output = Result<bool, StoreError>> + Send;

    /// Removes every block of the streamer
    fn delete_streamer(&self, streamer: &StreamerId) -> impl Future<Output = Result<(), StoreError>> + Send;

    /// Every block of every streamer, sorted by streamer, kind and key
    fn export_all(&self) -> impl Future<Output = Result<Vec<StoredRecord>, StoreError>> + Send;
}
