//! Configuration from the environment: where the data database, the key store and the encrypted files live, and the
//! master key. Without a valid master key nothing starts.

use std::path::PathBuf;

use rst_infra::crypto::master::{MasterKey, MasterKeyError};
use rst_infra::db::pool::DATA_DB_VAR;
use rst_infra::files::encrypted::{FILE_CACHE_VAR, cache_bytes};
use rst_infra::keys::sqlite::KEYS_DB_VAR;

/// Folder for everything without its own variable
pub const DATA_DIR_VAR: &str = "RST_DATA_DIR";
pub const FILES_VAR: &str = "RST_FILES";
const DEFAULT_DATA_DIR: &str = "rst-data";

#[derive(Debug)]
pub struct Config {
    pub data_db: PathBuf,
    pub keys_db: PathBuf,
    pub files: PathBuf,
    pub file_cache_bytes: usize,
    pub master: MasterKey,
}

impl Config {
    /// `lookup` reads one variable (the environment in production, a map in tests)
    ///
    /// # Errors
    /// When the master key is missing or invalid.
    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, MasterKeyError> {
        let master = MasterKey::from_value(lookup(rst_infra::crypto::master::MASTER_KEY_VAR).as_deref())?;
        let dir = PathBuf::from(lookup(DATA_DIR_VAR).unwrap_or_else(|| DEFAULT_DATA_DIR.to_owned()));
        let path = |var: &str, default: &str| lookup(var).map_or_else(|| dir.join(default), PathBuf::from);
        Ok(Self {
            data_db: path(DATA_DB_VAR, "data.db"),
            keys_db: path(KEYS_DB_VAR, "keys.db"),
            files: path(FILES_VAR, "files"),
            file_cache_bytes: cache_bytes(lookup(FILE_CACHE_VAR).as_deref()),
            master,
        })
    }

    /// # Errors
    /// See [`Self::from_lookup`].
    pub fn from_env() -> Result<Self, MasterKeyError> {
        Self::from_lookup(|var| std::env::var(var).ok())
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    const KEY: &str = "CQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk=";

    fn config(pairs: &[(&str, &str)]) -> Result<Config, MasterKeyError> {
        let map: HashMap<String, String> =
            pairs.iter().map(|(key, value)| ((*key).to_owned(), (*value).to_owned())).collect();
        Config::from_lookup(|var| map.get(var).cloned())
    }

    #[test]
    fn defaults_under_the_data_folder() {
        let config = config(&[("RST_MASTER_KEY", KEY), ("RST_DATA_DIR", "/srv/rst")]).expect("config");
        assert_eq!(config.data_db, PathBuf::from("/srv/rst").join("data.db"));
        assert_eq!(config.keys_db, PathBuf::from("/srv/rst").join("keys.db"));
        assert_eq!(config.files, PathBuf::from("/srv/rst").join("files"));
        assert_eq!(config.file_cache_bytes, 64 * 1024 * 1024);
    }

    #[test]
    fn own_paths_and_no_start_without_a_key() {
        let config = config(&[("RST_MASTER_KEY", KEY), ("RST_KEYS_DB", "/keys/keys.db")]).expect("config");
        assert_eq!(config.keys_db, PathBuf::from("/keys/keys.db"));
        assert_eq!(config.data_db, PathBuf::from("rst-data").join("data.db"));
        assert_eq!(super::Config::from_lookup(|_| None).err(), Some(MasterKeyError::Missing));
    }
}
