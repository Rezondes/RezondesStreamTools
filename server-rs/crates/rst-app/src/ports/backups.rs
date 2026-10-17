//! Port of the backup folder: server-wide archives of the data database and the encrypted files, never the keys.
//! Uploaded archives are checked before they count as backups; a restore replaces the data in one transaction.

use std::fmt;
use std::future::Future;
use std::path::PathBuf;

use rst_domain::identity::values::StreamerId;
use serde::Serialize;

use crate::ports::StoreError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ArchiveError {
    /// Not a backup of this server: missing manifest, wrong checksum, unknown or escaping entry, newer schema
    Invalid(String),
    NotFound,
    Store(StoreError),
}

impl fmt::Display for ArchiveError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(reason) => write!(formatter, "invalid backup: {reason}"),
            Self::NotFound => formatter.write_str("unknown backup"),
            Self::Store(error) => error.fmt(formatter),
        }
    }
}

impl From<StoreError> for ArchiveError {
    fn from(error: StoreError) -> Self {
        Self::Store(error)
    }
}

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

    /// Where an upload under `id` is written; it never shows up in the list before [`Self::accept`]
    fn incoming(&self, id: &str) -> PathBuf;

    /// Checks the uploaded archive and makes it a backup; a rejected one is deleted
    fn accept(&self, id: &str) -> impl Future<Output = Result<BackupInfo, ArchiveError>> + Send;

    /// Checks the archive and returns the streamers in it
    fn inspect(&self, id: &str) -> impl Future<Output = Result<Vec<StreamerId>, ArchiveError>> + Send;

    /// Replaces the data and the files with the archive, only for the streamers in `keep`; nothing changes on error
    fn restore(&self, id: &str, keep: &[StreamerId]) -> impl Future<Output = Result<(), ArchiveError>> + Send;
}
