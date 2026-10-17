//! Backups as ZIP archives in `RST_BACKUPS`: `db/<table>.jsonl` with one row per line (binary columns base64, the
//! ciphertext stays ciphertext), `files/<streamer-id>/<name>` with the encrypted files as they are on disk, and
//! `manifest.json` with the archive format, the database migration and the SHA-256 of every entry. Sessions and the
//! key store are not part of it. An archive is written under a temporary name and renamed when complete.

use std::fs::{self, File};
use std::io::{BufWriter, Read, Write};
use std::path::{Path, PathBuf};

use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use rst_app::backup::is_backup_id;
use rst_app::crypto::to_hex;
use rst_app::ports::StoreError;
use rst_app::ports::backups::{BackupInfo, BackupStore};
use serde_json::{Map, Value, json};
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqliteRow;
use sqlx::{Row, SqlitePool};
use zip::ZipWriter;
use zip::write::SimpleFileOptions;

/// Version of the archive layout
pub const ARCHIVE_FORMAT: u32 = 1;
/// `RST_BACKUPS` names the folder, otherwise `<data>/backups`
pub const BACKUPS_VAR: &str = "RST_BACKUPS";

const EXTENSION: &str = "zip";
const PARTIAL: &str = "partial";

/// One table as lines of JSON
struct Table {
    name: &'static str,
    lines: Vec<u8>,
}

#[derive(Debug, Clone)]
pub struct ZipBackups {
    pool: SqlitePool,
    files: PathBuf,
    folder: PathBuf,
}

fn text(row: &SqliteRow, column: &str) -> Result<Value, StoreError> {
    row.try_get::<Option<String>, _>(column).map(|value| json!(value)).map_err(StoreError::new)
}

fn number(row: &SqliteRow, column: &str) -> Result<Value, StoreError> {
    row.try_get::<i64, _>(column).map(|value| json!(value)).map_err(StoreError::new)
}

fn bytes(row: &SqliteRow, column: &str) -> Result<Value, StoreError> {
    row.try_get::<Vec<u8>, _>(column).map(|value| json!(STANDARD.encode(value))).map_err(StoreError::new)
}

type Reader = fn(&SqliteRow, &str) -> Result<Value, StoreError>;

fn to_lines(rows: &[SqliteRow], columns: &[(&str, Reader)]) -> Result<Vec<u8>, StoreError> {
    let mut lines = Vec::new();
    for row in rows {
        let mut object = Map::new();
        for (column, read) in columns {
            object.insert((*column).to_owned(), read(row, column)?);
        }
        serde_json::to_writer(&mut lines, &Value::Object(object)).map_err(StoreError::new)?;
        lines.push(b'\n');
    }
    Ok(lines)
}

/// Copies `source` into the open entry and returns its SHA-256
fn copy_hashed(source: &mut impl Read, zip: &mut ZipWriter<BufWriter<File>>) -> Result<String, StoreError> {
    let mut hasher = Sha256::new();
    let mut buffer = vec![0; 64 * 1024];
    loop {
        let read = source.read(&mut buffer).map_err(StoreError::new)?;
        if read == 0 {
            return Ok(to_hex(&hasher.finalize()));
        }
        hasher.update(&buffer[..read]);
        zip.write_all(&buffer[..read]).map_err(StoreError::new)?;
    }
}

/// Every file below `root` with its path relative to it (always with `/`)
fn walk(root: &Path, dir: &Path, found: &mut Vec<(String, PathBuf)>) -> Result<(), StoreError> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(StoreError::new(error)),
    };
    for entry in entries {
        let path = entry.map_err(StoreError::new)?.path();
        if path.is_dir() {
            walk(root, &path, found)?;
        } else if let Ok(relative) = path.strip_prefix(root) {
            let parts: Vec<String> =
                relative.components().map(|part| part.as_os_str().to_string_lossy().into_owned()).collect();
            found.push((parts.join("/"), path));
        }
    }
    Ok(())
}

fn write_archive(target: &Path, tables: &[Table], files: &Path, manifest_head: Value) -> Result<(), StoreError> {
    let mut zip = ZipWriter::new(BufWriter::new(File::create(target).map_err(StoreError::new)?));
    let options = SimpleFileOptions::default();
    let mut sums = Map::new();
    for table in tables {
        let name = format!("db/{}.jsonl", table.name);
        zip.start_file(&name, options).map_err(StoreError::new)?;
        sums.insert(name, json!(copy_hashed(&mut table.lines.as_slice(), &mut zip)?));
    }
    let mut found = Vec::new();
    walk(files, files, &mut found)?;
    found.sort();
    for (relative, path) in found {
        let name = format!("files/{relative}");
        // Encrypted data does not compress
        zip.start_file(&name, options.compression_method(zip::CompressionMethod::Stored)).map_err(StoreError::new)?;
        let mut source = File::open(&path).map_err(StoreError::new)?;
        sums.insert(name, json!(copy_hashed(&mut source, &mut zip)?));
    }
    let mut manifest = manifest_head;
    manifest["files"] = Value::Object(sums);
    zip.start_file("manifest.json", options).map_err(StoreError::new)?;
    zip.write_all(&serde_json::to_vec_pretty(&manifest).map_err(StoreError::new)?).map_err(StoreError::new)?;
    let mut inner = zip.finish().map_err(StoreError::new)?;
    inner.flush().map_err(StoreError::new)?;
    inner.get_ref().sync_all().map_err(StoreError::new)
}

/// Parts of a backup id: automatic and the time
fn parse_id(id: &str) -> Option<(bool, i64)> {
    if !is_backup_id(id) {
        return None;
    }
    let (kind, rest) = id.split_once('-')?;
    let time = rest.split_once('-')?.0.parse().ok()?;
    Some((kind == "auto", time))
}

impl ZipBackups {
    /// `files`: the folder of the encrypted files; `folder`: where the archives go (created when missing)
    #[must_use]
    pub fn new(pool: SqlitePool, files: &Path, folder: &Path) -> Self {
        Self { pool, files: files.to_owned(), folder: folder.to_owned() }
    }

    fn path(&self, id: &str) -> PathBuf {
        self.folder.join(format!("{id}.{EXTENSION}"))
    }

    async fn tables(&self) -> Result<Vec<Table>, StoreError> {
        let fetch = |sql: &'static str| sqlx::query(sql).fetch_all(&self.pool);
        let streamers = fetch("SELECT id, user_id_hmac, login_hmac, created_at FROM streamers ORDER BY id").await;
        let records = fetch(
            "SELECT streamer_id, kind, record_key, ciphertext, updated_at FROM records \
             ORDER BY streamer_id, kind, record_key",
        )
        .await;
        let audit = fetch("SELECT id, streamer_id, created_at, ciphertext FROM audit_log ORDER BY id").await;
        let settings =
            fetch("SELECT setting_key, ciphertext, updated_at FROM server_settings ORDER BY setting_key").await;
        let error = StoreError::new;
        Ok(vec![
            Table {
                name: "streamers",
                lines: to_lines(
                    &streamers.map_err(error)?,
                    &[("id", text), ("user_id_hmac", bytes), ("login_hmac", bytes), ("created_at", number)],
                )?,
            },
            Table {
                name: "records",
                lines: to_lines(
                    &records.map_err(error)?,
                    &[
                        ("streamer_id", text),
                        ("kind", text),
                        ("record_key", text),
                        ("ciphertext", bytes),
                        ("updated_at", number),
                    ],
                )?,
            },
            Table {
                name: "audit_log",
                lines: to_lines(
                    &audit.map_err(error)?,
                    &[("id", number), ("streamer_id", text), ("created_at", number), ("ciphertext", bytes)],
                )?,
            },
            Table {
                name: "server_settings",
                lines: to_lines(
                    &settings.map_err(error)?,
                    &[("setting_key", text), ("ciphertext", bytes), ("updated_at", number)],
                )?,
            },
        ])
    }
}

impl BackupStore for ZipBackups {
    async fn create(&self, id: &str, now: i64) -> Result<BackupInfo, StoreError> {
        let (automatic, _) = parse_id(id).ok_or_else(|| StoreError::new("invalid backup id"))?;
        let migration: i64 = sqlx::query_scalar("SELECT COALESCE(MAX(version), 0) FROM _sqlx_migrations")
            .fetch_one(&self.pool)
            .await
            .map_err(StoreError::new)?;
        let tables = self.tables().await?;
        let head = json!({ "format": ARCHIVE_FORMAT, "migration": migration, "createdAt": now });
        let (files, folder, target) = (self.files.clone(), self.folder.clone(), self.path(id));
        let partial = target.with_extension(format!("{EXTENSION}.{PARTIAL}"));
        let bytes = tokio::task::spawn_blocking(move || {
            fs::create_dir_all(&folder).map_err(StoreError::new)?;
            if let Err(error) = write_archive(&partial, &tables, &files, head) {
                // A broken archive must not stay behind
                let _ = fs::remove_file(&partial);
                return Err(error);
            }
            fs::rename(&partial, &target).map_err(StoreError::new)?;
            fs::metadata(&target).map(|metadata| metadata.len()).map_err(StoreError::new)
        })
        .await
        .map_err(StoreError::new)??;
        Ok(BackupInfo { id: id.to_owned(), created_at: now, bytes, automatic })
    }

    async fn list(&self) -> Result<Vec<BackupInfo>, StoreError> {
        let mut entries = match tokio::fs::read_dir(&self.folder).await {
            Ok(entries) => entries,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(error) => return Err(StoreError::new(error)),
        };
        let mut found = Vec::new();
        while let Some(entry) = entries.next_entry().await.map_err(StoreError::new)? {
            let path = entry.path();
            let name = path.file_name().and_then(|name| name.to_str()).unwrap_or_default();
            let Some((id, (automatic, created_at))) =
                name.strip_suffix(".zip").and_then(|id| parse_id(id).map(|parts| (id, parts)))
            else {
                continue;
            };
            let bytes = entry.metadata().await.map_err(StoreError::new)?.len();
            found.push(BackupInfo { id: id.to_owned(), created_at, bytes, automatic });
        }
        found.sort_by(|first, second| second.created_at.cmp(&first.created_at).then(second.id.cmp(&first.id)));
        Ok(found)
    }

    fn file(&self, id: &str) -> Option<PathBuf> {
        let path = self.path(id);
        (is_backup_id(id) && path.is_file()).then_some(path)
    }

    async fn delete(&self, id: &str) -> Result<bool, StoreError> {
        if !is_backup_id(id) {
            return Ok(false);
        }
        match tokio::fs::remove_file(self.path(id)).await {
            Ok(()) => Ok(true),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
            Err(error) => Err(StoreError::new(error)),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;
    use std::io::Cursor;

    use rst_app::crypto::lookup::LookupKey;
    use rst_app::identity::streamers::Streamers;
    use rst_app::profile::Profile;
    use rst_app::vault::Vault;
    use rst_domain::identity::values::{Login, StreamerId, TwitchUserId};
    use rst_domain::twitch::tokens::TwitchTokens;

    use super::*;
    use crate::crypto::master::MasterKey;
    use crate::db::pool::open_data_db;
    use crate::db::sqlite_records::SqliteRecords;
    use crate::db::sqlite_streamers::SqliteStreamers;
    use crate::keys::sqlite::SqliteKeyStore;

    fn contains(haystack: &[u8], needle: &[u8]) -> bool {
        haystack.windows(needle.len()).any(|window| window == needle)
    }

    fn entries(path: &Path) -> BTreeMap<String, Vec<u8>> {
        let mut zip = zip::ZipArchive::new(Cursor::new(fs::read(path).expect("read"))).expect("zip");
        let mut entries = BTreeMap::new();
        for index in 0..zip.len() {
            let mut entry = zip.by_index(index).expect("entry");
            let mut data = Vec::new();
            entry.read_to_end(&mut data).expect("data");
            entries.insert(entry.name().expect("name").into_owned(), data);
        }
        entries
    }

    #[tokio::test]
    async fn archive_with_all_rows_and_files_matching_checksums_and_no_plaintext() {
        let folder = tempfile::tempdir().expect("temp folder");
        let pool = open_data_db(&folder.path().join("data.db")).await.expect("open");
        let master = MasterKey::from_bytes([3; 32]);
        let keys = SqliteKeyStore::open(&folder.path().join("keys.db"), master.clone()).await.expect("keys");
        let vault = Vault::new(SqliteRecords::new(pool.clone()), keys);
        let lookup = LookupKey::from_bytes(*master.derive("lookup"));
        let streamers = Streamers::new(SqliteStreamers::new(pool.clone()), vault.clone(), lookup);
        let id = StreamerId::from_bytes([0xab; 16]);
        let neo = Login::parse("neo").expect("login");
        let user = TwitchUserId::parse("12345").expect("user");
        streamers.register(&user, &neo, id.clone(), 1).await.expect("register");
        let access = "access-secret".to_owned();
        let tokens = TwitchTokens { access, refresh: "refresh-secret".to_owned(), user_id: user, login: neo };
        Profile::new(vault).save_twitch_tokens(&id, &tokens, 2).await.expect("tokens");
        let files = folder.path().join("files");
        fs::create_dir_all(files.join(id.as_str())).expect("files");
        fs::write(files.join(id.as_str()).join("0123abcd"), b"ciphertext-of-a-file").expect("file");

        let backups = ZipBackups::new(pool, &files, &folder.path().join("backups"));
        let info = backups.create("manual-5-01020304", 5).await.expect("create");
        assert_eq!((info.automatic, info.created_at), (false, 5));
        assert_eq!(backups.list().await.expect("list"), std::slice::from_ref(&info));
        assert_eq!(backups.file("manual-6-01020304"), None);
        let entries = entries(&backups.file(&info.id).expect("file"));
        let manifest: Value = serde_json::from_slice(&entries["manifest.json"]).expect("manifest");
        assert_eq!(manifest["format"], json!(1));
        let sums = manifest["files"].as_object().expect("sums");
        assert_eq!(sums.len(), entries.len() - 1);
        for (name, sum) in sums {
            assert_eq!(sum.as_str(), Some(to_hex(&Sha256::digest(&entries[name])).as_str()), "{name}");
        }
        assert!(entries.contains_key(&format!("files/{}/0123abcd", id.as_str())));
        assert_eq!(String::from_utf8_lossy(&entries["db/streamers.jsonl"]).lines().count(), 1);
        assert!(!entries["db/records.jsonl"].is_empty());
        for (name, data) in &entries {
            for secret in [&b"neo"[..], b"12345", b"access-secret", b"refresh-secret"] {
                assert!(!contains(data, secret), "{} in {name}", String::from_utf8_lossy(secret));
            }
        }
        assert!(backups.delete(&info.id).await.expect("delete"));
        assert!(!backups.delete(&info.id).await.expect("delete again"));
        assert!(backups.list().await.expect("list").is_empty());
    }
}
