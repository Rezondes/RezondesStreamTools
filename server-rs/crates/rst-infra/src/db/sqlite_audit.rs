//! `AuditStore` on the `audit_log` table of the data database: only inserts and selects, never an update or delete.

use rst_app::ports::StoreError;
use rst_app::ports::audit::{AuditStore, StoredEntry};
use rst_domain::identity::values::StreamerId;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteAudit {
    pool: SqlitePool,
}

impl SqliteAudit {
    #[must_use]
    pub const fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl AuditStore for SqliteAudit {
    async fn append(
        &self,
        streamer: Option<&StreamerId>,
        created_at: i64,
        ciphertext: &[u8],
    ) -> Result<i64, StoreError> {
        let result = sqlx::query("INSERT INTO audit_log (streamer_id, created_at, ciphertext) VALUES (?, ?, ?)")
            .bind(streamer.map(StreamerId::as_str))
            .bind(created_at)
            .bind(ciphertext)
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(result.last_insert_rowid())
    }

    async fn list(&self, streamer: Option<&StreamerId>, limit: u32) -> Result<Vec<StoredEntry>, StoreError> {
        // `IS` compares NULL like a value: NULL selects the server-wide entries
        let rows: Vec<(i64, i64, Vec<u8>)> = sqlx::query_as(
            "SELECT id, created_at, ciphertext FROM audit_log WHERE streamer_id IS ? ORDER BY id DESC LIMIT ?",
        )
        .bind(streamer.map(StreamerId::as_str))
        .bind(i64::from(limit))
        .fetch_all(&self.pool)
        .await
        .map_err(StoreError::new)?;
        Ok(rows.into_iter().map(|(id, created_at, ciphertext)| StoredEntry { id, created_at, ciphertext }).collect())
    }
}
