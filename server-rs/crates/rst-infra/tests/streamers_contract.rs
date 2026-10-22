//! Contract of the `StreamerRepository` port against SQLite, and the promise that neither login nor Twitch ID is
//! ever stored in plaintext.

use rst_app::crypto::lookup::LookupKey;
use rst_app::identity::streamers::Streamers;
use rst_app::ports::streamers::{StreamerRepository, StreamerRow};
use rst_app::vault::Vault;
use rst_domain::identity::values::{Login, StreamerId, TwitchUserId};
use rst_infra::crypto::master::MasterKey;
use rst_infra::db::pool::open_data_db;
use rst_infra::db::sqlite_records::SqliteRecords;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use rst_infra::keys::sqlite::SqliteKeyStore;

fn row(byte: u8) -> StreamerRow {
    StreamerRow { id: StreamerId::from_bytes([byte; 16]), user_id_digest: [byte; 32], login_digest: [byte + 100; 32] }
}

#[tokio::test]
async fn sqlite_passes_the_contract() {
    let folder = tempfile::tempdir().expect("temp folder");
    let store = SqliteStreamers::new(open_data_db(&folder.path().join("data.db")).await.expect("open"));
    store.insert(&row(2), 20).await.expect("insert");
    store.insert(&row(1), 10).await.expect("insert");
    assert!(store.insert(&row(1), 30).await.is_err());
    assert!(store.insert(&StreamerRow { id: StreamerId::from_bytes([9; 16]), ..row(1) }, 30).await.is_err());
    assert_eq!(store.find_by_user_id(&[1; 32]).await.expect("find"), Some(row(1)));
    assert_eq!(store.find_by_login(&[102; 32]).await.expect("find"), Some(row(2)));
    assert_eq!(store.find_by_login(&[50; 32]).await.expect("find"), None);
    store.set_login(&row(1).id, &[77; 32]).await.expect("rename");
    assert_eq!(store.find_by_login(&[77; 32]).await.expect("find").map(|found| found.id), Some(row(1).id));
    assert_eq!(store.ids().await.expect("ids"), [row(1).id, row(2).id]);
    assert_eq!(store.created_at(&row(2).id).await.expect("created"), Some(20));
    assert_eq!(store.created_at(&row(3).id).await.expect("created"), None);
    store.delete(&row(1).id).await.expect("delete");
    assert_eq!(store.ids().await.expect("ids"), [row(2).id]);
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|window| window == needle)
}

#[tokio::test]
async fn no_plaintext_in_file() {
    let folder = tempfile::tempdir().expect("temp folder");
    let pool = open_data_db(&folder.path().join("data.db")).await.expect("open");
    let master = MasterKey::from_bytes([3; 32]);
    let keys = SqliteKeyStore::open(&folder.path().join("keys.db"), master.clone()).await.expect("keys");
    let streamers = Streamers::new(
        SqliteStreamers::new(pool.clone()),
        Vault::new(SqliteRecords::new(pool.clone()), keys),
        LookupKey::from_bytes(*master.derive("lookup")),
    );
    let neo = Login::parse("neo").expect("login");
    let user = TwitchUserId::parse("12345").expect("user id");
    streamers.register(&user, &neo, StreamerId::from_bytes([0xab; 16]), 1).await.expect("register");
    assert_eq!(streamers.list().await.expect("list").len(), 1);
    pool.close().await;
    for name in ["data.db", "data.db-wal", "keys.db", "keys.db-wal"] {
        let Ok(bytes) = std::fs::read(folder.path().join(name)) else { continue };
        assert!(!contains(&bytes, b"neo"), "login in {name}");
        assert!(!contains(&bytes, b"12345"), "user id in {name}");
    }
}
