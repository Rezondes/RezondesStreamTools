//! Secret overlay key per streamer (template: `server/overlayKeys.ts`): the OBS URLs carry it as `?key=`, and only
//! with it does an overlay get the live stream. The dashboard shows it in plaintext, so it is stored encrypted in the
//! profile; checking compares HMAC digests in constant time. `rotate` makes every earlier OBS URL invalid.

use rst_domain::identity::values::StreamerId;
use subtle::ConstantTimeEq;

use crate::crypto::lookup::LookupKey;
use crate::crypto::to_hex;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::vault::{Vault, VaultError};

const KIND: &str = "overlay-key";

/// 32 lower case hex digits
fn is_key(value: &str) -> bool {
    value.len() == 32 && value.bytes().all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
}

#[derive(Debug, Clone)]
pub struct OverlayKeys<S, K> {
    vault: Vault<S, K>,
    lookup: LookupKey,
}

impl<S: RecordStore, K: KeyStore> OverlayKeys<S, K> {
    pub const fn new(vault: Vault<S, K>, lookup: LookupKey) -> Self {
        Self { vault, lookup }
    }

    async fn stored(&self, id: &StreamerId) -> Result<Option<String>, VaultError> {
        let stored: Option<String> = self.vault.get_json(id, KIND, "").await?;
        Ok(stored.filter(|key| is_key(key)))
    }

    /// The key of the streamer; without one a new key from `random` (drawn by the caller)
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn get(&self, id: &StreamerId, random: [u8; 16], now: i64) -> Result<String, VaultError> {
        match self.stored(id).await? {
            Some(key) => Ok(key),
            None => self.rotate(id, random, now).await,
        }
    }

    /// A new key; every earlier OBS URL stops working
    ///
    /// # Errors
    /// See [`Vault::put`].
    pub async fn rotate(&self, id: &StreamerId, random: [u8; 16], now: i64) -> Result<String, VaultError> {
        let key = to_hex(&random);
        self.vault.put_json(id, KIND, "", &key, now).await?;
        Ok(key)
    }

    /// Takes over a key from the Node server (import); `false` for an invalid key
    ///
    /// # Errors
    /// See [`Vault::put`].
    pub async fn set(&self, id: &StreamerId, key: &str, now: i64) -> Result<bool, VaultError> {
        if !is_key(key) {
            return Ok(false);
        }
        self.vault.put_json(id, KIND, "", &key, now).await?;
        Ok(true)
    }

    /// Whether `given` is the key of the streamer; without a key nothing matches
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn matches(&self, id: &StreamerId, given: &str) -> Result<bool, VaultError> {
        let Some(expected) = self.stored(id).await? else { return Ok(false) };
        let expected = self.lookup.digest("overlay", &expected);
        Ok(self.lookup.digest("overlay", given).ct_eq(&expected).into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};

    async fn keys() -> OverlayKeys<MemoryRecords, MemoryKeys> {
        let vault = Vault::new(MemoryRecords::default(), MemoryKeys::default());
        vault.keys().create(&neo()).await.expect("data key");
        OverlayKeys::new(vault, LookupKey::from_bytes([4; 32]))
    }

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    #[tokio::test]
    async fn created_once_then_the_same() {
        let keys = keys().await;
        let first = keys.get(&neo(), [0xab; 16], 1).await.expect("get");
        assert_eq!(first, "ab".repeat(16));
        assert_eq!(keys.get(&neo(), [0xcd; 16], 2).await.expect("get again"), first);
    }

    #[tokio::test]
    async fn matches_only_the_current_key() {
        let keys = keys().await;
        assert!(!keys.matches(&neo(), "").await.expect("no key yet"));
        let key = keys.get(&neo(), [0xab; 16], 1).await.expect("get");
        assert!(keys.matches(&neo(), &key).await.expect("match"));
        assert!(!keys.matches(&neo(), &"ab".repeat(15)).await.expect("short"));
        assert!(!keys.matches(&neo(), "").await.expect("empty"));
        let rotated = keys.rotate(&neo(), [0x12; 16], 2).await.expect("rotate");
        assert!(!keys.matches(&neo(), &key).await.expect("old key"));
        assert!(keys.matches(&neo(), &rotated).await.expect("new key"));
    }

    #[tokio::test]
    async fn import_takes_only_valid_keys() {
        let keys = keys().await;
        assert!(!keys.set(&neo(), "not-a-key", 1).await.expect("invalid"));
        assert!(keys.set(&neo(), &"0f".repeat(16), 1).await.expect("valid"));
        assert_eq!(keys.get(&neo(), [0xab; 16], 2).await.expect("get"), "0f".repeat(16));
    }
}
