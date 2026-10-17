//! Key store in its own SQLite file (`keys.db`, path from `RST_KEYS_DB`), apart from the data database: data keys
//! wrapped with the master key, the streamer ID as associated data so a wrapped key cannot be moved to another
//! streamer.

use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rst_app::ports::StoreError;
use rst_app::ports::keys::{DataKey, KeyStore};
use rst_domain::identity::values::StreamerId;
use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

use crate::crypto::master::MasterKey;
use rst_app::crypto::cipher::{open, random_bytes, seal};

pub const KEYS_DB_VAR: &str = "RST_KEYS_DB";

#[derive(Debug, Clone)]
pub struct SqliteKeyStore {
    pool: SqlitePool,
    master: MasterKey,
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| i64::try_from(elapsed.as_millis()).unwrap_or(i64::MAX))
}

fn unwrap_key(master: &MasterKey, id: &str, wrapped: &[u8]) -> Result<DataKey, StoreError> {
    let bytes =
        open(master.bytes(), wrapped, id.as_bytes()).map_err(|error| StoreError::new(format!("data key: {error}")))?;
    let key: [u8; 32] = bytes.as_slice().try_into().map_err(|_| StoreError::new("data key: wrong length"))?;
    Ok(DataKey::from_bytes(key))
}

impl SqliteKeyStore {
    /// Opens (or creates) the key store at `path` and brings its tables up to date
    ///
    /// # Errors
    /// When the file cannot be opened or a migration fails.
    pub async fn open(path: &Path, master: MasterKey) -> Result<Self, StoreError> {
        let options = SqliteConnectOptions::new().filename(path).create_if_missing(true);
        let pool = SqlitePoolOptions::new().max_connections(4).connect_with(options).await.map_err(StoreError::new)?;
        sqlx::migrate!("../../migrations-keys").run(&pool).await.map_err(StoreError::new)?;
        Ok(Self { pool, master })
    }

    /// Wraps every data key with a new master key in one transaction; afterwards the store works with `new`. Returns
    /// the number of keys.
    ///
    /// # Errors
    /// When a key cannot be unwrapped with the current master key or the database fails; then nothing changed.
    pub async fn rewrap_all(&mut self, new: MasterKey) -> Result<usize, StoreError> {
        let mut transaction = self.pool.begin().await.map_err(StoreError::new)?;
        let rows: Vec<(String, Vec<u8>)> = sqlx::query_as("SELECT streamer_id, wrapped FROM data_keys")
            .fetch_all(&mut *transaction)
            .await
            .map_err(StoreError::new)?;
        for (id, wrapped) in &rows {
            let key = unwrap_key(&self.master, id, wrapped)?;
            let rewrapped = seal(new.bytes(), key.bytes(), id.as_bytes()).map_err(StoreError::new)?;
            sqlx::query("UPDATE data_keys SET wrapped = ? WHERE streamer_id = ?")
                .bind(rewrapped)
                .bind(id)
                .execute(&mut *transaction)
                .await
                .map_err(StoreError::new)?;
        }
        transaction.commit().await.map_err(StoreError::new)?;
        self.master = new;
        Ok(rows.len())
    }

    async fn wrapped(&self, id: &StreamerId) -> Result<Option<Vec<u8>>, StoreError> {
        sqlx::query_scalar("SELECT wrapped FROM data_keys WHERE streamer_id = ?")
            .bind(id.as_str())
            .fetch_optional(&self.pool)
            .await
            .map_err(StoreError::new)
    }
}

impl KeyStore for SqliteKeyStore {
    async fn create(&self, id: &StreamerId) -> Result<DataKey, StoreError> {
        if let Some(existing) = self.get(id).await? {
            return Ok(existing);
        }
        let key = DataKey::from_bytes(random_bytes().map_err(StoreError::new)?);
        let wrapped = seal(self.master.bytes(), key.bytes(), id.as_str().as_bytes()).map_err(StoreError::new)?;
        // Two creates at once: the first one wins, both return its key
        sqlx::query("INSERT INTO data_keys (streamer_id, wrapped, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
            .bind(id.as_str())
            .bind(wrapped)
            .bind(now_ms())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        self.get(id).await?.ok_or_else(|| StoreError::new("data key vanished after create"))
    }

    async fn get(&self, id: &StreamerId) -> Result<Option<DataKey>, StoreError> {
        self.wrapped(id).await?.map(|wrapped| unwrap_key(&self.master, id.as_str(), &wrapped)).transpose()
    }

    async fn shred(&self, id: &StreamerId) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM data_keys WHERE streamer_id = ?")
            .bind(id.as_str())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }
}
