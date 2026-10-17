//! `ServerSettingsStore` on the `server_settings` table of the data database.

use rst_app::ports::StoreError;
use rst_app::ports::server_settings::ServerSettingsStore;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteServerSettings {
    pool: SqlitePool,
}

impl SqliteServerSettings {
    #[must_use]
    pub const fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl ServerSettingsStore for SqliteServerSettings {
    async fn put(&self, key: &str, ciphertext: &[u8], now: i64) -> Result<(), StoreError> {
        sqlx::query(
            "INSERT INTO server_settings (setting_key, ciphertext, updated_at) VALUES (?, ?, ?) \
             ON CONFLICT (setting_key) DO UPDATE SET ciphertext = excluded.ciphertext, updated_at = excluded.updated_at",
        )
        .bind(key)
        .bind(ciphertext)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(StoreError::new)?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>, StoreError> {
        sqlx::query_scalar("SELECT ciphertext FROM server_settings WHERE setting_key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await
            .map_err(StoreError::new)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::open_data_db;

    #[tokio::test]
    async fn put_replaces_and_get_reads() {
        let folder = tempfile::tempdir().expect("temp folder");
        let store = SqliteServerSettings::new(open_data_db(&folder.path().join("data.db")).await.expect("open"));
        assert_eq!(store.get("access").await.expect("get"), None);
        store.put("access", b"one", 1).await.expect("put");
        store.put("access", b"two", 2).await.expect("put");
        assert_eq!(store.get("access").await.expect("get"), Some(b"two".to_vec()));
    }
}
