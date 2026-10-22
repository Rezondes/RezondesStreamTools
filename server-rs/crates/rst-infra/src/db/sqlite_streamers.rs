//! `StreamerRepository` on the `streamers` table of the data database.

use rst_app::ports::StoreError;
use rst_app::ports::streamers::{StreamerRepository, StreamerRow};
use rst_domain::identity::values::StreamerId;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteStreamers {
    pool: SqlitePool,
}

impl SqliteStreamers {
    #[must_use]
    pub const fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    async fn find(&self, query: &'static str, digest: &[u8; 32]) -> Result<Option<StreamerRow>, StoreError> {
        let row: Option<(String, Vec<u8>, Vec<u8>)> =
            sqlx::query_as(query).bind(digest.as_slice()).fetch_optional(&self.pool).await.map_err(StoreError::new)?;
        row.map(|(id, user_id_digest, login_digest)| {
            let digest =
                |bytes: Vec<u8>| <[u8; 32]>::try_from(bytes).map_err(|_| StoreError::new("digest of wrong length"));
            Ok(StreamerRow {
                id: StreamerId::parse(&id).map_err(StoreError::new)?,
                user_id_digest: digest(user_id_digest)?,
                login_digest: digest(login_digest)?,
            })
        })
        .transpose()
    }
}

impl StreamerRepository for SqliteStreamers {
    async fn insert(&self, row: &StreamerRow, now: i64) -> Result<(), StoreError> {
        sqlx::query("INSERT INTO streamers (id, user_id_hmac, login_hmac, created_at) VALUES (?, ?, ?, ?)")
            .bind(row.id.as_str())
            .bind(row.user_id_digest.as_slice())
            .bind(row.login_digest.as_slice())
            .bind(now)
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn find_by_user_id(&self, digest: &[u8; 32]) -> Result<Option<StreamerRow>, StoreError> {
        self.find("SELECT id, user_id_hmac, login_hmac FROM streamers WHERE user_id_hmac = ?", digest).await
    }

    async fn find_by_login(&self, digest: &[u8; 32]) -> Result<Option<StreamerRow>, StoreError> {
        self.find("SELECT id, user_id_hmac, login_hmac FROM streamers WHERE login_hmac = ?", digest).await
    }

    async fn set_login(&self, id: &StreamerId, digest: &[u8; 32]) -> Result<(), StoreError> {
        sqlx::query("UPDATE streamers SET login_hmac = ? WHERE id = ?")
            .bind(digest.as_slice())
            .bind(id.as_str())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }

    async fn ids(&self) -> Result<Vec<StreamerId>, StoreError> {
        let ids: Vec<String> = sqlx::query_scalar("SELECT id FROM streamers ORDER BY created_at, id")
            .fetch_all(&self.pool)
            .await
            .map_err(StoreError::new)?;
        ids.iter().map(|id| StreamerId::parse(id).map_err(StoreError::new)).collect()
    }

    async fn created_at(&self, id: &StreamerId) -> Result<Option<i64>, StoreError> {
        sqlx::query_scalar("SELECT created_at FROM streamers WHERE id = ?")
            .bind(id.as_str())
            .fetch_optional(&self.pool)
            .await
            .map_err(StoreError::new)
    }

    async fn delete(&self, id: &StreamerId) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM streamers WHERE id = ?")
            .bind(id.as_str())
            .execute(&self.pool)
            .await
            .map_err(StoreError::new)?;
        Ok(())
    }
}
