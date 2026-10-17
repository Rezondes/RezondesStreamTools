//! Encrypted records of a streamer: the vault seals every block with the streamer's data key before it reaches the
//! record store, with the place (streamer, kind, key) as associated data so a block cannot be moved elsewhere.
//! Without the key (the streamer was shredded) nothing is readable, and nothing comes back as garbage.

use std::fmt;

use rst_domain::identity::values::StreamerId;
use serde::Serialize;
use serde::de::DeserializeOwned;
use zeroize::Zeroizing;

use crate::crypto::cipher::{open, seal};
use crate::ports::StoreError;
use crate::ports::keys::{DataKey, KeyStore};
use crate::ports::records::RecordStore;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VaultError {
    /// No data key or the block does not decrypt: the data is gone for good
    Unreadable,
    Store(StoreError),
}

impl VaultError {
    /// Error code for the API
    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Unreadable => "data-unreadable",
            Self::Store(_) => "store-failed",
        }
    }
}

impl fmt::Display for VaultError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unreadable => formatter.write_str("data unreadable"),
            Self::Store(error) => write!(formatter, "store failed: {error}"),
        }
    }
}

impl std::error::Error for VaultError {}

impl From<StoreError> for VaultError {
    fn from(error: StoreError) -> Self {
        Self::Store(error)
    }
}

fn aad(streamer: &StreamerId, kind: &str, key: &str) -> Vec<u8> {
    [streamer.as_str(), kind, key].join("\0").into_bytes()
}

#[derive(Debug, Clone)]
pub struct Vault<S, K> {
    records: S,
    keys: K,
}

impl<S: RecordStore, K: KeyStore> Vault<S, K> {
    pub const fn new(records: S, keys: K) -> Self {
        Self { records, keys }
    }

    pub const fn records(&self) -> &S {
        &self.records
    }

    pub const fn keys(&self) -> &K {
        &self.keys
    }

    async fn data_key(&self, streamer: &StreamerId) -> Result<DataKey, VaultError> {
        self.keys.get(streamer).await?.ok_or(VaultError::Unreadable)
    }

    /// # Errors
    /// `Unreadable` without a data key, `Store` when storing fails.
    pub async fn put(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
        plaintext: &[u8],
        now: i64,
    ) -> Result<(), VaultError> {
        let data_key = self.data_key(streamer).await?;
        let sealed = seal(data_key.bytes(), plaintext, &aad(streamer, kind, key))
            .map_err(|error| VaultError::Store(StoreError::new(error)))?;
        Ok(self.records.put(streamer, kind, key, &sealed, now).await?)
    }

    /// `None` if there is no block
    ///
    /// # Errors
    /// `Unreadable` without a data key or for a block that does not decrypt.
    pub async fn get(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
    ) -> Result<Option<Zeroizing<Vec<u8>>>, VaultError> {
        let data_key = self.data_key(streamer).await?;
        let Some(sealed) = self.records.get(streamer, kind, key).await? else { return Ok(None) };
        open(data_key.bytes(), &sealed, &aad(streamer, kind, key)).map(Some).map_err(|_| VaultError::Unreadable)
    }

    /// All blocks of a kind, sorted by key
    ///
    /// # Errors
    /// As [`Self::get`].
    pub async fn list(
        &self,
        streamer: &StreamerId,
        kind: &str,
    ) -> Result<Vec<(String, Zeroizing<Vec<u8>>)>, VaultError> {
        let data_key = self.data_key(streamer).await?;
        self.records
            .list(streamer, kind)
            .await?
            .into_iter()
            .map(|(key, sealed)| {
                let plaintext =
                    open(data_key.bytes(), &sealed, &aad(streamer, kind, &key)).map_err(|_| VaultError::Unreadable)?;
                Ok((key, plaintext))
            })
            .collect()
    }

    /// # Errors
    /// When storing fails.
    pub async fn delete(&self, streamer: &StreamerId, kind: &str, key: &str) -> Result<bool, VaultError> {
        Ok(self.records.delete(streamer, kind, key).await?)
    }

    /// # Errors
    /// As [`Self::put`].
    pub async fn put_json<T: Serialize + Sync>(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
        value: &T,
        now: i64,
    ) -> Result<(), VaultError> {
        let json =
            Zeroizing::new(serde_json::to_vec(value).map_err(|error| VaultError::Store(StoreError::new(error)))?);
        self.put(streamer, kind, key, &json, now).await
    }

    /// `None` if there is no block
    ///
    /// # Errors
    /// As [`Self::get`]; a block that is no valid `T` counts as unreadable.
    pub async fn get_json<T: DeserializeOwned>(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
    ) -> Result<Option<T>, VaultError> {
        let Some(plaintext) = self.get(streamer, kind, key).await? else { return Ok(None) };
        serde_json::from_slice(&plaintext).map(Some).map_err(|_| VaultError::Unreadable)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};

    fn vault() -> Vault<MemoryRecords, MemoryKeys> {
        Vault::new(MemoryRecords::default(), MemoryKeys::default())
    }

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    #[tokio::test]
    async fn round_trip_and_ciphertext_only_in_the_store() {
        let vault = vault();
        vault.keys().create(&neo()).await.expect("key");
        vault.put(&neo(), "settings", "", b"theme=matrix", 1).await.expect("put");
        assert_eq!(
            vault.get(&neo(), "settings", "").await.expect("get").as_deref().map(Vec::as_slice),
            Some(&b"theme=matrix"[..])
        );
        let stored = vault.records().get(&neo(), "settings", "").await.expect("raw").expect("block");
        assert!(!stored.windows(6).any(|window| window == b"matrix"));
        assert_eq!(vault.get(&neo(), "triggers", "").await.expect("get"), None);
        vault.put_json(&neo(), "list", "a", &vec![1, 2], 1).await.expect("put");
        assert_eq!(vault.get_json::<Vec<i32>>(&neo(), "list", "a").await.expect("get"), Some(vec![1, 2]));
        assert_eq!(vault.list(&neo(), "list").await.expect("list").len(), 1);
    }

    #[tokio::test]
    async fn moved_blocks_and_shredded_keys_are_unreadable() {
        let vault = vault();
        let trinity = StreamerId::from_bytes([2; 16]);
        vault.keys().create(&neo()).await.expect("key");
        vault.keys().create(&trinity).await.expect("key");
        vault.put(&neo(), "settings", "", b"x", 1).await.expect("put");
        let sealed = vault.records().get(&neo(), "settings", "").await.expect("raw").expect("block");
        vault.records().put(&neo(), "triggers", "", &sealed, 1).await.expect("move");
        assert_eq!(vault.get(&neo(), "triggers", "").await, Err(VaultError::Unreadable));
        vault.keys().shred(&neo()).await.expect("shred");
        assert_eq!(vault.get(&neo(), "settings", "").await, Err(VaultError::Unreadable));
        assert_eq!(vault.put(&neo(), "settings", "", b"y", 2).await, Err(VaultError::Unreadable));
        assert_eq!(VaultError::Unreadable.code(), "data-unreadable");
    }
}
