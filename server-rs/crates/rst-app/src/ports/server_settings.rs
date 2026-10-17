//! Port of the server-wide settings (access policy, backup schedule): ciphertext under a fixed key.

use std::future::Future;

use crate::ports::StoreError;

pub trait ServerSettingsStore: Send + Sync {
    fn put(&self, key: &str, ciphertext: &[u8], now: i64) -> impl Future<Output = Result<(), StoreError>> + Send;

    fn get(&self, key: &str) -> impl Future<Output = Result<Option<Vec<u8>>, StoreError>> + Send;
}
