//! `rst import --from <DATA>`: takes over the profiles of the Node server into the database, the key store and the
//! encrypted files. Can run again without creating duplicates.

use std::fs;
use std::path::Path;

use rst_app::import::{ImportReport, Importer, profile_folders, read_profile};

use crate::clock::now_ms;
use crate::config::StoreConfig;
use crate::wiring;

/// # Errors
/// When a store cannot be opened or a write fails; problems in the data are in the report.
pub async fn run(config: &StoreConfig, from: &Path) -> Result<ImportReport, String> {
    if !from.is_dir() {
        return Err(format!("{} is not a folder", from.display()));
    }
    let stores = wiring::open(config).await?;
    let importer = Importer {
        streamers: stores.streamers.clone(),
        profile: stores.profile.clone(),
        overlay_keys: stores.overlay_keys.clone(),
        media: stores.media.clone(),
        access: stores.access.clone(),
    };
    let mut report = ImportReport::default();
    let now = now_ms();
    let access = fs::read(from.join("access.json")).ok();
    importer.import_access(access.as_deref(), &mut report, now).await.map_err(|error| error.to_string())?;
    for folder in profile_folders(from).map_err(|error| error.to_string())? {
        let legacy = read_profile(&folder).map_err(|error| format!("{}: {error}", folder.display()))?;
        importer.import_profile(&legacy, &mut report, now).await.map_err(|error| error.to_string())?;
    }
    stores.pool.close().await;
    Ok(report)
}

#[cfg(test)]
mod tests {
    use rst_infra::crypto::master::MasterKey;

    use super::*;

    fn config(folder: &Path) -> StoreConfig {
        StoreConfig {
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
