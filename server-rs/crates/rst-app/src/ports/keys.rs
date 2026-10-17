//! Port of the key store: one data key (DEK) per streamer. Deleting the key makes everything encrypted with it
//! unreadable, also in old backups of the data (crypto shredding).

use std::fmt;
use std::future::Future;

use rst_domain::identity::values::StreamerId;
use zeroize::Zeroizing;

use crate::ports::StoreError;

/// A data key of 32 bytes; wiped from memory when dropped, never shown in `Debug`
#[derive(Clone)]
pub struct DataKey(Zeroizing<[u8; 32]>);

impl DataKey {
    #[must_use]
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(Zeroizing::new(bytes))
    }

    #[must_use]
    pub fn bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl fmt::Debug for DataKey {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("DataKey(..)")
    }
}

pub trait KeyStore: Send + Sync {
    /// Creates and stores a new key for the streamer; an existing key stays and is returned
    fn create(&self, id: &StreamerId) -> impl Future<Output = Result<DataKey, StoreError>> + Send;

    /// `None` if the streamer has no key (never had one or it was shredded)
    fn get(&self, id: &StreamerId) -> impl Future<Output = Result<Option<DataKey>, StoreError>> + Send;

    /// Deletes the key for good
    fn shred(&self, id: &StreamerId) -> impl Future<Output = Result<(), StoreError>> + Send;
}
