//! Ports: what the use cases need from the outside (storage, keys). The adapters live in `rst-infra`; every adapter
//! passes the same contract tests.

pub mod audit;
pub mod files;
pub mod keys;
pub mod records;
pub mod sessions;
pub mod streamers;

use std::fmt;

/// A storage failed (database, file, decryption); the message is for the log, never for the browser
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoreError(pub String);

impl StoreError {
    pub fn new(message: impl fmt::Display) -> Self {
        Self(message.to_string())
    }
}

impl fmt::Display for StoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for StoreError {}
