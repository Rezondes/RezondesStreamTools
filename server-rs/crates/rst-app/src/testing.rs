//! In-memory adapters of the ports for the unit tests of the use cases. The real adapters in `rst-infra` pass the
//! same contract tests.
#![allow(
    clippy::unused_async_trait_impl,
    clippy::type_complexity,
    reason = "in-memory test adapters answer the async ports right away"
)]

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex, MutexGuard};

use rst_domain::identity::values::StreamerId;

use crate::crypto::cipher::random_bytes;
use crate::ports::StoreError;
use crate::ports::audit::{AuditStore, StoredEntry};
use crate::ports::keys::{DataKey, KeyStore};
use crate::ports::records::{RecordStore, StoredRecord};
use crate::ports::sessions::SessionStore;
use crate::ports::streamers::{StreamerRepository, StreamerRow};

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
}

#[derive(Debug, Default, Clone)]
pub struct MemoryKeys(Arc<Mutex<BTreeMap<StreamerId, [u8; 32]>>>);

impl KeyStore for MemoryKeys {
    async fn create(&self, id: &StreamerId) -> Result<DataKey, StoreError> {
        let fresh = random_bytes().map_err(StoreError::new)?;
        Ok(DataKey::from_bytes(*lock(&self.0).entry(id.clone()).or_insert(fresh)))
    }

    async fn get(&self, id: &StreamerId) -> Result<Option<DataKey>, StoreError> {
        Ok(lock(&self.0).get(id).copied().map(DataKey::from_bytes))
    }

    async fn shred(&self, id: &StreamerId) -> Result<(), StoreError> {
        lock(&self.0).remove(id);
        Ok(())
    }
}

type RecordPlace = (StreamerId, String, String);

#[derive(Debug, Default, Clone)]
pub struct MemoryRecords(Arc<Mutex<BTreeMap<RecordPlace, (Vec<u8>, i64)>>>);

impl RecordStore for MemoryRecords {
    async fn put(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
        ciphertext: &[u8],
        now: i64,
    ) -> Result<(), StoreError> {
        lock(&self.0).insert((streamer.clone(), kind.to_owned(), key.to_owned()), (ciphertext.to_vec(), now));
        Ok(())
    }

    async fn get(&self, streamer: &StreamerId, kind: &str, key: &str) -> Result<Option<Vec<u8>>, StoreError> {
        Ok(lock(&self.0).get(&(streamer.clone(), kind.to_owned(), key.to_owned())).map(|(bytes, _)| bytes.clone()))
    }

    async fn list(&self, streamer: &StreamerId, kind: &str) -> Result<Vec<(String, Vec<u8>)>, StoreError> {
        Ok(lock(&self.0)
            .iter()
            .filter(|((owner, found, _), _)| owner == streamer && found == kind)
            .map(|((_, _, key), (bytes, _))| (key.clone(), bytes.clone()))
            .collect())
    }

    async fn delete(&self, streamer: &StreamerId, kind: &str, key: &str) -> Result<bool, StoreError> {
        Ok(lock(&self.0).remove(&(streamer.clone(), kind.to_owned(), key.to_owned())).is_some())
    }

    async fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        lock(&self.0).retain(|(owner, _, _), _| owner != streamer);
        Ok(())
    }

    async fn export_all(&self) -> Result<Vec<StoredRecord>, StoreError> {
        Ok(lock(&self.0)
            .iter()
            .map(|((streamer_id, kind, key), (ciphertext, updated_at))| StoredRecord {
                streamer_id: streamer_id.clone(),
                kind: kind.clone(),
                key: key.clone(),
                ciphertext: ciphertext.clone(),
                updated_at: *updated_at,
            })
            .collect())
    }
}

#[derive(Debug, Default, Clone)]
pub struct MemoryStreamers(Arc<Mutex<Vec<StreamerRow>>>);

impl StreamerRepository for MemoryStreamers {
    async fn insert(&self, row: &StreamerRow, _now: i64) -> Result<(), StoreError> {
        let mut rows = lock(&self.0);
        let taken = rows.iter().any(|known| {
            known.id == row.id || known.user_id_digest == row.user_id_digest || known.login_digest == row.login_digest
        });
        if taken {
            return Err(StoreError::new("streamer taken"));
        }
        rows.push(row.clone());
        Ok(())
    }

    async fn find_by_user_id(&self, digest: &[u8; 32]) -> Result<Option<StreamerRow>, StoreError> {
        Ok(lock(&self.0).iter().find(|row| row.user_id_digest == *digest).cloned())
    }

    async fn find_by_login(&self, digest: &[u8; 32]) -> Result<Option<StreamerRow>, StoreError> {
        Ok(lock(&self.0).iter().find(|row| row.login_digest == *digest).cloned())
    }

    async fn set_login(&self, id: &StreamerId, digest: &[u8; 32]) -> Result<(), StoreError> {
        for row in lock(&self.0).iter_mut().filter(|row| row.id == *id) {
            row.login_digest = *digest;
        }
        Ok(())
    }

    async fn ids(&self) -> Result<Vec<StreamerId>, StoreError> {
        Ok(lock(&self.0).iter().map(|row| row.id.clone()).collect())
    }

    async fn delete(&self, id: &StreamerId) -> Result<(), StoreError> {
        lock(&self.0).retain(|row| row.id != *id);
        Ok(())
    }
}

#[derive(Debug, Default, Clone)]
pub struct MemorySessions(Arc<Mutex<BTreeMap<[u8; 32], (StreamerId, i64)>>>);

impl MemorySessions {
    pub fn hashes(&self) -> Vec<[u8; 32]> {
        lock(&self.0).keys().copied().collect()
    }
}

impl SessionStore for MemorySessions {
    async fn insert(&self, hash: &[u8; 32], streamer: &StreamerId, expires_at: i64) -> Result<(), StoreError> {
        lock(&self.0).insert(*hash, (streamer.clone(), expires_at));
        Ok(())
    }

    async fn find(&self, hash: &[u8; 32]) -> Result<Option<(StreamerId, i64)>, StoreError> {
        Ok(lock(&self.0).get(hash).cloned())
    }

    async fn delete(&self, hash: &[u8; 32]) -> Result<(), StoreError> {
        lock(&self.0).remove(hash);
        Ok(())
    }

    async fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        lock(&self.0).retain(|_, (owner, _)| owner != streamer);
        Ok(())
    }

    async fn delete_expired(&self, now: i64) -> Result<u64, StoreError> {
        let mut sessions = lock(&self.0);
        let before = sessions.len();
        sessions.retain(|_, (_, expires_at)| *expires_at > now);
        Ok(u64::try_from(before - sessions.len()).unwrap_or(u64::MAX))
    }
}

#[derive(Debug, Default, Clone)]
pub struct MemoryAudit(Arc<Mutex<Vec<(Option<StreamerId>, StoredEntry)>>>);

impl MemoryAudit {
    pub fn ciphertexts(&self) -> Vec<Vec<u8>> {
        lock(&self.0).iter().map(|(_, entry)| entry.ciphertext.clone()).collect()
    }
}

impl AuditStore for MemoryAudit {
    async fn append(
        &self,
        streamer: Option<&StreamerId>,
        created_at: i64,
        ciphertext: &[u8],
    ) -> Result<i64, StoreError> {
        let mut entries = lock(&self.0);
        let id = i64::try_from(entries.len()).unwrap_or(i64::MAX) + 1;
        entries.push((streamer.cloned(), StoredEntry { id, created_at, ciphertext: ciphertext.to_vec() }));
        Ok(id)
    }

    async fn list(&self, streamer: Option<&StreamerId>, limit: u32) -> Result<Vec<StoredEntry>, StoreError> {
        Ok(lock(&self.0)
            .iter()
            .rev()
            .filter(|(owner, _)| owner.as_ref() == streamer)
            .take(usize::try_from(limit).unwrap_or(usize::MAX))
            .map(|(_, entry)| entry.clone())
            .collect())
    }
}
