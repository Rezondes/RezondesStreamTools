//! Contracts of the `SessionStore` and `AuditStore` ports against SQLite.

use rst_app::ports::audit::AuditStore;
use rst_app::ports::sessions::SessionStore;
use rst_app::ports::streamers::{StreamerRepository, StreamerRow};
use rst_domain::identity::values::StreamerId;
use rst_infra::db::pool::open_data_db;
use rst_infra::db::sqlite_audit::SqliteAudit;
use rst_infra::db::sqlite_sessions::SqliteSessions;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use sqlx::SqlitePool;

fn id(byte: u8) -> StreamerId {
    StreamerId::from_bytes([byte; 16])
}

/// A database with two streamers (sessions need an existing streamer)
async fn database() -> (SqlitePool, tempfile::TempDir) {
    let folder = tempfile::tempdir().expect("temp folder");
    let pool = open_data_db(&folder.path().join("data.db")).await.expect("open");
    let streamers = SqliteStreamers::new(pool.clone());
    for byte in [1, 2] {
        let row = StreamerRow { id: id(byte), user_id_digest: [byte; 32], login_digest: [byte + 10; 32] };
        streamers.insert(&row, 0).await.expect("streamer");
    }
    (pool, folder)
}

#[tokio::test]
async fn sessions_find_delete_and_expire() {
    let (pool, _folder) = database().await;
    let sessions = SqliteSessions::new(pool.clone());
    sessions.insert(&[1; 32], &id(1), 100).await.expect("insert");
    sessions.insert(&[2; 32], &id(1), 200).await.expect("insert");
    sessions.insert(&[3; 32], &id(2), 300).await.expect("insert");
    assert!(sessions.insert(&[4; 32], &id(9), 300).await.is_err(), "unknown streamer");
    assert_eq!(sessions.find(&[1; 32]).await.expect("find"), Some((id(1), 100)));
    assert_eq!(sessions.find(&[9; 32]).await.expect("find"), None);
    sessions.delete(&[1; 32]).await.expect("delete");
    assert_eq!(sessions.find(&[1; 32]).await.expect("find"), None);
    assert_eq!(sessions.delete_expired(250).await.expect("expire"), 1);
    assert_eq!(sessions.find(&[3; 32]).await.expect("find"), Some((id(2), 300)));
    sessions.delete_streamer(&id(2)).await.expect("delete streamer");
    assert_eq!(sessions.find(&[3; 32]).await.expect("find"), None);
}

#[tokio::test]
async fn sessions_go_with_their_streamer() {
    let (pool, _folder) = database().await;
    let sessions = SqliteSessions::new(pool.clone());
    sessions.insert(&[1; 32], &id(1), 100).await.expect("insert");
    SqliteStreamers::new(pool).delete(&id(1)).await.expect("delete streamer");
    assert_eq!(sessions.find(&[1; 32]).await.expect("find"), None);
}

#[tokio::test]
async fn audit_appends_and_lists_newest_first() {
    let (pool, _folder) = database().await;
    let audit = SqliteAudit::new(pool);
    let first = audit.append(Some(&id(1)), 10, b"a").await.expect("append");
    let second = audit.append(Some(&id(1)), 20, b"b").await.expect("append");
    audit.append(None, 30, b"server").await.expect("append");
    audit.append(Some(&id(2)), 40, b"c").await.expect("append");
    assert!(second > first);
    let own: Vec<(i64, Vec<u8>)> = audit
        .list(Some(&id(1)), 10)
        .await
        .expect("list")
        .into_iter()
        .map(|entry| (entry.created_at, entry.ciphertext))
        .collect();
    assert_eq!(own, [(20, b"b".to_vec()), (10, b"a".to_vec())]);
    assert_eq!(audit.list(Some(&id(1)), 1).await.expect("limit").len(), 1);
    let server = audit.list(None, 10).await.expect("server");
    assert_eq!(server.len(), 1);
    assert_eq!(server[0].ciphertext, b"server");
}
