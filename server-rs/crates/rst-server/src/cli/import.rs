//! `rst import --from <DATA>`: takes over the profiles of the Node server into the database, the key store and the
//! encrypted files. Can run again without creating duplicates.

use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rst_app::access::AccessSettings;
use rst_app::channel::overlay_key::OverlayKeys;
use rst_app::crypto::lookup::LookupKey;
use rst_app::identity::streamers::Streamers;
use rst_app::import::{ImportReport, Importer, profile_folders, read_profile};
use rst_app::media::MediaLibrary;
use rst_app::ports::keys::DataKey;
use rst_app::profile::Profile;
use rst_app::vault::Vault;
use rst_infra::db::pool::open_data_db;
use rst_infra::db::sqlite_records::SqliteRecords;
use rst_infra::db::sqlite_server_settings::SqliteServerSettings;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use rst_infra::files::encrypted::EncryptedFiles;
use rst_infra::keys::sqlite::SqliteKeyStore;

use crate::config::Config;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| i64::try_from(elapsed.as_millis()).unwrap_or(i64::MAX))
}

fn create_parent(path: &Path) -> Result<(), String> {
    path.parent()
        .map_or(Ok(()), |parent| fs::create_dir_all(parent).map_err(|error| format!("{}: {error}", parent.display())))
}

/// # Errors
/// When a store cannot be opened or a write fails; problems in the data are in the report.
pub async fn run(config: &Config, from: &Path) -> Result<ImportReport, String> {
    if !from.is_dir() {
        return Err(format!("{} is not a folder", from.display()));
    }
    create_parent(&config.data_db)?;
    create_parent(&config.keys_db)?;
    let pool = open_data_db(&config.data_db).await.map_err(|error| error.to_string())?;
    let keys = SqliteKeyStore::open(&config.keys_db, config.master.clone()).await.map_err(|error| error.to_string())?;
    let vault = Vault::new(SqliteRecords::new(pool.clone()), keys);
    let lookup = LookupKey::from_bytes(*config.master.derive("lookup"));
    let importer = Importer {
        streamers: Streamers::new(SqliteStreamers::new(pool.clone()), vault.clone(), lookup.clone()),
        profile: Profile::new(vault.clone()),
        overlay_keys: OverlayKeys::new(vault.clone(), lookup),
        media: MediaLibrary::new(vault, EncryptedFiles::new(&config.files, config.file_cache_bytes)),
        access: AccessSettings::new(
            SqliteServerSettings::new(pool.clone()),
            DataKey::from_bytes(*config.master.derive("server")),
        ),
    };
    let mut report = ImportReport::default();
    let now = now_ms();
    let access = fs::read(from.join("access.json")).ok();
    importer.import_access(access.as_deref(), &mut report, now).await.map_err(|error| error.to_string())?;
    for folder in profile_folders(from).map_err(|error| error.to_string())? {
        let legacy = read_profile(&folder).map_err(|error| format!("{}: {error}", folder.display()))?;
        importer.import_profile(&legacy, &mut report, now).await.map_err(|error| error.to_string())?;
    }
    pool.close().await;
    Ok(report)
}

#[cfg(test)]
mod tests {
    use rst_infra::crypto::master::MasterKey;

    use super::*;

    fn config(folder: &Path) -> Config {
        Config {
            data_db: folder.join("db").join("data.db"),
            keys_db: folder.join("keys").join("keys.db"),
            files: folder.join("files"),
            file_cache_bytes: 0,
            master: MasterKey::from_bytes([3; 32]),
        }
    }

    #[tokio::test]
    async fn imports_the_fixture_twice_into_sqlite() {
        let folder = tempfile::tempdir().expect("temp folder");
        let data = Path::new(env!("CARGO_MANIFEST_DIR")).join("../rst-app/tests/fixtures/data");
        let first = run(&config(folder.path()), &data).await.expect("first run");
        assert_eq!(first.imported, ["access.json", "neo", "trinity"]);
        assert!(!first.complete());
        let files = || {
            fs::read_dir(folder.path().join("files"))
                .expect("files")
                .flat_map(|entry| fs::read_dir(entry.expect("entry").path()).expect("streamer"))
                .count()
        };
        let stored = files();
        assert_eq!(stored, 2);
        let second = run(&config(folder.path()), &data).await.expect("second run");
        assert_eq!(second.imported, first.imported);
        assert_eq!(files(), stored);
        assert!(run(&config(folder.path()), &folder.path().join("missing")).await.is_err());
    }
}
