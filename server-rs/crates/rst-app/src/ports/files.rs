//! Port of the file store: media and rendered files of a streamer, encrypted with the streamer's data key in blocks,
//! so large files are never held in memory as a whole. File names are random (the plaintext name lives encrypted in
//! the records). The calls block on disk IO; async callers run them on a blocking thread.

use std::sync::Arc;

use rst_domain::identity::values::StreamerId;

use crate::ports::StoreError;
use crate::ports::keys::DataKey;

/// Decrypted blocks of a file in order; an error ends the iteration
pub type Blocks = Box<dyn Iterator<Item = Result<Vec<u8>, StoreError>> + Send>;

/// Writes a file in pieces; it only appears under its name after `finish`
pub trait FileWriter: Send {
    /// # Errors
    /// When writing to disk or encrypting fails.
    fn write(&mut self, chunk: &[u8]) -> Result<(), StoreError>;

    /// Returns the plaintext size in bytes
    ///
    /// # Errors
    /// When writing to disk fails; then the file does not appear.
    fn finish(self) -> Result<u64, StoreError>;
}

pub trait FileStore: Send + Sync {
    type Writer: FileWriter;

    /// # Errors
    /// For an invalid name or when the folder cannot be created.
    fn create(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<Self::Writer, StoreError>;

    /// The whole file, from the cache when possible; `None` if it does not exist
    ///
    /// # Errors
    /// When a block is missing, changed or the key does not fit.
    fn read(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<Option<Arc<Vec<u8>>>, StoreError>;

    /// The file block by block, for large files; `None` if it does not exist
    ///
    /// # Errors
    /// When the file cannot be opened.
    fn blocks(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<Option<Blocks>, StoreError>;

    /// `true` if there was a file
    ///
    /// # Errors
    /// When deleting fails.
    fn delete(&self, streamer: &StreamerId, name: &str) -> Result<bool, StoreError>;

    /// Removes the folder of the streamer
    ///
    /// # Errors
    /// When deleting fails.
    fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError>;
}
