//! Contract of the `RecordStore` port. `contract_tests!(module, make)` writes the checks for one adapter; `make` is
//! an async expression that builds a fresh, empty store. A second adapter (PostgreSQL) only needs another call.

use rst_app::ports::records::RecordStore;
use rst_domain::identity::values::StreamerId;
use rst_infra::db::pool::open_data_db;
use rst_infra::db::sqlite_records::SqliteRecords;

fn streamer(byte: u8) -> StreamerId {
    StreamerId::from_bytes([byte; 16])
}

macro_rules! contract_tests {
    ($name:ident, $make:expr) => {
        mod $name {
            use super::*;

            #[tokio::test]
            async fn put_get_and_replace() {
                let (store, _guard) = $make;
                let neo = streamer(1);
                assert_eq!(store.get(&neo, "settings", "").await.expect("get"), None);
                store.put(&neo, "settings", "", b"first", 1).await.expect("put");
                store.put(&neo, "settings", "", b"second", 2).await.expect("put");
                assert_eq!(store.get(&neo, "settings", "").await.expect("get"), Some(b"second".to_vec()));
                assert_eq!(store.get(&streamer(2), "settings", "").await.expect("get"), None);
                assert_eq!(store.get(&neo, "triggers", "").await.expect("get"), None);
            }

            #[tokio::test]
            async fn list_by_kind_sorted_by_key() {
                let (store, _guard) = $make;
                let neo = streamer(1);
                store.put(&neo, "media", "b.png", b"2", 1).await.expect("put");
                store.put(&neo, "media", "a.gif", b"1", 1).await.expect("put");
                store.put(&neo, "settings", "", b"x", 1).await.expect("put");
                store.put(&streamer(2), "media", "c.png", b"3", 1).await.expect("put");
                let listed = store.list(&neo, "media").await.expect("list");
                assert_eq!(listed, [("a.gif".to_owned(), b"1".to_vec()), ("b.png".to_owned(), b"2".to_vec())]);
                assert!(store.list(&neo, "unknown").await.expect("list").is_empty());
            }

            #[tokio::test]
            async fn delete_one_and_a_whole_streamer() {
                let (store, _guard) = $make;
                let neo = streamer(1);
                let trinity = streamer(2);
                store.put(&neo, "media", "a.gif", b"1", 1).await.expect("put");
                store.put(&neo, "settings", "", b"x", 1).await.expect("put");
                store.put(&trinity, "settings", "", b"y", 1).await.expect("put");
                assert!(store.delete(&neo, "media", "a.gif").await.expect("delete"));
                assert!(!store.delete(&neo, "media", "a.gif").await.expect("delete again"));
                store.delete_streamer(&neo).await.expect("delete streamer");
                assert_eq!(store.get(&neo, "settings", "").await.expect("get"), None);
                assert_eq!(store.get(&trinity, "settings", "").await.expect("get"), Some(b"y".to_vec()));
            }

            #[tokio::test]
            async fn export_everything_in_order() {
                let (store, _guard) = $make;
                store.put(&streamer(2), "settings", "", b"y", 7).await.expect("put");
                store.put(&streamer(1), "triggers", "", b"t", 5).await.expect("put");
                store.put(&streamer(1), "settings", "", b"x", 6).await.expect("put");
                let all = store.export_all().await.expect("export");
                let places: Vec<_> = all
                    .iter()
                    .map(|record| (record.streamer_id.clone(), record.kind.as_str(), record.updated_at))
                    .collect();
                assert_eq!(
                    places,
                    [(streamer(1), "settings", 6), (streamer(1), "triggers", 5), (streamer(2), "settings", 7)]
                );
                assert_eq!(all[0].ciphertext, b"x");
            }
        }
    };
}

/// A fresh SQLite store; the temp folder lives as long as the guard
async fn sqlite() -> (SqliteRecords, tempfile::TempDir) {
    let folder = tempfile::tempdir().expect("temp folder");
    let pool = open_data_db(&folder.path().join("data.db")).await.expect("open");
    (SqliteRecords::new(pool), folder)
}

contract_tests!(sqlite_records, sqlite().await);
