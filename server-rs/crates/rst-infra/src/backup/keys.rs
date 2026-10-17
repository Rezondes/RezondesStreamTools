//! Key backups in `RST_KEY_BACKUPS`: `keys-<ms>.db`, a consistent copy of the key store made with `VACUUM INTO`, so
//! the copy holds no freed pages of shredded keys. The data keys in it stay wrapped by the master key.

use std::path::{Path, PathBuf};

use rst_app::backup::keys::KeyBackupStore;
use rst_app::ports::StoreError;

use crate::keys::sqlite::SqliteKeyStore;

/// `RST_KEY_BACKUPS` names the folder, otherwise `<data>/key-backups`
pub const KEY_BACKUPS_VAR: &str = "RST_KEY_BACKUPS";

#[derive(Debug, Clone)]
pub struct FolderKeyBackups {
    keys: SqliteKeyStore,
    folder: PathBuf,
}

impl FolderKeyBackups {
    #[must_use]
    pub fn new(keys: SqliteKeyStore, folder: &Path) -> Self {
        Self { keys, folder: folder.to_owned() }
    }

    fn path(&self, made_at: i64) -> PathBuf {
        self.folder.join(format!("keys-{made_at}.db"))
    }
}

impl KeyBackupStore for FolderKeyBackups {
    async fn create(&self, now: i64) -> Result<(), StoreError> {
        tokio::fs::create_dir_all(&self.folder).await.map_err(StoreError::new)?;
        let target = self.path(now);
        if tokio::fs::try_exists(&target).await.map_err(StoreError::new)? {
            return Ok(());
        }
        self.keys.copy_to(&target).await
    }

    async fn list(&self) -> Result<Vec<i64>, StoreError> {
        let mut entries = match tokio::fs::read_dir(&self.folder).await {
            Ok(entries) => entries,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(error) => return Err(StoreError::new(error)),
        };
        let mut made = Vec::new();
        while let Some(entry) = entries.next_entry().await.map_err(StoreError::new)? {
            let name = entry.file_name();
            let time: Option<i64> =
                name.to_str().and_then(|name| name.strip_prefix("keys-")?.strip_suffix(".db")?.parse().ok());
            made.extend(time);
        }
        made.sort_unstable();
        Ok(made)
    }

    async fn delete(&self, made_at: i64) -> Result<(), StoreError> {
        match tokio::fs::remove_file(self.path(made_at)).await {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(StoreError::new(error)),
        }
    }
}

#[cfg(test)]
mod tests {
    use rst_app::backup::keys::{EVERY_MS, run_key_backups};
    use rst_app::ports::keys::KeyStore;
    use rst_domain::identity::values::StreamerId;

    use super::*;
    use crate::crypto::master::MasterKey;

    #[tokio::test]
    async fn copies_without_shredded_keys_and_deleted_after_thirty_days() {
        let folder = tempfile::tempdir().expect("temp folder");
        let master = MasterKey::from_bytes([3; 32]);
        let keys = SqliteKeyStore::open(&folder.path().join("keys.db"), master.clone()).await.expect("keys");
        let (kept, shredded) = (StreamerId::from_bytes([1; 16]), StreamerId::from_bytes([2; 16]));
        keys.create(&kept).await.expect("key");
        keys.create(&shredded).await.expect("key");
        keys.shred(&shredded).await.expect("shred");
        let backups = FolderKeyBackups::new(keys, &folder.path().join("key-backups"));
        run_key_backups(&backups, 1000).await.expect("backup");
        assert_eq!(backups.list().await.expect("list"), [1000]);
        let copy = SqliteKeyStore::open(&backups.path(1000), master).await.expect("copy");
        assert!(copy.get(&kept).await.expect("get").is_some());
        assert!(copy.get(&shredded).await.expect("get").is_none());
        copy.close().await;
        run_key_backups(&backups, 1000 + 31 * EVERY_MS).await.expect("later");
        assert_eq!(backups.list().await.expect("list"), [1000 + 31 * EVERY_MS]);
    }
}
