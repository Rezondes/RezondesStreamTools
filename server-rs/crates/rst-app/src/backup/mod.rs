//! Server-wide backups for admins: an archive of the data database (ciphertext stays ciphertext) and the encrypted
//! files, never the key store. Creating and restoring run one at a time; an uploaded archive is checked before it
//! counts. Streamers whose data key is gone (deleted) are left out of a restore. Every action lands in the audit log.
//! Every change of the list or of the running state counts up [`Backups::changes`], the admin dashboard listens to it.

pub mod keys;
pub mod schedule;

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use tokio::sync::watch;

use serde_json::{Value, json};

use crate::audit::{AuditEntry, AuditLog};
use crate::crypto::to_hex;
use crate::ports::StoreError;
use crate::ports::audit::AuditStore;
use crate::ports::backups::{ArchiveError, BackupInfo, BackupStore};
use crate::ports::keys::KeyStore;
use crate::vault::VaultError;
use schedule::BackupSchedule;

/// Who acts for the schedule in the audit log
pub const SCHEDULE_ACTOR: &str = "schedule";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BackupError {
    /// Another backup is still being written or restored
    Busy,
    /// The archive is not a backup of this server; the reason is for the log
    Invalid(String),
    NotFound,
    Store(StoreError),
}

impl From<ArchiveError> for BackupError {
    fn from(error: ArchiveError) -> Self {
        match error {
            ArchiveError::Invalid(reason) => Self::Invalid(reason),
            ArchiveError::NotFound => Self::NotFound,
            ArchiveError::Store(error) => Self::Store(error),
        }
    }
}

/// What a restore did: how many streamers came back and which were left out for lack of a data key
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct RestoreReport {
    pub restored: usize,
    pub skipped: Vec<String>,
}

impl From<StoreError> for BackupError {
    fn from(error: StoreError) -> Self {
        Self::Store(error)
    }
}

impl From<VaultError> for BackupError {
    fn from(error: VaultError) -> Self {
        Self::Store(StoreError::new(error))
    }
}

/// `manual-<ms>-<8 hex>` or `auto-<ms>-<8 hex>`; nothing else is ever a file name in the backup folder
#[must_use]
pub fn is_backup_id(id: &str) -> bool {
    let rest = id.strip_prefix("manual-").or_else(|| id.strip_prefix("auto-"));
    rest.and_then(|rest| rest.split_once('-')).is_some_and(|(time, random)| {
        (1..=20).contains(&time.len())
            && time.bytes().all(|byte| byte.is_ascii_digit())
            && random.len() == 8
            && random.bytes().all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
    })
}

fn entry(actor: &str, action: &str, after: Value) -> AuditEntry {
    AuditEntry {
        id: 0,
        created_at: 0,
        actor: actor.to_owned(),
        action: action.to_owned(),
        before: None,
        after: Some(after),
    }
}

/// When the creating task ends (also by a panic) the next backup may start
struct Running {
    busy: Arc<AtomicBool>,
    changes: Arc<watch::Sender<u64>>,
}

impl Drop for Running {
    fn drop(&mut self) {
        self.busy.store(false, Ordering::SeqCst);
        count_up(&self.changes);
    }
}

fn count_up(changes: &watch::Sender<u64>) {
    changes.send_modify(|count| *count = count.wrapping_add(1));
}

pub struct Backups<B, A, K> {
    store: Arc<B>,
    audit: AuditLog<A, K>,
    keys: K,
    busy: Arc<AtomicBool>,
    changes: Arc<watch::Sender<u64>>,
}

impl<B, A, K> Backups<B, A, K>
where
    B: BackupStore,
    A: AuditStore + Clone + Send + Sync + 'static,
    K: KeyStore + Clone + 'static,
{
    pub fn new(store: B, audit: AuditLog<A, K>, keys: K) -> Self {
        let changes = Arc::new(watch::channel(0).0);
        Self { store: Arc::new(store), audit, keys, busy: Arc::new(AtomicBool::new(false)), changes }
    }

    /// Takes the one slot for creating or restoring
    fn take_slot(&self) -> Result<Running, BackupError> {
        if self.busy.swap(true, Ordering::SeqCst) {
            return Err(BackupError::Busy);
        }
        count_up(&self.changes);
        Ok(Running { busy: Arc::clone(&self.busy), changes: Arc::clone(&self.changes) })
    }

    /// Counts up on every change of the list or of the running state; a receiver sees that something changed
    #[must_use]
    pub fn changes(&self) -> watch::Receiver<u64> {
        self.changes.subscribe()
    }

    /// Starts a backup in the background and returns its id; `random` makes the id unique
    ///
    /// # Errors
    /// `Busy` while another backup is being written.
    pub fn start(&self, actor: &str, automatic: bool, now: i64, random: [u8; 4]) -> Result<String, BackupError> {
        let running = self.take_slot()?;
        let id = format!("{}-{now}-{}", if automatic { "auto" } else { "manual" }, to_hex(&random));
        let (store, audit, actor, task_id) =
            (Arc::clone(&self.store), self.audit.clone(), actor.to_owned(), id.clone());
        tokio::spawn(async move {
            let _running = running;
            let after = match store.create(&task_id, now).await {
                Ok(info) => json!({ "id": info.id, "bytes": info.bytes }),
                Err(error) => {
                    eprintln!("Backup {task_id} failed: {error}");
                    json!({ "id": task_id, "error": error.to_string() })
                }
            };
            if let Err(error) = audit.append(None, &entry(&actor, "backup.create", after), now).await {
                eprintln!("Audit entry of backup {task_id} failed: {error}");
            }
        });
        Ok(id)
    }

    #[must_use]
    pub fn running(&self) -> bool {
        self.busy.load(Ordering::SeqCst)
    }

    /// # Errors
    /// When the backup folder cannot be read.
    pub async fn list(&self) -> Result<Vec<BackupInfo>, BackupError> {
        Ok(self.store.list().await?)
    }

    /// The archive for a download, noted in the audit log; `None` for an unknown id
    ///
    /// # Errors
    /// When the audit entry cannot be stored.
    pub async fn download(&self, actor: &str, id: &str, now: i64) -> Result<Option<PathBuf>, BackupError> {
        let Some(path) = self.store.file(id).filter(|_| is_backup_id(id)) else { return Ok(None) };
        self.audit.append(None, &entry(actor, "backup.download", json!({ "id": id })), now).await?;
        Ok(Some(path))
    }

    /// Where an upload is written before [`Self::accept_upload`]; the id is made like the one of a manual backup
    #[must_use]
    pub fn upload_target(&self, now: i64, random: [u8; 4]) -> (String, PathBuf) {
        let id = format!("manual-{now}-{}", to_hex(&random));
        let path = self.store.incoming(&id);
        (id, path)
    }

    /// Checks an uploaded archive; only a valid one becomes a backup
    ///
    /// # Errors
    /// `Invalid` for an archive that is not a backup of this server (it is deleted), otherwise when storing fails.
    pub async fn accept_upload(&self, actor: &str, id: &str, now: i64) -> Result<BackupInfo, BackupError> {
        let info = self.store.accept(id).await?;
        count_up(&self.changes);
        self.audit.append(None, &entry(actor, "backup.upload", json!({ "id": id, "bytes": info.bytes })), now).await?;
        Ok(info)
    }

    /// Restores a backup; streamers whose data key is gone are left out. The caller stops every runtime before and
    /// starts them again after.
    ///
    /// # Errors
    /// `Busy` while another backup runs, `NotFound`, `Invalid` for an archive that does not pass the check, `Store`
    /// when restoring fails (then nothing changed).
    pub async fn restore(&self, actor: &str, id: &str, now: i64) -> Result<RestoreReport, BackupError> {
        if !is_backup_id(id) {
            return Err(BackupError::NotFound);
        }
        let _running = self.take_slot()?;
        let mut keep = Vec::new();
        let mut skipped = Vec::new();
        for streamer in self.store.inspect(id).await? {
            if self.keys.get(&streamer).await?.is_some() {
                keep.push(streamer);
            } else {
                skipped.push(streamer.as_str().to_owned());
            }
        }
        self.store.restore(id, &keep).await?;
        let report = RestoreReport { restored: keep.len(), skipped };
        let after = json!({ "id": id, "restored": report.restored, "skipped": report.skipped.len() });
        self.audit.append(None, &entry(actor, "backup.restore", after), now).await?;
        Ok(report)
    }

    /// The scheduled step: deletes automatic backups beyond the ones to keep and starts one when it is due. Returns
    /// the id of a started backup.
    ///
    /// # Errors
    /// When the backup folder cannot be read or a surplus backup cannot be deleted.
    pub async fn run_schedule(
        &self,
        schedule: &BackupSchedule,
        now: i64,
        random: [u8; 4],
    ) -> Result<Option<String>, BackupError> {
        let list = self.list().await?;
        for id in schedule.surplus(&list) {
            self.delete(SCHEDULE_ACTOR, &id, now).await?;
        }
        let newest = list.iter().filter(|backup| backup.automatic).map(|backup| backup.created_at).max();
        if self.running() || !schedule.due(newest, now) {
            return Ok(None);
        }
        match self.start(SCHEDULE_ACTOR, true, now, random) {
            Ok(id) => Ok(Some(id)),
            Err(BackupError::Busy) => Ok(None),
            Err(error) => Err(error),
        }
    }

    /// `false` for an unknown id
    ///
    /// # Errors
    /// When the archive or the audit entry cannot be written.
    pub async fn delete(&self, actor: &str, id: &str, now: i64) -> Result<bool, BackupError> {
        if !is_backup_id(id) || !self.store.delete(id).await? {
            return Ok(false);
        }
        count_up(&self.changes);
        self.audit.append(None, &entry(actor, "backup.delete", json!({ "id": id })), now).await?;
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;
    use std::time::Duration;

    use rst_domain::identity::values::StreamerId;

    use super::*;
    use crate::ports::keys::DataKey;
    use crate::testing::{MemoryAudit, MemoryKeys};

    /// Archives in memory; `create` waits until `release` is notified
    #[derive(Default)]
    struct MemoryBackups {
        made: Mutex<Vec<BackupInfo>>,
        restored: Mutex<Vec<StreamerId>>,
        release: tokio::sync::Notify,
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl BackupStore for MemoryBackups {
        async fn create(&self, id: &str, now: i64) -> Result<BackupInfo, StoreError> {
            self.release.notified().await;
            let info = BackupInfo { id: id.to_owned(), created_at: now, bytes: 3, automatic: id.starts_with("auto-") };
            self.made.lock().expect("made").push(info.clone());
            Ok(info)
        }

        async fn list(&self) -> Result<Vec<BackupInfo>, StoreError> {
            Ok(self.made.lock().expect("made").clone())
        }

        fn file(&self, id: &str) -> Option<PathBuf> {
            self.made.lock().expect("made").iter().any(|info| info.id == id).then(|| PathBuf::from(id))
        }

        async fn delete(&self, id: &str) -> Result<bool, StoreError> {
            let mut made = self.made.lock().expect("made");
            let before = made.len();
            made.retain(|info| info.id != id);
            Ok(made.len() != before)
        }

        fn incoming(&self, id: &str) -> PathBuf {
            PathBuf::from(format!("{id}.partial"))
        }

        async fn accept(&self, id: &str) -> Result<BackupInfo, ArchiveError> {
            if id.ends_with("bad") {
                return Err(ArchiveError::Invalid("broken".to_owned()));
            }
            Ok(BackupInfo { id: id.to_owned(), created_at: 0, bytes: 1, automatic: false })
        }

        async fn inspect(&self, id: &str) -> Result<Vec<StreamerId>, ArchiveError> {
            if self.made.lock().expect("made").iter().any(|info| info.id == id) {
                Ok(vec![StreamerId::from_bytes([1; 16]), StreamerId::from_bytes([2; 16])])
            } else {
                Err(ArchiveError::NotFound)
            }
        }

        async fn restore(&self, _id: &str, keep: &[StreamerId]) -> Result<(), ArchiveError> {
            self.restored.lock().expect("restored").extend_from_slice(keep);
            Ok(())
        }
    }

    type TestBackups = Backups<MemoryBackups, MemoryAudit, MemoryKeys>;

    fn backups() -> (TestBackups, AuditLog<MemoryAudit, MemoryKeys>, MemoryKeys) {
        let keys = MemoryKeys::default();
        let audit = AuditLog::new(MemoryAudit::default(), keys.clone(), DataKey::from_bytes([9; 32]));
        (Backups::new(MemoryBackups::default(), audit.clone(), keys.clone()), audit, keys)
    }

    #[test]
    fn only_generated_ids_are_backup_ids() {
        assert!(is_backup_id("manual-1700000000000-0a1b2c3d"));
        assert!(is_backup_id("auto-1-ffffffff"));
        let invalid = [
            "",
            "manual-",
            "manual-1-0A1B2C3D",
            "manual-1-0a1b2c3",
            "x-1-0a1b2c3d",
            "manual-1-0a1b2c3d/..",
            "../manual-1-0a1b2c3d",
        ];
        for id in invalid {
            assert!(!is_backup_id(id), "{id}");
        }
    }

    #[tokio::test]
    async fn one_backup_at_a_time_in_the_background_and_every_step_is_audited() {
        let (backups, audit, _keys) = backups();
        let changes = backups.changes();
        let id = backups.start("rezondes", false, 5, [1, 2, 3, 4]).expect("start");
        assert_eq!(id, "manual-5-01020304");
        assert!(backups.running());
        assert_eq!(*changes.borrow(), 1, "the start counts");
        assert_eq!(backups.start("rezondes", false, 6, [5; 4]), Err(BackupError::Busy));
        assert_eq!(*changes.borrow(), 1, "a refused start does not");
        backups.store.release.notify_one();
        while backups.running() {
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
        assert_eq!(*changes.borrow(), 2, "the end counts");
        assert_eq!(backups.list().await.expect("list").len(), 1);
        assert_eq!(backups.download("rezondes", &id, 7).await.expect("download"), Some(PathBuf::from(&id)));
        assert_eq!(backups.download("rezondes", "../etc", 7).await.expect("download"), None);
        assert!(backups.delete("rezondes", &id, 8).await.expect("delete"));
        assert!(!backups.delete("rezondes", &id, 8).await.expect("delete again"));
        assert_eq!(*changes.borrow(), 3, "only the real delete counts");
        let actions: Vec<String> =
            audit.list(None, 10).await.expect("audit").into_iter().map(|entry| entry.action).collect();
        assert!(actions.contains(&"backup.create".to_owned()), "{actions:?}");
        assert!(actions.contains(&"backup.download".to_owned()) && actions.contains(&"backup.delete".to_owned()));
        // After the first one finished the next may start
        assert!(backups.start("rezondes", true, 9, [6; 4]).is_ok());
    }

    #[tokio::test]
    async fn restore_leaves_out_streamers_without_a_key_and_uploads_are_checked() {
        let (backups, audit, keys) = backups();
        let id = backups.start("rezondes", false, 5, [1; 4]).expect("start");
        backups.store.release.notify_one();
        while backups.running() {
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
        keys.create(&StreamerId::from_bytes([1; 16])).await.expect("key");
        let report = backups.restore("rezondes", &id, 6).await.expect("restore");
        let skipped = vec![StreamerId::from_bytes([2; 16]).as_str().to_owned()];
        assert_eq!(report, RestoreReport { restored: 1, skipped });
        assert_eq!(*backups.store.restored.lock().expect("restored"), [StreamerId::from_bytes([1; 16])]);
        assert_eq!(backups.restore("rezondes", "manual-9-09090909", 6).await, Err(BackupError::NotFound));
        assert_eq!(backups.restore("rezondes", "../x", 6).await, Err(BackupError::NotFound));
        let (upload, path) = backups.upload_target(7, [2; 4]);
        assert_eq!(path, PathBuf::from(format!("{upload}.partial")));
        assert!(backups.accept_upload("rezondes", &upload, 7).await.is_ok());
        assert!(matches!(backups.accept_upload("rezondes", "manual-8-bad", 8).await, Err(BackupError::Invalid(_))));
        let actions: Vec<String> =
            audit.list(None, 10).await.expect("audit").into_iter().map(|entry| entry.action).collect();
        assert!(actions.contains(&"backup.restore".to_owned()) && actions.contains(&"backup.upload".to_owned()));
    }

    async fn finish(backups: &TestBackups) {
        backups.store.release.notify_one();
        while backups.running() {
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
    }

    #[tokio::test]
    async fn the_schedule_starts_when_due_and_keeps_only_the_newest_automatic_ones() {
        let (backups, _audit, _keys) = backups();
        let off = BackupSchedule::default();
        assert_eq!(backups.run_schedule(&off, 0, [1; 4]).await.expect("off"), None);
        let on = BackupSchedule { enabled: true, interval_hours: 1, keep: 1 };
        for (hour, random) in [(0, 1_u8), (1, 2), (2, 3)] {
            let now = hour * 3_600_000;
            let started = backups.run_schedule(&on, now, [random; 4]).await.expect("run");
            assert!(started.is_some_and(|id| id.starts_with("auto-")), "hour {hour}");
            assert_eq!(backups.run_schedule(&on, now + 1, [9; 4]).await.expect("running"), None);
            finish(&backups).await;
        }
        backups.start("rezondes", false, 5, [7; 4]).expect("manual");
        finish(&backups).await;
        // Not due yet, but the surplus automatic backups are gone; the manual one stays
        assert_eq!(backups.run_schedule(&on, 2 * 3_600_000 + 10, [8; 4]).await.expect("prune"), None);
        let kinds: Vec<bool> = backups.list().await.expect("list").iter().map(|backup| backup.automatic).collect();
        assert_eq!(kinds.iter().filter(|automatic| **automatic).count(), 1);
        assert_eq!(kinds.iter().filter(|automatic| !**automatic).count(), 1);
    }
}
