//! The data database (SQLite): opened in WAL mode with foreign keys on, migrations run on every start and are
//! without effect when already applied.

use std::path::Path;
use std::time::Duration;

use rst_app::ports::StoreError;
use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};

pub const DATA_DB_VAR: &str = "RST_DATA_DB";

/// # Errors
/// When the file cannot be opened or a migration fails.
pub async fn open_data_db(path: &Path) -> Result<SqlitePool, StoreError> {
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true)
        .busy_timeout(Duration::from_secs(5));
    let pool = SqlitePoolOptions::new().max_connections(8).connect_with(options).await.map_err(StoreError::new)?;
    sqlx::migrate!("../../migrations").run(&pool).await.map_err(StoreError::new)?;
    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn migrations_twice() {
        let folder = tempfile::tempdir().expect("temp folder");
        let path = folder.path().join("data.db");
        open_data_db(&path).await.expect("first start").close().await;
        let pool = open_data_db(&path).await.expect("second start");
        let applied: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM _sqlx_migrations").fetch_one(&pool).await.expect("count");
        assert_eq!(applied, 1);
        let tables: Vec<String> =
            sqlx::query_scalar("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite%' ORDER BY name")
                .fetch_all(&pool)
                .await
                .expect("tables");
        assert_eq!(tables, ["audit_log", "records", "server_settings", "sessions", "streamers"]);
    }

    #[tokio::test]
    async fn pragmas() {
        let folder = tempfile::tempdir().expect("temp folder");
        let pool = open_data_db(&folder.path().join("data.db")).await.expect("open");
        let journal: String = sqlx::query_scalar("PRAGMA journal_mode").fetch_one(&pool).await.expect("journal");
        assert_eq!(journal, "wal");
        let foreign_keys: i64 = sqlx::query_scalar("PRAGMA foreign_keys").fetch_one(&pool).await.expect("foreign keys");
        assert_eq!(foreign_keys, 1);
    }
}
