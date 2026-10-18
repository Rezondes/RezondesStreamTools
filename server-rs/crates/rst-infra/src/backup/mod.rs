//! Backups: ZIP archives of the data database and the encrypted files, checked before a restore, and the daily
//! copies of the key store.

pub mod archive;
pub mod keys;
pub mod restore;

use std::path::Path;
use std::time::Duration;

/// Tries to delete a file that another process holds open, with a growing pause in between
const DELETE_ATTEMPTS: u32 = 5;
const DELETE_PAUSE: Duration = Duration::from_millis(100);

/// Deletes a backup file; true = deleted, false = it was not there. On Windows a virus scanner or indexer may hold a
/// fresh copy open for a moment (os error 32), so a failed delete is tried again a few times before it counts.
async fn remove_patiently(path: &Path) -> std::io::Result<bool> {
    let mut attempt = 1;
    loop {
        match tokio::fs::remove_file(path).await {
            Ok(()) => return Ok(true),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(false),
            Err(_) if attempt < DELETE_ATTEMPTS => {
                tokio::time::sleep(DELETE_PAUSE * attempt).await;
                attempt += 1;
            }
            Err(error) => return Err(error),
        }
    }
}
