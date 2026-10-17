//! Configuration from the environment (template: the settings block of `server/index.ts` and `server/providers.ts`).
//! `StoreConfig` is what every command needs (database, key store, files, master key); `ServerConfig` adds what
//! `rst serve` needs. Missing required values end the start with a message.

use std::fmt;
use std::path::PathBuf;

use rst_domain::identity::values::Login;
use rst_infra::backup::archive::BACKUPS_VAR;
use rst_infra::backup::keys::KEY_BACKUPS_VAR;
use rst_infra::crypto::master::{MASTER_KEY_VAR, MasterKey, MasterKeyError};
use rst_infra::db::pool::DATA_DB_VAR;
use rst_infra::files::encrypted::{FILE_CACHE_VAR, cache_bytes};
use rst_infra::keys::sqlite::KEYS_DB_VAR;

/// Folder for everything without its own variable (falls back to `DATA`, the folder of the Node server)
pub const DATA_DIR_VAR: &str = "RST_DATA_DIR";
pub const FILES_VAR: &str = "RST_FILES";
const DEFAULT_DATA_DIR: &str = "data";
const DEFAULT_PORT: u16 = 8080;
const DEFAULT_MEDIA_MB: u64 = 200;
/// Largest uploaded backup without `BACKUP_UPLOAD_MB`
const DEFAULT_BACKUP_UPLOAD_MB: u64 = 4096;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigError {
    MasterKey(MasterKeyError),
    Missing(&'static str),
    Invalid(&'static str),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MasterKey(error) => error.fmt(formatter),
            Self::Missing(var) => write!(formatter, "{var} is missing (see server.env.example)"),
            Self::Invalid(var) => write!(formatter, "{var} is invalid (see server.env.example)"),
        }
    }
}

impl std::error::Error for ConfigError {}

#[derive(Debug)]
pub struct StoreConfig {
    pub data_db: PathBuf,
    pub keys_db: PathBuf,
    pub files: PathBuf,
    pub file_cache_bytes: usize,
    /// Frames of a running render, unencrypted only until ffmpeg is done
    pub render_temp: PathBuf,
    /// Server-wide backups (never the key store)
    pub backups: PathBuf,
    /// Daily copies of the key store, kept 30 days
    pub key_backups: PathBuf,
    pub master: MasterKey,
}

impl StoreConfig {
    /// `lookup` reads one variable (the environment in production, a map in tests)
    ///
    /// # Errors
    /// When the master key is missing or invalid.
    pub fn from_lookup(lookup: &impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let master = MasterKey::from_value(lookup(MASTER_KEY_VAR).as_deref()).map_err(ConfigError::MasterKey)?;
        let dir = PathBuf::from(
            lookup(DATA_DIR_VAR).or_else(|| lookup("DATA")).unwrap_or_else(|| DEFAULT_DATA_DIR.to_owned()),
        );
        let path = |var: &str, default: &str| lookup(var).map_or_else(|| dir.join(default), PathBuf::from);
        Ok(Self {
            data_db: path(DATA_DB_VAR, "data.db"),
            keys_db: path(KEYS_DB_VAR, "keys.db"),
            files: path(FILES_VAR, "files"),
            file_cache_bytes: cache_bytes(lookup(FILE_CACHE_VAR).as_deref()),
            render_temp: path("RST_RENDER_DIR", "render-tmp"),
            backups: path(BACKUPS_VAR, "backups"),
            key_backups: path(KEY_BACKUPS_VAR, "key-backups"),
            master,
        })
    }
}

/// Base URLs of Twitch and Spotify; the contract tests point them at the fake provider
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProviderUrls {
    pub twitch_id: String,
    pub twitch_api: String,
    pub twitch_eventsub: String,
    pub twitch_irc: String,
    pub spotify_accounts: String,
    pub spotify_api: String,
}

impl ProviderUrls {
    pub fn from_lookup(lookup: &impl Fn(&str) -> Option<String>) -> Self {
        let url = |var: &str, real: &str| {
            lookup(var)
                .map(|url| url.trim().trim_end_matches('/').to_owned())
                .filter(|url| !url.is_empty())
                .unwrap_or_else(|| real.to_owned())
        };
        Self {
            twitch_id: url("TWITCH_ID_URL", "https://id.twitch.tv/oauth2"),
            twitch_api: url("TWITCH_API_URL", "https://api.twitch.tv/helix"),
            twitch_eventsub: url("TWITCH_EVENTSUB_URL", "wss://eventsub.wss.twitch.tv/ws"),
            twitch_irc: url("TWITCH_IRC_URL", rst_domain::chat::irc::IRC_URL),
            spotify_accounts: url("SPOTIFY_ACCOUNTS_URL", "https://accounts.spotify.com"),
            spotify_api: url("SPOTIFY_API_URL", "https://api.spotify.com/v1"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OAuthApp {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug)]
pub struct ServerConfig {
    pub stores: StoreConfig,
    pub port: u16,
    /// Without a trailing slash, e.g. `https://overlays.example.de`
    pub public_url: String,
    pub dist: PathBuf,
    pub admins: Vec<Login>,
    pub twitch: OAuthApp,
    /// `None` without Spotify credentials: no music
    pub spotify: Option<OAuthApp>,
    pub media_quota_bytes: u64,
    pub backup_upload_bytes: u64,
    pub providers: ProviderUrls,
}

impl ServerConfig {
    /// # Errors
    /// For a missing or invalid master key, missing Twitch credentials or an invalid port or URL.
    pub fn from_lookup(lookup: &impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let stores = StoreConfig::from_lookup(lookup)?;
        let port = match lookup("PORT") {
            Some(port) => port.trim().parse().map_err(|_| ConfigError::Invalid("PORT"))?,
            None => DEFAULT_PORT,
        };
        let public_url = lookup("PUBLIC_URL")
            .unwrap_or_else(|| format!("http://localhost:{port}"))
            .trim()
            .trim_end_matches('/')
            .to_owned();
        if !(public_url.starts_with("http://") || public_url.starts_with("https://")) {
            return Err(ConfigError::Invalid("PUBLIC_URL"));
        }
        let required =
            |var: &'static str| lookup(var).filter(|value| !value.trim().is_empty()).ok_or(ConfigError::Missing(var));
        let twitch =
            OAuthApp { client_id: required("TWITCH_CLIENT_ID")?, client_secret: required("TWITCH_CLIENT_SECRET")? };
        let spotify = match (lookup("SPOTIFY_CLIENT_ID"), lookup("SPOTIFY_CLIENT_SECRET")) {
            (Some(client_id), Some(client_secret)) if !client_id.is_empty() && !client_secret.is_empty() => {
                Some(OAuthApp { client_id, client_secret })
            }
            _ => None,
        };
        let admins = lookup("ADMINS")
            .unwrap_or_default()
            .split(',')
            .filter_map(|login| Login::parse(login.trim()).ok())
            .collect();
        let megabytes = |var: &str| lookup(var).and_then(|value| value.trim().parse::<u64>().ok()).filter(|mb| *mb > 0);
        let media_mb = lookup("MEDIA_LIMIT_MB").and_then(|value| value.trim().parse::<u64>().ok()).filter(|mb| *mb > 0);
        Ok(Self {
            stores,
            port,
            public_url,
            dist: PathBuf::from(lookup("DIST").unwrap_or_else(|| "dist".to_owned())),
            admins,
            twitch,
            spotify,
            media_quota_bytes: media_mb.unwrap_or(DEFAULT_MEDIA_MB) * 1024 * 1024,
            backup_upload_bytes: megabytes("BACKUP_UPLOAD_MB").unwrap_or(DEFAULT_BACKUP_UPLOAD_MB) * 1024 * 1024,
            providers: ProviderUrls::from_lookup(lookup),
        })
    }
}

/// Reads the process environment
pub fn env(var: &str) -> Option<String> {
    std::env::var(var).ok()
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    const KEY: &str = "CQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk=";

    fn lookup(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let map: HashMap<String, String> =
            pairs.iter().map(|(key, value)| ((*key).to_owned(), (*value).to_owned())).collect();
        move |var| map.get(var).cloned()
    }

    fn server(pairs: &[(&str, &str)]) -> Result<ServerConfig, ConfigError> {
        let mut all = vec![("RST_MASTER_KEY", KEY), ("TWITCH_CLIENT_ID", "id"), ("TWITCH_CLIENT_SECRET", "secret")];
        all.extend_from_slice(pairs);
        ServerConfig::from_lookup(&lookup(&all))
    }

    #[test]
    fn store_paths_under_the_data_folder() {
        let config =
            StoreConfig::from_lookup(&lookup(&[("RST_MASTER_KEY", KEY), ("DATA", "/srv/data")])).expect("config");
        assert_eq!(config.data_db, PathBuf::from("/srv/data").join("data.db"));
        assert_eq!(config.files, PathBuf::from("/srv/data").join("files"));
        let own = StoreConfig::from_lookup(&lookup(&[
            ("RST_MASTER_KEY", KEY),
            ("RST_DATA_DIR", "/rst"),
            ("RST_KEYS_DB", "/keys/keys.db"),
        ]))
        .expect("config");
        assert_eq!(own.keys_db, PathBuf::from("/keys/keys.db"));
        assert_eq!(own.data_db, PathBuf::from("/rst").join("data.db"));
        assert_eq!(own.file_cache_bytes, 64 * 1024 * 1024);
        assert!(matches!(StoreConfig::from_lookup(&lookup(&[])), Err(ConfigError::MasterKey(MasterKeyError::Missing))));
    }

    #[test]
    fn server_defaults_and_values() {
        let config = server(&[]).expect("config");
        assert_eq!((config.port, config.public_url.as_str()), (8080, "http://localhost:8080"));
        assert_eq!(config.spotify, None);
        assert_eq!(config.media_quota_bytes, 200 * 1024 * 1024);
        assert_eq!(config.providers.twitch_id, "https://id.twitch.tv/oauth2");
        let config = server(&[
            ("PORT", "9000"),
            ("PUBLIC_URL", "https://overlays.example.de/"),
            ("ADMINS", "Rezondes, not a login ,neo"),
            ("SPOTIFY_CLIENT_ID", "s"),
            ("SPOTIFY_CLIENT_SECRET", "t"),
            ("MEDIA_LIMIT_MB", "1"),
            ("TWITCH_ID_URL", "http://127.0.0.1:1/oauth2/"),
        ])
        .expect("config");
        assert_eq!(config.public_url, "https://overlays.example.de");
        assert_eq!(config.admins.iter().map(Login::as_str).collect::<Vec<_>>(), ["rezondes", "neo"]);
        assert!(config.spotify.is_some());
        assert_eq!(config.media_quota_bytes, 1024 * 1024);
        assert_eq!(config.providers.twitch_id, "http://127.0.0.1:1/oauth2");
    }

    #[test]
    fn missing_or_invalid_values_end_the_start() {
        let base = [("RST_MASTER_KEY", KEY), ("TWITCH_CLIENT_ID", "id")];
        assert_eq!(ServerConfig::from_lookup(&lookup(&base)).err(), Some(ConfigError::Missing("TWITCH_CLIENT_SECRET")));
        assert_eq!(server(&[("PORT", "eighty")]).err(), Some(ConfigError::Invalid("PORT")));
        assert_eq!(server(&[("PUBLIC_URL", "overlays.example.de")]).err(), Some(ConfigError::Invalid("PUBLIC_URL")));
        assert!(ConfigError::Missing("TWITCH_CLIENT_ID").to_string().contains("TWITCH_CLIENT_ID"));
    }
}
