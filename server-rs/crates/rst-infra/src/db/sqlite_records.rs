//! `RecordStore` on the `records` table of the data database.

use rst_app::ports::StoreError;
use rst_app::ports::records::{RecordStore, StoredRecord};
use rst_domain::identity::values::StreamerId;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteRecords {
    pool: SqlitePool,
}

impl SqliteRecords {
    #[must_use]
    pub const fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl RecordStore for SqliteRecords {
    async fn put(
        &self,
        streamer: &StreamerId,
        kind: &str,
        key: &str,
        ciphertext: &[u8],
        now: i64,
    ) -> Result<(), StoreError> {
        sqlx::query(
            "INSERT INTO records (streamer_id, kind, record_key, ciphertext, updated_at) VALUES (?, ?, ?, ?, ?) \
             ON CONFLICT (streamer_id, kind, record_key) DO UPDATE SET ciphertext = excluded.ciphertext, updated_at = excluded.updated_at",
        )
        .bind(streamer.as_str())
        .bind(kind)
        .bind(key)
        .bind(ciphertext)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(StoreError::new)?;
        Ok(())
    }

    async fn get(&self, streamer: &StreamerId, kind: &str, key: &str) -> Result<Option<Vec<u8>>, StoreError> {
        sqlx::query_scalar("SELECT ciphertext FROM records WHERE streamer_id = ? AND kind = ? AND record_key = ?")
            .bind(streamer.as_str())
            .bind(kind)
            .bind(key)
            .fetch_optional(&self.pool)
            .await
            .map_err(StoreError::new)
    }

    async fn list(&self, streamer: &StreamerId, kind: &str) -> Result<Vec<(String, Vec<u8>)>, StoreError> {
        sqlx::query_as(
            "SELECT record_key, ciphertext FROM records WHERE streamer_id = ? AND kind = ? ORDER BY record_key",
        )
        .bind(streamer.as_str())
        .bind(kind)
        .fetch_all(&self.pool)
        .await
        .map_err(StoreError::new)
    }

    async fn delete(&self, streamer: &StreamerId, kind: &str, key: &str) -> Result<bool, StoreError> {
        let result = sqlx::query("DELETE FROM records WHERE streamer_id = ? AND kind = ? AND record_key = ?")
            .bind(streamer.as_str())
            .bind(kind)
            .bind(key)
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(result.rows_affected() > 0)
    }

    async fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM records WHERE streamer_id = ?")
            .bind(streamer.as_str())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn export_all(&self) -> Result<Vec<StoredRecord>, StoreError> {
        let rows: Vec<(String, String, String, Vec<u8>, i64)> = sqlx::query_as(
            "SELECT streamer_id, kind, record_key, ciphertext, updated_at FROM records ORDER BY streamer_id, kind, record_key",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(StoreError::new)?;
        rows.into_iter()
            .map(|(streamer_id, kind, key, ciphertext, updated_at)| {
                let streamer_id = StreamerId::parse(&streamer_id).map_err(StoreError::new)?;
                Ok(StoredRecord { streamer_id, kind, key, ciphertext, updated_at })
            })
            .collect()
    }
}
