//! Composition root: opens the data database, the key store and the file store and builds the use cases on the
//! concrete adapters. `rst serve` and `rst import` use the same wiring.

use std::fs;
use std::path::Path;

use rst_app::access::AccessSettings;
use rst_app::audit::AuditLog;
use rst_app::channel::overlay_key::OverlayKeys;
use rst_app::crypto::lookup::LookupKey;
use rst_app::identity::sessions::Sessions;
use rst_app::identity::streamers::Streamers;
use rst_app::media::MediaLibrary;
use rst_app::ports::keys::DataKey;
use rst_app::profile::Profile;
use rst_app::vault::Vault;
use rst_infra::db::pool::open_data_db;
use rst_infra::db::sqlite_audit::SqliteAudit;
use rst_infra::db::sqlite_records::SqliteRecords;
use rst_infra::db::sqlite_server_settings::SqliteServerSettings;
use rst_infra::db::sqlite_sessions::SqliteSessions;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use rst_infra::files::encrypted::EncryptedFiles;
use rst_infra::keys::sqlite::SqliteKeyStore;
use sqlx::SqlitePool;

use crate::config::StoreConfig;

/// Every use case on the concrete adapters
#[derive(Debug, Clone)]
pub struct Stores {
    pub pool: SqlitePool,
    pub streamers: Streamers<SqliteStreamers, SqliteRecords, SqliteKeyStore>,
    pub sessions: Sessions<SqliteSessions>,
    pub profile: Profile<SqliteRecords, SqliteKeyStore>,
    pub overlay_keys: OverlayKeys<SqliteRecords, SqliteKeyStore>,
    pub media: MediaLibrary<SqliteRecords, SqliteKeyStore, EncryptedFiles>,
    pub access: AccessSettings<SqliteServerSettings>,
    pub audit: AuditLog<SqliteAudit, SqliteKeyStore>,
}

fn create_parent(path: &Path) -> Result<(), String> {
    path.parent()
        .map_or(Ok(()), |parent| fs::create_dir_all(parent).map_err(|error| format!("{}: {error}", parent.display())))
}

/// # Errors
/// When a folder cannot be created or a store cannot be opened.
pub async fn open(config: &StoreConfig) -> Result<Stores, String> {
    create_parent(&config.data_db)?;
    create_parent(&config.keys_db)?;
    let pool = open_data_db(&config.data_db).await.map_err(|error| error.to_string())?;
    let keys = SqliteKeyStore::open(&config.keys_db, config.master.clone()).await.map_err(|error| error.to_string())?;
    let vault = Vault::new(SqliteRecords::new(pool.clone()), keys.clone());
    let lookup = LookupKey::from_bytes(*config.master.derive("lookup"));
    let server_key = DataKey::from_bytes(*config.master.derive("server"));
    Ok(Stores {
        streamers: Streamers::new(SqliteStreamers::new(pool.clone()), vault.clone(), lookup.clone()),
        sessions: Sessions::new(SqliteSessions::new(pool.clone())),
        profile: Profile::new(vault.clone()),
        overlay_keys: OverlayKeys::new(vault.clone(), lookup),
        media: MediaLibrary::new(vault, EncryptedFiles::new(&config.files, config.file_cache_bytes)),
        access: AccessSettings::new(SqliteServerSettings::new(pool.clone()), server_key.clone()),
        audit: AuditLog::new(SqliteAudit::new(pool.clone()), keys, server_key),
        pool,
    })
}
