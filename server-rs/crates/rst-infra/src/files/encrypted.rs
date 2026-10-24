//! Encrypted files of a streamer under `<root>/<streamer-id>/<name>` (replaces `media/` and `render/` in the profile
//! folder and `server/atomicFile.ts`). STREAM construction: the plaintext is cut into 64 KiB blocks, each sealed with
//! a nonce of random file prefix, block counter and a last-block flag, so missing, reordered or cut-off blocks are
//! detected. Writing goes to a temporary file that is renamed at the end. Decrypted files are cached up to a size
//! limit (`RST_FILE_CACHE_MB`, default 64).

use std::collections::{BTreeMap, HashMap};
use std::fs::{self, File};
use std::io::{ErrorKind, Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};

use rst_app::crypto::cipher::{NONCE_LEN, open_block, random_bytes, seal_block};
use rst_app::crypto::to_hex;
use rst_app::ports::StoreError;
use rst_app::ports::files::{Blocks, FileStore, FileWriter};
use rst_app::ports::keys::DataKey;
use rst_domain::identity::values::StreamerId;
use sha2::{Digest, Sha256};

pub const FILE_CACHE_VAR: &str = "RST_FILE_CACHE_MB";
const DEFAULT_CACHE_MB: usize = 64;
/// Plaintext bytes per block
pub const BLOCK: usize = 64 * 1024;
const TAG: usize = 16;
const MAGIC: &[u8; 5] = b"RSTF1";
const PREFIX: usize = NONCE_LEN - 5;

/// Cache size from `RST_FILE_CACHE_MB`; missing or invalid gives the default
#[must_use]
pub fn cache_bytes(value: Option<&str>) -> usize {
    value.and_then(|value| value.trim().parse::<usize>().ok()).unwrap_or(DEFAULT_CACHE_MB).saturating_mul(1024 * 1024)
}

fn nonce(prefix: &[u8; PREFIX], counter: u32, last: bool) -> [u8; NONCE_LEN] {
    let mut nonce = [0; NONCE_LEN];
    nonce[..PREFIX].copy_from_slice(prefix);
    nonce[PREFIX..PREFIX + 4].copy_from_slice(&counter.to_be_bytes());
    nonce[NONCE_LEN - 1] = u8::from(last);
    nonce
}

fn aad(streamer: &StreamerId, name: &str) -> Vec<u8> {
    format!("file\0{}\0{name}", streamer.as_str()).into_bytes()
}

/// Random names only: lower case letters, digits, `_` and `-`, at most 64
fn is_name(name: &str) -> bool {
    (1..=64).contains(&name.len())
        && name.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || b"_-".contains(&byte))
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
}

type CacheKey = (String, [u8; 32]);

/// Decrypted files, the least recently used drops out first: the files by key with the number of their last use, the
/// keys by that number
#[derive(Debug, Default)]
struct Cache {
    capacity: usize,
    used: usize,
    entries: HashMap<CacheKey, (u64, Arc<Vec<u8>>)>,
    order: BTreeMap<u64, CacheKey>,
    next: u64,
}

impl Cache {
    fn get(&mut self, key: &CacheKey) -> Option<Arc<Vec<u8>>> {
        let use_number = self.next;
        let (last, data) = self.entries.get_mut(key)?;
        self.order.remove(last);
        *last = use_number;
        let data = Arc::clone(data);
        self.order.insert(use_number, key.clone());
        self.next += 1;
        Some(data)
    }

    fn insert(&mut self, key: CacheKey, data: Arc<Vec<u8>>) {
        if data.len() > self.capacity {
            return;
        }
        self.forget(|known| *known == key.0);
        while self.used + data.len() > self.capacity {
            let Some((_, oldest)) = self.order.pop_first() else { break };
            if let Some((_, dropped)) = self.entries.remove(&oldest) {
                self.used -= dropped.len();
            }
        }
        self.used += data.len();
        self.order.insert(self.next, key.clone());
        self.entries.insert(key, (self.next, data));
        self.next += 1;
    }

    /// Whether a file whose path ends with `end` is cached (for the tests)
    #[cfg(test)]
    fn holds(&self, end: &str) -> bool {
        self.entries.keys().any(|(path, _)| path.ends_with(end))
    }

    /// Drops every cached version of the matching paths (only on writing and deleting, so a pass over all is fine)
    fn forget(&mut self, matches: impl Fn(&str) -> bool) {
        let (mut used, order) = (self.used, &mut self.order);
        self.entries.retain(|(path, _), (last, data)| {
            let keep = !matches(path);
            if !keep {
                used -= data.len();
                order.remove(last);
            }
            keep
        });
        self.used = used;
    }
}

#[derive(Debug, Clone)]
pub struct EncryptedFiles {
    root: PathBuf,
    cache: Arc<Mutex<Cache>>,
}

impl EncryptedFiles {
    #[must_use]
    pub fn new(root: &Path, cache_bytes: usize) -> Self {
        Self { root: root.to_owned(), cache: Arc::new(Mutex::new(Cache { capacity: cache_bytes, ..Cache::default() })) }
    }

    fn folder(&self, streamer: &StreamerId) -> PathBuf {
        self.root.join(streamer.as_str())
    }

    fn path(&self, streamer: &StreamerId, name: &str) -> Result<PathBuf, StoreError> {
        if is_name(name) { Ok(self.folder(streamer).join(name)) } else { Err(StoreError::new("invalid file name")) }
    }

    fn cache_key(path: &Path, key: &DataKey) -> CacheKey {
        (path.to_string_lossy().into_owned(), Sha256::digest(key.bytes()).into())
    }

    fn forget(&self, path: &Path) {
        let path = path.to_string_lossy().into_owned();
        lock(&self.cache).forget(|known| known == path);
    }
}

pub struct EncryptedWriter {
    file: Option<File>,
    temporary: PathBuf,
    target: PathBuf,
    key: DataKey,
    prefix: [u8; PREFIX],
    counter: u32,
    pending: Vec<u8>,
    aad: Vec<u8>,
    size: u64,
    cache: Arc<Mutex<Cache>>,
}

impl EncryptedWriter {
    fn emit(&mut self, plaintext: &[u8], last: bool) -> Result<(), StoreError> {
        let nonce = nonce(&self.prefix, self.counter, last);
        let sealed = seal_block(self.key.bytes(), &nonce, plaintext, &self.aad).map_err(StoreError::new)?;
        self.file
            .as_mut()
            .ok_or_else(|| StoreError::new("file already finished"))?
            .write_all(&sealed)
            .map_err(StoreError::new)?;
        self.counter = self.counter.checked_add(1).ok_or_else(|| StoreError::new("file too large"))?;
        Ok(())
    }
}

impl FileWriter for EncryptedWriter {
    fn write(&mut self, chunk: &[u8]) -> Result<(), StoreError> {
        self.pending.extend_from_slice(chunk);
        self.size += chunk.len() as u64;
        // A full block stays pending so the last block can carry the last flag
        while self.pending.len() > BLOCK {
            let block: Vec<u8> = self.pending.drain(..BLOCK).collect();
            self.emit(&block, false)?;
        }
        Ok(())
    }

    fn finish(mut self) -> Result<u64, StoreError> {
        let last = std::mem::take(&mut self.pending);
        self.emit(&last, true)?;
        let file = self.file.take().ok_or_else(|| StoreError::new("file already finished"))?;
        file.sync_all().map_err(StoreError::new)?;
        drop(file);
        fs::rename(&self.temporary, &self.target).map_err(StoreError::new)?;
        let target = self.target.to_string_lossy().into_owned();
        lock(&self.cache).forget(|known| known == target);
        Ok(self.size)
    }
}

impl Drop for EncryptedWriter {
    fn drop(&mut self) {
        // Not finished: the temporary file goes, the old file stays
        if self.file.take().is_some() {
            let _ = fs::remove_file(&self.temporary);
        }
    }
}

struct BlockReader {
    file: File,
    key: DataKey,
    prefix: [u8; PREFIX],
    counter: u32,
    aad: Vec<u8>,
    ahead: Vec<u8>,
    done: bool,
}

/// Up to one sealed block; empty at the end of the file
fn read_chunk(file: &mut File) -> Result<Vec<u8>, StoreError> {
    let mut chunk = vec![0; BLOCK + TAG];
    let mut filled = 0;
    while filled < chunk.len() {
        match file.read(&mut chunk[filled..]) {
            Ok(0) => break,
            Ok(read) => filled += read,
            Err(error) if error.kind() == ErrorKind::Interrupted => {}
            Err(error) => return Err(StoreError::new(error)),
        }
    }
    chunk.truncate(filled);
    Ok(chunk)
}

impl BlockReader {
    fn next_block(&mut self) -> Result<Vec<u8>, StoreError> {
        let current = std::mem::take(&mut self.ahead);
        if current.is_empty() {
            return Err(StoreError::new("file cut off"));
        }
        let following = read_chunk(&mut self.file)?;
        let last = following.is_empty();
        let nonce = nonce(&self.prefix, self.counter, last);
        let plaintext = open_block(self.key.bytes(), &nonce, &current, &self.aad)
            .map_err(|_| StoreError::new("file block changed, missing or cut off"))?;
        self.counter = self.counter.checked_add(1).ok_or_else(|| StoreError::new("file too large"))?;
        self.done = last;
        self.ahead = following;
        Ok(plaintext)
    }
}

impl Iterator for BlockReader {
    type Item = Result<Vec<u8>, StoreError>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.done {
            return None;
        }
        let block = self.next_block();
        if block.is_err() {
            self.done = true;
        }
        Some(block)
    }
}

impl FileStore for EncryptedFiles {
    type Writer = EncryptedWriter;

    fn create(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<EncryptedWriter, StoreError> {
        let target = self.path(streamer, name)?;
        fs::create_dir_all(self.folder(streamer)).map_err(StoreError::new)?;
        let random: [u8; 8] = random_bytes().map_err(StoreError::new)?;
        let temporary = self.folder(streamer).join(format!("{name}.{}.tmp", to_hex(&random)));
        let mut file = File::create_new(&temporary).map_err(StoreError::new)?;
        let prefix: [u8; PREFIX] = random_bytes().map_err(StoreError::new)?;
        file.write_all(MAGIC).and_then(|()| file.write_all(&prefix)).map_err(StoreError::new)?;
        Ok(EncryptedWriter {
            file: Some(file),
            temporary,
            target,
            key: key.clone(),
            prefix,
            counter: 0,
            pending: Vec::new(),
            aad: aad(streamer, name),
            size: 0,
            cache: Arc::clone(&self.cache),
        })
    }

    fn read(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<Option<Arc<Vec<u8>>>, StoreError> {
        let path = self.path(streamer, name)?;
        let cache_key = Self::cache_key(&path, key);
        if let Some(cached) = lock(&self.cache).get(&cache_key) {
            return Ok(Some(cached));
        }
        let Some(blocks) = self.blocks(key, streamer, name)? else { return Ok(None) };
        let mut data = Vec::new();
        for block in blocks {
            data.extend_from_slice(&block?);
        }
        let data = Arc::new(data);
        lock(&self.cache).insert(cache_key, Arc::clone(&data));
        Ok(Some(data))
    }

    fn blocks(&self, key: &DataKey, streamer: &StreamerId, name: &str) -> Result<Option<Blocks>, StoreError> {
        let path = self.path(streamer, name)?;
        let mut file = match File::open(&path) {
            Ok(file) => file,
            Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(StoreError::new(error)),
        };
        let mut header = [0; MAGIC.len() + PREFIX];
        file.read_exact(&mut header).map_err(|_| StoreError::new("file header missing"))?;
        if &header[..MAGIC.len()] != MAGIC {
            return Err(StoreError::new("not an encrypted file"));
        }
        let mut prefix = [0; PREFIX];
        prefix.copy_from_slice(&header[MAGIC.len()..]);
        let ahead = read_chunk(&mut file)?;
        let reader =
            BlockReader { file, key: key.clone(), prefix, counter: 0, aad: aad(streamer, name), ahead, done: false };
        Ok(Some(Box::new(reader)))
    }

    fn delete(&self, streamer: &StreamerId, name: &str) -> Result<bool, StoreError> {
        let path = self.path(streamer, name)?;
        self.forget(&path);
        match fs::remove_file(&path) {
            Ok(()) => Ok(true),
            Err(error) if error.kind() == ErrorKind::NotFound => Ok(false),
            Err(error) => Err(StoreError::new(error)),
        }
    }

    fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        let folder = self.folder(streamer);
        let prefix = folder.to_string_lossy().into_owned();
        lock(&self.cache).forget(|known| known.starts_with(&prefix));
        match fs::remove_dir_all(&folder) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
            Err(error) => Err(StoreError::new(error)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn key() -> DataKey {
        DataKey::from_bytes([7; 32])
    }

    fn store(folder: &tempfile::TempDir, cache: usize) -> EncryptedFiles {
        EncryptedFiles::new(folder.path(), cache)
    }

    fn write(files: &EncryptedFiles, name: &str, data: &[u8]) {
        let mut writer = files.create(&key(), &neo(), name).expect("create");
        for chunk in data.chunks(10_000) {
            writer.write(chunk).expect("write");
        }
        assert_eq!(writer.finish().expect("finish"), data.len() as u64);
    }

    fn pattern(size: usize) -> Vec<u8> {
        (0..size).map(|index| u8::try_from(index % 251).unwrap_or(0)).collect()
    }

    #[test]
    fn round_trip_for_every_size_around_the_block() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 0);
        for size in [0, 1, BLOCK - 1, BLOCK, BLOCK + 1, 3 * BLOCK] {
            let data = pattern(size);
            write(&files, "clip", &data);
            assert_eq!(files.read(&key(), &neo(), "clip").expect("read").as_deref(), Some(&data), "{size}");
        }
        assert_eq!(files.read(&key(), &neo(), "missing").expect("read"), None);
    }

    #[test]
    fn large_files_stream_block_by_block() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 0);
        let mut writer = files.create(&key(), &neo(), "big").expect("create");
        let chunk = pattern(1024 * 1024);
        for _ in 0..50 {
            writer.write(&chunk).expect("write");
        }
        assert_eq!(writer.finish().expect("finish"), 50 * 1024 * 1024);
        let mut total = 0;
        for block in files.blocks(&key(), &neo(), "big").expect("open").expect("file") {
            let block = block.expect("block");
            assert!(block.len() <= BLOCK);
            total += block.len();
        }
        assert_eq!(total, 50 * 1024 * 1024);
    }

    #[test]
    fn cut_reordered_or_foreign_blocks_fail() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 0);
        write(&files, "clip", &pattern(3 * BLOCK + 10));
        let path = folder.path().join(neo().as_str()).join("clip");
        let original = fs::read(&path).expect("raw");
        let header = MAGIC.len() + PREFIX;
        let sealed = BLOCK + TAG;
        // Cut off after two whole blocks: the second block was not written as the last one
        fs::write(&path, &original[..header + 2 * sealed]).expect("cut");
        assert!(files.read(&key(), &neo(), "clip").is_err());
        // First two blocks swapped
        let mut swapped = original[..header].to_vec();
        swapped.extend_from_slice(&original[header + sealed..header + 2 * sealed]);
        swapped.extend_from_slice(&original[header..header + sealed]);
        swapped.extend_from_slice(&original[header + 2 * sealed..]);
        fs::write(&path, &swapped).expect("swap");
        assert!(files.read(&key(), &neo(), "clip").is_err());
        // Header only
        fs::write(&path, &original[..header]).expect("header only");
        assert!(files.read(&key(), &neo(), "clip").is_err());
        // Another key or another name
        fs::write(&path, &original).expect("restore");
        assert!(files.read(&DataKey::from_bytes([8; 32]), &neo(), "clip").is_err());
        fs::copy(&path, folder.path().join(neo().as_str()).join("other")).expect("copy");
        assert!(files.read(&key(), &neo(), "other").is_err());
        assert!(files.read(&key(), &neo(), "clip").expect("intact").is_some());
    }

    #[test]
    fn cache_holds_at_most_its_limit_and_gives_the_same_bytes() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 3 * BLOCK);
        write(&files, "a", &pattern(BLOCK));
        write(&files, "b", &pattern(2 * BLOCK));
        let first = files.read(&key(), &neo(), "a").expect("read").expect("a");
        files.read(&key(), &neo(), "b").expect("read");
        assert!(lock(&files.cache).used <= 3 * BLOCK);
        assert_eq!(files.read(&key(), &neo(), "a").expect("cached").expect("a"), first);
        write(&files, "c", &pattern(2 * BLOCK));
        files.read(&key(), &neo(), "c").expect("read");
        assert!(lock(&files.cache).used <= 3 * BLOCK);
        // A new version replaces the cached one
        write(&files, "c", b"new");
        assert_eq!(files.read(&key(), &neo(), "c").expect("read").as_deref().map(Vec::as_slice), Some(&b"new"[..]));
        // The cache never answers for a wrong key
        assert!(files.read(&DataKey::from_bytes([8; 32]), &neo(), "c").is_err());
        assert_eq!(cache_bytes(None), 64 * 1024 * 1024);
        assert_eq!(cache_bytes(Some("2")), 2 * 1024 * 1024);
        assert_eq!(cache_bytes(Some("lots")), 64 * 1024 * 1024);
    }

    #[test]
    fn the_least_recently_read_drops_out_first() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 3 * BLOCK);
        for name in ["a", "b", "c"] {
            write(&files, name, &pattern(BLOCK));
            files.read(&key(), &neo(), name).expect("read");
        }
        files.read(&key(), &neo(), "a").expect("read again");
        write(&files, "d", &pattern(BLOCK));
        files.read(&key(), &neo(), "d").expect("read");
        let cache = lock(&files.cache);
        assert!(!cache.holds("b"), "b was read longest ago");
        assert!(cache.holds("a") && cache.holds("c") && cache.holds("d"));
        assert_eq!(cache.used, 3 * BLOCK);
    }

    #[test]
    fn forget_drops_a_path_and_its_bytes() {
        let mut cache = Cache { capacity: 100, ..Cache::default() };
        cache.insert(("one".to_owned(), [1; 32]), Arc::new(vec![0; 30]));
        cache.insert(("two".to_owned(), [2; 32]), Arc::new(vec![0; 20]));
        cache.forget(|path| path == "one");
        assert!(!cache.holds("one") && cache.holds("two"));
        assert_eq!(cache.used, 20);
        assert!(cache.get(&("one".to_owned(), [1; 32])).is_none());
        assert_eq!(cache.get(&("two".to_owned(), [2; 32])).map(|data| data.len()), Some(20));
    }

    #[test]
    fn delete_one_and_the_folder_of_a_streamer() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, BLOCK);
        write(&files, "a", b"one");
        write(&files, "b", b"two");
        files.read(&key(), &neo(), "a").expect("read");
        assert!(files.delete(&neo(), "a").expect("delete"));
        assert!(!files.delete(&neo(), "a").expect("delete again"));
        assert_eq!(files.read(&key(), &neo(), "a").expect("read"), None);
        files.delete_streamer(&neo()).expect("delete streamer");
        assert!(!folder.path().join(neo().as_str()).exists());
        files.delete_streamer(&neo()).expect("again");
        assert!(files.create(&key(), &neo(), "../escape").is_err());
        assert!(files.create(&key(), &neo(), "a.tmp").is_err());
    }

    #[test]
    fn an_unfinished_write_leaves_nothing_behind() {
        let folder = tempfile::tempdir().expect("temp folder");
        let files = store(&folder, 0);
        write(&files, "keep", b"old");
        let mut writer = files.create(&key(), &neo(), "keep").expect("create");
        writer.write(b"half").expect("write");
        drop(writer);
        assert_eq!(files.read(&key(), &neo(), "keep").expect("read").as_deref().map(Vec::as_slice), Some(&b"old"[..]));
        let names: Vec<_> = fs::read_dir(folder.path().join(neo().as_str()))
            .expect("list")
            .map(|entry| entry.expect("entry").file_name())
            .collect();
        assert_eq!(names, ["keep"]);
    }
}
