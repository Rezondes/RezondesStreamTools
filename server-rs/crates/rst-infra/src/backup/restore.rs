//! Checking and restoring backup archives (see `archive.rs` for the layout). An archive only counts when the manifest
//! has the known format, no newer migration than this server, exactly the listed entries with matching SHA-256 and
//! only entry names this server writes (no `..`, no absolute paths). A restore first unpacks the files beside the
//! file folder, then replaces the rows in one transaction and swaps the folders last; on an error nothing changes.

use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Read};
use std::path::{Path, PathBuf};

use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use rst_app::crypto::to_hex;
use rst_app::ports::StoreError;
use rst_app::ports::backups::ArchiveError;
use rst_domain::identity::values::StreamerId;
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use zip::ZipArchive;

use crate::backup::archive::ARCHIVE_FORMAT;

/// Tables in the archive, in the order they are restored
pub const TABLES: [&str; 4] = ["streamers", "records", "audit_log", "server_settings"];
/// A manifest is small; anything bigger is not ours
const MANIFEST_LIMIT: u64 = 64 * 1024 * 1024;

fn invalid(reason: impl Into<String>) -> ArchiveError {
    ArchiveError::Invalid(reason.into())
}

fn store(error: impl std::fmt::Display) -> ArchiveError {
    ArchiveError::Store(StoreError::new(error))
}

fn is_hex(text: &str, length: usize) -> bool {
    text.len() == length && text.bytes().all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
}

/// Only names this server writes: the tables, `files/<streamer-id>/<file>` and the manifest
fn allowed_name(name: &str) -> bool {
    if let Some(table) = name.strip_prefix("db/").and_then(|rest| rest.strip_suffix(".jsonl")) {
        return TABLES.contains(&table);
    }
    name.strip_prefix("files/")
        .and_then(|rest| rest.split_once('/'))
        .is_some_and(|(streamer, file)| is_hex(streamer, 32) && is_hex(file, 32))
}

/// What a checked archive holds
#[derive(Debug)]
pub struct Checked {
    pub streamers: Vec<StreamerId>,
    pub migration: i64,
}

fn hash(reader: &mut impl Read) -> io::Result<String> {
    let mut hasher = Sha256::new();
    let mut buffer = vec![0; 64 * 1024];
    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            return Ok(to_hex(&hasher.finalize()));
        }
        hasher.update(&buffer[..read]);
    }
}

fn open(path: &Path) -> Result<ZipArchive<File>, ArchiveError> {
    let file = File::open(path)
        .map_err(|error| if error.kind() == io::ErrorKind::NotFound { ArchiveError::NotFound } else { store(error) })?;
    ZipArchive::new(file).map_err(|_| invalid("not a ZIP archive"))
}

fn checksums(manifest: &Value) -> Result<BTreeMap<String, String>, ArchiveError> {
    let files = manifest.get("files").and_then(Value::as_object).ok_or_else(|| invalid("no checksums"))?;
    files
        .iter()
        .map(|(name, sum)| sum.as_str().map(|sum| (name.clone(), sum.to_owned())).ok_or_else(|| invalid("no checksum")))
        .collect()
}

/// Checks the archive at `path` against its manifest; `migration`: the newest migration of this server
///
/// # Errors
/// `Invalid` with the reason, `NotFound` without the file, `Store` when it cannot be read.
pub fn check(path: &Path, migration: i64) -> Result<Checked, ArchiveError> {
    let mut zip = open(path)?;
    let manifest: Value = {
        let entry = zip.by_name("manifest.json").map_err(|_| invalid("no manifest"))?;
        let mut text = Vec::new();
        entry.take(MANIFEST_LIMIT).read_to_end(&mut text).map_err(store)?;
        serde_json::from_slice(&text).map_err(|_| invalid("manifest is not JSON"))?
    };
    if manifest.get("format").and_then(Value::as_u64) != Some(u64::from(ARCHIVE_FORMAT)) {
        return Err(invalid("unknown archive format"));
    }
    let made_with = manifest.get("migration").and_then(Value::as_i64).ok_or_else(|| invalid("no migration"))?;
    if made_with > migration {
        return Err(invalid("made by a newer server"));
    }
    let sums = checksums(&manifest)?;
    let mut seen = BTreeSet::new();
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index).map_err(|_| invalid("broken entry"))?;
        let name = entry.name().map_err(|_| invalid("entry name is no text"))?.into_owned();
        if name == "manifest.json" {
            continue;
        }
        // enclosed_name rejects absolute paths and `..`; allowed_name only lets our own names through
        if entry.enclosed_name().is_none() || !allowed_name(&name) || !seen.insert(name.clone()) {
            return Err(invalid(format!("unexpected entry {name}")));
        }
        let expected = sums.get(&name).ok_or_else(|| invalid(format!("{name} is not in the manifest")))?;
        if hash(&mut entry).map_err(|_| invalid(format!("{name} cannot be read")))? != *expected {
            return Err(invalid(format!("checksum of {name} does not match")));
        }
    }
    if seen.len() != sums.len() || TABLES.iter().any(|table| !seen.contains(&format!("db/{table}.jsonl"))) {
        return Err(invalid("entries of the manifest are missing"));
    }
    let streamers = read_lines(&mut zip, "streamers")?
        .iter()
        .map(|row| {
            let id = row.get("id").and_then(Value::as_str).and_then(|id| StreamerId::parse(id).ok());
            id.ok_or_else(|| invalid("streamer without a valid id"))
        })
        .collect::<Result<_, _>>()?;
    Ok(Checked { streamers, migration: made_with })
}

/// The rows of one table
fn read_lines(zip: &mut ZipArchive<File>, table: &str) -> Result<Vec<Value>, ArchiveError> {
    let entry = zip.by_name(&format!("db/{table}.jsonl")).map_err(|_| invalid(format!("no table {table}")))?;
    BufReader::new(entry)
        .lines()
        .map(|line| {
            let line = line.map_err(store)?;
            serde_json::from_str(&line).map_err(|_| invalid(format!("broken row in {table}")))
        })
        .collect()
}

/// Unpacks the files of the kept streamers into `target` (a fresh folder)
fn unpack(path: &Path, keep: &BTreeSet<String>, target: &Path) -> Result<(), ArchiveError> {
    if target.exists() {
        fs::remove_dir_all(target).map_err(store)?;
    }
    fs::create_dir_all(target).map_err(store)?;
    let mut zip = open(path)?;
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index).map_err(|_| invalid("broken entry"))?;
        let name = entry.name().map_err(|_| invalid("entry name is no text"))?.into_owned();
        let Some((streamer, file)) = name.strip_prefix("files/").and_then(|rest| rest.split_once('/')) else {
            continue;
        };
        if !keep.contains(streamer) || !allowed_name(&name) {
            continue;
        }
        let folder = target.join(streamer);
        fs::create_dir_all(&folder).map_err(store)?;
        let mut out = File::create(folder.join(file)).map_err(store)?;
        io::copy(&mut entry, &mut out).map_err(store)?;
        out.sync_all().map_err(store)?;
    }
    Ok(())
}

fn text(row: &Value, column: &str) -> Result<String, ArchiveError> {
    row.get(column).and_then(Value::as_str).map(str::to_owned).ok_or_else(|| invalid(format!("no {column}")))
}

fn optional_text(row: &Value, column: &str) -> Option<String> {
    row.get(column).and_then(Value::as_str).map(str::to_owned)
}

fn number(row: &Value, column: &str) -> Result<i64, ArchiveError> {
    row.get(column).and_then(Value::as_i64).ok_or_else(|| invalid(format!("no {column}")))
}

fn bytes(row: &Value, column: &str) -> Result<Vec<u8>, ArchiveError> {
    STANDARD.decode(text(row, column)?).map_err(|_| invalid(format!("{column} is no base64")))
}

/// Rows of the archive per table, only those of kept streamers (server-wide audit entries and settings stay)
fn kept_rows(path: &Path, keep: &BTreeSet<String>) -> Result<BTreeMap<&'static str, Vec<Value>>, ArchiveError> {
    let mut zip = open(path)?;
    let mut tables = BTreeMap::new();
    for table in TABLES {
        let column = if table == "streamers" { "id" } else { "streamer_id" };
        let rows = read_lines(&mut zip, table)?
            .into_iter()
            .filter(|row| match row.get(column) {
                None | Some(Value::Null) => table != "streamers" && table != "records",
                Some(id) => id.as_str().is_some_and(|id| keep.contains(id)),
            })
            .collect();
        tables.insert(table, rows);
    }
    Ok(tables)
}

/// Replaces every row in one transaction; sessions of streamers that stay are kept
async fn replace_rows(pool: &SqlitePool, rows: &BTreeMap<&'static str, Vec<Value>>) -> Result<(), ArchiveError> {
    let mut transaction = pool.begin().await.map_err(store)?;
    let kept: BTreeSet<String> = rows["streamers"].iter().filter_map(|row| optional_text(row, "id")).collect();
    let current: Vec<String> =
        sqlx::query_scalar("SELECT id FROM streamers").fetch_all(&mut *transaction).await.map_err(store)?;
    for id in current.iter().filter(|id| !kept.contains(*id)) {
        sqlx::query("DELETE FROM streamers WHERE id = ?").bind(id).execute(&mut *transaction).await.map_err(store)?;
    }
    for row in &rows["streamers"] {
        sqlx::query(
            "INSERT INTO streamers (id, user_id_hmac, login_hmac, created_at) VALUES (?, ?, ?, ?) \
             ON CONFLICT (id) DO UPDATE SET user_id_hmac = excluded.user_id_hmac, login_hmac = excluded.login_hmac, \
             created_at = excluded.created_at",
        )
        .bind(text(row, "id")?)
        .bind(bytes(row, "user_id_hmac")?)
        .bind(bytes(row, "login_hmac")?)
        .bind(number(row, "created_at")?)
        .execute(&mut *transaction)
        .await
        .map_err(store)?;
    }
    sqlx::query("DELETE FROM records").execute(&mut *transaction).await.map_err(store)?;
    for row in &rows["records"] {
        sqlx::query(
            "INSERT INTO records (streamer_id, kind, record_key, ciphertext, updated_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(text(row, "streamer_id")?)
        .bind(text(row, "kind")?)
        .bind(text(row, "record_key")?)
        .bind(bytes(row, "ciphertext")?)
        .bind(number(row, "updated_at")?)
        .execute(&mut *transaction)
        .await
        .map_err(store)?;
    }
    sqlx::query("DELETE FROM audit_log").execute(&mut *transaction).await.map_err(store)?;
    for row in &rows["audit_log"] {
        sqlx::query("INSERT INTO audit_log (id, streamer_id, created_at, ciphertext) VALUES (?, ?, ?, ?)")
            .bind(number(row, "id")?)
            .bind(optional_text(row, "streamer_id"))
            .bind(number(row, "created_at")?)
            .bind(bytes(row, "ciphertext")?)
            .execute(&mut *transaction)
            .await
            .map_err(store)?;
    }
    sqlx::query("DELETE FROM server_settings").execute(&mut *transaction).await.map_err(store)?;
    for row in &rows["server_settings"] {
        sqlx::query("INSERT INTO server_settings (setting_key, ciphertext, updated_at) VALUES (?, ?, ?)")
            .bind(text(row, "setting_key")?)
            .bind(bytes(row, "ciphertext")?)
            .bind(number(row, "updated_at")?)
            .execute(&mut *transaction)
            .await
            .map_err(store)?;
    }
    transaction.commit().await.map_err(store)
}

/// The newest migration of the data database
///
/// # Errors
/// When the database cannot be read.
pub async fn migration(pool: &SqlitePool) -> Result<i64, StoreError> {
    sqlx::query_scalar("SELECT COALESCE(MAX(version), 0) FROM _sqlx_migrations")
        .fetch_one(pool)
        .await
        .map_err(StoreError::new)
}

/// Restores `path` into `pool` and `files`, only for the streamers in `keep`
///
/// # Errors
/// `Invalid` for an archive that does not pass [`check`], `Store` when reading or writing fails; then the database
/// and the file folder are as before.
pub async fn restore(pool: &SqlitePool, files: &Path, path: &Path, keep: &[StreamerId]) -> Result<(), ArchiveError> {
    let current = migration(pool).await?;
    let keep: BTreeSet<String> = keep.iter().map(|id| id.as_str().to_owned()).collect();
    let (archive, staged) = (path.to_owned(), with_suffix(files, "restore"));
    let (rows, staged) = tokio::task::spawn_blocking(move || {
        check(&archive, current)?;
        unpack(&archive, &keep, &staged)?;
        Ok::<_, ArchiveError>((kept_rows(&archive, &keep)?, staged))
    })
    .await
    .map_err(store)??;
    if let Err(error) = replace_rows(pool, &rows).await {
        let _ = fs::remove_dir_all(&staged);
        return Err(error);
    }
    let folder = files.to_owned();
    tokio::task::spawn_blocking(move || swap(&folder, &staged)).await.map_err(store)?
}

fn with_suffix(path: &Path, suffix: &str) -> PathBuf {
    let mut name = path.file_name().map(std::ffi::OsStr::to_os_string).unwrap_or_default();
    name.push(format!(".{suffix}"));
    path.with_file_name(name)
}

/// Puts the unpacked folder in place of the file folder
fn swap(folder: &Path, staged: &Path) -> Result<(), ArchiveError> {
    let old = with_suffix(folder, "old");
    if old.exists() {
        fs::remove_dir_all(&old).map_err(store)?;
    }
    if folder.exists() {
        fs::rename(folder, &old).map_err(store)?;
    }
    fs::rename(staged, folder).map_err(store)?;
    if old.exists() {
        fs::remove_dir_all(&old).map_err(store)?;
    }
    Ok(())
}
