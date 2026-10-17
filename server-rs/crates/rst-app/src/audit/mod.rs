//! Audit log: every change to configuration and access as an append-only entry (who, what, before, after). Entries
//! of a streamer are encrypted with their data key, so they become unreadable with the streamer; server-wide entries
//! (e.g. the access policy) use a key derived from the master key.

use rst_domain::identity::values::StreamerId;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::crypto::cipher::{open, seal};
use crate::ports::StoreError;
use crate::ports::audit::AuditStore;
use crate::ports::keys::{DataKey, KeyStore};
use crate::vault::VaultError;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuditEntry {
    #[serde(skip)]
    pub id: i64,
    /// Milliseconds since the epoch
    #[serde(skip)]
    pub created_at: i64,
    /// Login of who made the change, or `system`
    pub actor: String,
    /// e.g. `settings.save`, `access.change`
    pub action: String,
    pub before: Option<Value>,
    pub after: Option<Value>,
}

fn aad(streamer: Option<&StreamerId>, created_at: i64) -> Vec<u8> {
    format!("audit\0{}\0{created_at}", streamer.map_or("server", StreamerId::as_str)).into_bytes()
}

#[derive(Debug, Clone)]
pub struct AuditLog<A, K> {
    store: A,
    keys: K,
    server_key: DataKey,
}

impl<A: AuditStore, K: KeyStore> AuditLog<A, K> {
    pub const fn new(store: A, keys: K, server_key: DataKey) -> Self {
        Self { store, keys, server_key }
    }

    async fn key_of(&self, streamer: Option<&StreamerId>) -> Result<DataKey, VaultError> {
        match streamer {
            Some(id) => self.keys.get(id).await?.ok_or(VaultError::Unreadable),
            None => Ok(self.server_key.clone()),
        }
    }

    /// Appends an entry; returns its ID
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer, `Store` when storing fails.
    pub async fn append(&self, streamer: Option<&StreamerId>, entry: &AuditEntry, now: i64) -> Result<i64, VaultError> {
        let key = self.key_of(streamer).await?;
        let json = serde_json::to_vec(entry).map_err(|error| VaultError::Store(StoreError::new(error)))?;
        let sealed =
            seal(key.bytes(), &json, &aad(streamer, now)).map_err(|error| VaultError::Store(StoreError::new(error)))?;
        Ok(self.store.append(streamer, now, &sealed).await?)
    }

    /// The newest `limit` entries, newest first
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer or an entry that does not decrypt.
    pub async fn list(&self, streamer: Option<&StreamerId>, limit: u32) -> Result<Vec<AuditEntry>, VaultError> {
        let key = self.key_of(streamer).await?;
        self.store
            .list(streamer, limit)
            .await?
            .into_iter()
            .map(|stored| {
                let plaintext = open(key.bytes(), &stored.ciphertext, &aad(streamer, stored.created_at))
                    .map_err(|_| VaultError::Unreadable)?;
                let entry: AuditEntry = serde_json::from_slice(&plaintext).map_err(|_| VaultError::Unreadable)?;
                Ok(AuditEntry { id: stored.id, created_at: stored.created_at, ..entry })
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::testing::{MemoryAudit, MemoryKeys};

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn entry(action: &str, after: Value) -> AuditEntry {
        AuditEntry {
            id: 0,
            created_at: 0,
            actor: "rezondes".to_owned(),
            action: action.to_owned(),
            before: None,
            after: Some(after),
        }
    }

    async fn log() -> (AuditLog<MemoryAudit, MemoryKeys>, MemoryAudit) {
        let store = MemoryAudit::default();
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        (AuditLog::new(store.clone(), keys, DataKey::from_bytes([9; 32])), store)
    }

    #[tokio::test]
    async fn entries_per_streamer_and_server_newest_first() {
        let (log, _) = log().await;
        log.append(Some(&neo()), &entry("settings.save", json!({ "theme": "matrix" })), 10).await.expect("append");
        log.append(Some(&neo()), &entry("triggers.save", json!(["lizard"])), 20).await.expect("append");
        log.append(None, &entry("access.change", json!({ "registration": "open" })), 30).await.expect("append");
        let own = log.list(Some(&neo()), 10).await.expect("list");
        let actions: Vec<(&str, i64)> = own.iter().map(|entry| (entry.action.as_str(), entry.created_at)).collect();
        assert_eq!(actions, [("triggers.save", 20), ("settings.save", 10)]);
        assert_eq!(own[1].after, Some(json!({ "theme": "matrix" })));
        assert_eq!(log.list(Some(&neo()), 1).await.expect("limit").len(), 1);
        let server = log.list(None, 10).await.expect("server");
        assert_eq!(server.len(), 1);
        assert_eq!(server[0].actor, "rezondes");
    }

    #[tokio::test]
    async fn entries_are_ciphertext_and_unreadable_after_shred() {
        let (log, store) = log().await;
        log.append(Some(&neo()), &entry("settings.save", json!({ "title": "secret title" })), 10)
            .await
            .expect("append");
        assert!(store.ciphertexts().iter().all(|bytes| !bytes.windows(6).any(|window| window == b"secret")));
        log.keys.shred(&neo()).await.expect("shred");
        assert_eq!(log.list(Some(&neo()), 10).await, Err(VaultError::Unreadable));
        assert_eq!(log.append(Some(&neo()), &entry("x", json!(1)), 11).await, Err(VaultError::Unreadable));
    }
}
