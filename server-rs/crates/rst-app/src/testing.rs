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
use crate::ports::keys::{DataKey, KeyStore};
use crate::ports::records::{RecordStore, StoredRecord};
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
