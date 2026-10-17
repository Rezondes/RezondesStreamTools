//! Media and rendered files of a streamer: the bytes go encrypted into the file store under a random name, the
//! plaintext name and size live as an encrypted record (kind `media` or `render`, key = the random name). So
//! neither the folder nor the database shows which files a streamer has.
//!
//! The file store blocks on disk IO; the server calls these on a blocking thread.

use std::sync::Arc;

use rst_domain::identity::values::StreamerId;
use rst_domain::media::library::triggers_using;
use rst_domain::triggers::Trigger;
use serde::{Deserialize, Serialize};

use crate::crypto::to_hex;
use crate::ports::StoreError;
use crate::ports::files::{FileStore, FileWriter};
use crate::ports::keys::{DataKey, KeyStore};
use crate::ports::records::RecordStore;
use crate::vault::{Vault, VaultError};

/// Uploaded media (`media`) or rendered outputs (`render`)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Shelf {
    Media,
    Render,
}

impl Shelf {
    const fn kind(self) -> &'static str {
        match self {
            Self::Media => "media",
            Self::Render => "render",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StoredFile {
    pub name: String,
    pub size: u64,
    /// Random name in the file store
    #[serde(skip)]
    pub file: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MediaEntry {
    pub name: String,
    pub size: u64,
    #[serde(rename = "usedBy")]
    pub used_by: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MediaOverview {
    pub files: Vec<MediaEntry>,
    #[serde(rename = "usedBytes")]
    pub used_bytes: u64,
    #[serde(rename = "limitBytes")]
    pub limit_bytes: u64,
}

fn store_error(error: StoreError) -> VaultError {
    VaultError::Store(error)
}

#[derive(Debug, Clone)]
pub struct MediaLibrary<S, K, F> {
    vault: Vault<S, K>,
    files: F,
}

impl<S: RecordStore, K: KeyStore, F: FileStore> MediaLibrary<S, K, F> {
    pub const fn new(vault: Vault<S, K>, files: F) -> Self {
        Self { vault, files }
    }

    async fn data_key(&self, id: &StreamerId) -> Result<DataKey, VaultError> {
        self.vault.keys().get(id).await?.ok_or(VaultError::Unreadable)
    }

    /// All files of a shelf, sorted by name
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn list(&self, id: &StreamerId, place: Shelf) -> Result<Vec<StoredFile>, VaultError> {
        let mut files = Vec::new();
        for (file, plaintext) in self.vault.list(id, place.kind()).await? {
            let stored: StoredFile = serde_json::from_slice(&plaintext).map_err(|_| VaultError::Unreadable)?;
            files.push(StoredFile { file, ..stored });
        }
        files.sort_by(|first, second| first.name.cmp(&second.name));
        Ok(files)
    }

    async fn find(&self, id: &StreamerId, place: Shelf, name: &str) -> Result<Option<StoredFile>, VaultError> {
        Ok(self.list(id, place).await?.into_iter().find(|stored| stored.name == name))
    }

    /// Stores a file under `name` (checked by the caller); a file of the same name is replaced. `random`: the new
    /// random file name, drawn by the caller.
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded, `Store` when writing fails.
    pub async fn store(
        &self,
        id: &StreamerId,
        place: Shelf,
        name: &str,
        data: &[u8],
        random: [u8; 16],
        now: i64,
    ) -> Result<StoredFile, VaultError> {
        let (mut writer, file) = self.writer(id, random).await?;
        writer.write(data).map_err(store_error)?;
        let size = writer.finish().map_err(store_error)?;
        self.commit(id, place, name, file, size, now).await
    }

    /// A writer for a new file under a random name (drawn by the caller); after `finish`, [`Self::commit`] gives
    /// it its name. An upload streams through it without being held in memory as a whole.
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded, `Store` when the file cannot be created.
    pub async fn writer(&self, id: &StreamerId, random: [u8; 16]) -> Result<(F::Writer, String), VaultError> {
        let key = self.data_key(id).await?;
        let file = to_hex(&random);
        let writer = self.files.create(&key, id, &file).map_err(store_error)?;
        Ok((writer, file))
    }

    /// Names a finished file; a file of the same name is replaced
    ///
    /// # Errors
    /// When a store fails.
    pub async fn commit(
        &self,
        id: &StreamerId,
        place: Shelf,
        name: &str,
        file: String,
        size: u64,
        now: i64,
    ) -> Result<StoredFile, VaultError> {
        let stored = StoredFile { name: name.to_owned(), size, file: file.clone() };
        self.vault.put_json(id, place.kind(), &file, &stored, now).await?;
        for old in self.list(id, place).await?.into_iter().filter(|old| old.name == name && old.file != file) {
            self.vault.delete(id, place.kind(), &old.file).await?;
            self.files.delete(id, &old.file).map_err(store_error)?;
        }
        Ok(stored)
    }

    /// The media for the dashboard: size and the triggers that use each file, plus used and allowed storage
    ///
    /// # Errors
    /// As [`Self::list`].
    pub async fn overview(
        &self,
        id: &StreamerId,
        triggers: &[Trigger],
        limit_bytes: u64,
    ) -> Result<MediaOverview, VaultError> {
        let files: Vec<MediaEntry> = self
            .list(id, Shelf::Media)
            .await?
            .into_iter()
            .map(|stored| MediaEntry {
                used_by: triggers_using(triggers, &stored.name),
                name: stored.name,
                size: stored.size,
            })
            .collect();
        Ok(MediaOverview { used_bytes: files.iter().map(|file| file.size).sum(), files, limit_bytes })
    }

    /// `None` if there is no file of that name
    ///
    /// # Errors
    /// `Unreadable` after shredding or for a damaged file.
    pub async fn read(&self, id: &StreamerId, place: Shelf, name: &str) -> Result<Option<Arc<Vec<u8>>>, VaultError> {
        let Some(stored) = self.find(id, place, name).await? else { return Ok(None) };
        let key = self.data_key(id).await?;
        self.files.read(&key, id, &stored.file).map_err(|_| VaultError::Unreadable)
    }

    /// `true` if there was a file
    ///
    /// # Errors
    /// As [`Self::list`].
    pub async fn delete(&self, id: &StreamerId, place: Shelf, name: &str) -> Result<bool, VaultError> {
        let Some(stored) = self.find(id, place, name).await? else { return Ok(false) };
        self.vault.delete(id, place.kind(), &stored.file).await?;
        self.files.delete(id, &stored.file).map_err(store_error)?;
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::{MemoryFiles, MemoryKeys, MemoryRecords};

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    async fn library() -> MediaLibrary<MemoryRecords, MemoryKeys, MemoryFiles> {
        let vault = Vault::new(MemoryRecords::default(), MemoryKeys::default());
        vault.keys().create(&neo()).await.expect("key");
        MediaLibrary::new(vault, MemoryFiles::default())
    }

    #[tokio::test]
    async fn store_list_read_replace_and_delete() {
        let library = library().await;
        library.store(&neo(), Shelf::Media, "lizard.gif", b"GIF", [1; 16], 1).await.expect("store");
        library.store(&neo(), Shelf::Media, "beep.wav", b"RIFF", [2; 16], 1).await.expect("store");
        library.store(&neo(), Shelf::Render, "stinger.webm", b"WEBM", [3; 16], 1).await.expect("store");
        let names: Vec<(String, u64)> = library
            .list(&neo(), Shelf::Media)
            .await
            .expect("list")
            .into_iter()
            .map(|file| (file.name, file.size))
            .collect();
        assert_eq!(names, [("beep.wav".to_owned(), 4), ("lizard.gif".to_owned(), 3)]);
        assert_eq!(
            library.read(&neo(), Shelf::Media, "lizard.gif").await.expect("read").as_deref().map(Vec::as_slice),
            Some(&b"GIF"[..])
        );
        assert_eq!(library.read(&neo(), Shelf::Media, "stinger.webm").await.expect("other shelf"), None);
        library.store(&neo(), Shelf::Media, "lizard.gif", b"GIF89a", [4; 16], 2).await.expect("replace");
        assert_eq!(library.list(&neo(), Shelf::Media).await.expect("list").len(), 2);
        assert_eq!(library.files.names(), 3);
        assert!(library.delete(&neo(), Shelf::Media, "lizard.gif").await.expect("delete"));
        assert!(!library.delete(&neo(), Shelf::Media, "lizard.gif").await.expect("delete again"));
        assert_eq!(library.files.names(), 2);
    }
}
