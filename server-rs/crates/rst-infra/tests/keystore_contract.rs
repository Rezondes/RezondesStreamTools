//! Contract of the `KeyStore` port: every adapter must pass these checks. Runs against SQLite in a temp folder.

use rst_app::ports::keys::KeyStore;
use rst_domain::identity::values::StreamerId;
use rst_infra::crypto::cipher::{open, seal};
use rst_infra::crypto::master::MasterKey;
use rst_infra::keys::sqlite::SqliteKeyStore;

fn streamer(byte: u8) -> StreamerId {
    StreamerId::from_bytes([byte; 16])
}

/// The checks every adapter passes
async fn contract(store: &impl KeyStore) {
    let neo = streamer(1);
    assert!(store.get(&neo).await.expect("get").is_none());
    let key = store.create(&neo).await.expect("create");
    assert_eq!(store.get(&neo).await.expect("get").map(|found| *found.bytes()), Some(*key.bytes()));
    // A second create keeps the key
    assert_eq!(*store.create(&neo).await.expect("create again").bytes(), *key.bytes());
    // Every streamer has their own key
    let trinity = store.create(&streamer(2)).await.expect("create");
    assert_ne!(*trinity.bytes(), *key.bytes());
}

async fn sqlite(folder: &tempfile::TempDir, master: MasterKey) -> SqliteKeyStore {
    SqliteKeyStore::open(&folder.path().join("keys.db"), master).await.expect("open")
}

#[tokio::test]
async fn sqlite_passes_the_contract() {
    let folder = tempfile::tempdir().expect("temp folder");
    contract(&sqlite(&folder, MasterKey::from_bytes([3; 32])).await).await;
}

#[tokio::test]
async fn shred_makes_data_unreadable() {
    let folder = tempfile::tempdir().expect("temp folder");
    let store = sqlite(&folder, MasterKey::from_bytes([3; 32])).await;
    let neo = streamer(1);
    let key = store.create(&neo).await.expect("create");
    let secret = seal(key.bytes(), b"tokens of neo", neo.as_str().as_bytes()).expect("seal");
    drop(key);
    store.shred(&neo).await.expect("shred");
    assert!(store.get(&neo).await.expect("get").is_none());
    // A new key for the same streamer does not open the old data
    let fresh = store.create(&neo).await.expect("create");
    assert!(open(fresh.bytes(), &secret, neo.as_str().as_bytes()).is_err());
}

#[tokio::test]
async fn keys_survive_a_restart_and_need_the_right_master() {
    let folder = tempfile::tempdir().expect("temp folder");
    let neo = streamer(1);
    let key = *sqlite(&folder, MasterKey::from_bytes([3; 32])).await.create(&neo).await.expect("create").bytes();
    let reopened = sqlite(&folder, MasterKey::from_bytes([3; 32])).await;
    assert_eq!(reopened.get(&neo).await.expect("get").map(|found| *found.bytes()), Some(key));
    let wrong = sqlite(&folder, MasterKey::from_bytes([4; 32])).await;
    assert!(wrong.get(&neo).await.is_err());
}

#[tokio::test]
async fn rewrap_keeps_data_readable() {
    let folder = tempfile::tempdir().expect("temp folder");
    let mut store = sqlite(&folder, MasterKey::from_bytes([3; 32])).await;
    let neo = streamer(1);
    let key = store.create(&neo).await.expect("create");
    store.create(&streamer(2)).await.expect("create");
    let secret = seal(key.bytes(), b"settings", b"").expect("seal");
    assert_eq!(store.rewrap_all(MasterKey::from_bytes([5; 32])).await.expect("rewrap"), 2);
    let reopened = sqlite(&folder, MasterKey::from_bytes([5; 32])).await;
    let again = reopened.get(&neo).await.expect("get").expect("key");
    assert_eq!(open(again.bytes(), &secret, b"").expect("open").as_slice(), b"settings");
    assert!(sqlite(&folder, MasterKey::from_bytes([3; 32])).await.get(&neo).await.is_err());
}

#[tokio::test]
async fn separate_file() {
    let folder = tempfile::tempdir().expect("temp folder");
    let path = folder.path().join("elsewhere").join("keys.db");
    std::fs::create_dir_all(path.parent().expect("parent")).expect("folder");
    SqliteKeyStore::open(&path, MasterKey::from_bytes([3; 32]))
        .await
        .expect("open")
        .create(&streamer(1))
        .await
        .expect("create");
    assert!(path.is_file());
    let names: Vec<_> =
        std::fs::read_dir(folder.path()).expect("list").map(|entry| entry.expect("entry").file_name()).collect();
    assert_eq!(names, ["elsewhere"]);
}
