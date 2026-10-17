//! `SessionStore` on the `sessions` table of the data database.

use rst_app::ports::StoreError;
use rst_app::ports::sessions::SessionStore;
use rst_domain::identity::values::StreamerId;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteSessions {
    pool: SqlitePool,
}

impl SqliteSessions {
    #[must_use]
    pub const fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl SessionStore for SqliteSessions {
    async fn insert(&self, hash: &[u8; 32], streamer: &StreamerId, expires_at: i64) -> Result<(), StoreError> {
        sqlx::query("INSERT INTO sessions (token_hash, streamer_id, expires_at) VALUES (?, ?, ?)")
            .bind(hash.as_slice())
            .bind(streamer.as_str())
            .bind(expires_at)
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn find(&self, hash: &[u8; 32]) -> Result<Option<(StreamerId, i64)>, StoreError> {
        let row: Option<(String, i64)> =
            sqlx::query_as("SELECT streamer_id, expires_at FROM sessions WHERE token_hash = ?")
                .bind(hash.as_slice())
                .fetch_optional(&self.pool)
                .await
                .map_err(StoreError::new)?;
        row.map(|(streamer, expires_at)| Ok((StreamerId::parse(&streamer).map_err(StoreError::new)?, expires_at)))
            .transpose()
    }

    async fn delete(&self, hash: &[u8; 32]) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
            .bind(hash.as_slice())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn delete_streamer(&self, streamer: &StreamerId) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM sessions WHERE streamer_id = ?")
            .bind(streamer.as_str())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn delete_expired(&self, now: i64) -> Result<u64, StoreError> {
        let result = sqlx::query("DELETE FROM sessions WHERE expires_at <= ?")
            .bind(now)
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(result.rows_affected())
    }
}
