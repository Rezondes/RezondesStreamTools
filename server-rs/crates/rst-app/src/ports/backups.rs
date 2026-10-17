//! Port of the backup folder: server-wide archives of the data database and the encrypted files, never the keys.

use std::future::Future;
use std::path::PathBuf;

use serde::Serialize;

use crate::ports::StoreError;

/// A finished backup; `id` is also its file name without the extension
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct BackupInfo {
    pub id: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    pub bytes: u64,
    /// Made by the schedule (package 41); only those are cleaned up automatically
    pub automatic: bool,
}

pub trait BackupStore: Send + Sync + 'static {
    /// Writes a new archive under `id`; a half written one never shows up in the list
    fn create(&self, id: &str, now: i64) -> impl Future<Output = Result<BackupInfo, StoreError>> + Send;

    /// Newest first
    fn list(&self) -> impl Future<Output = Result<Vec<BackupInfo>, StoreError>> + Send;

    /// Where the archive lies, for the download; `None` for an unknown id
    fn file(&self, id: &str) -> Option<PathBuf>;

    /// `false` for an unknown id
    fn delete(&self, id: &str) -> impl Future<Output = Result<bool, StoreError>> + Send;
}
