//! Key backups: once a day a copy of the key store (the data keys stay wrapped by the master key) goes to its own
//! folder, apart from the data backups. Copies older than 30 days are deleted, a server limit that is not adjustable:
//! a deleted data key is gone from every key backup after 30 days, and with it every data backup of that streamer
//! is unreadable for good.

use std::future::Future;

use crate::ports::StoreError;

/// How long a key backup is kept (server limit)
pub const RETENTION_MS: i64 = 30 * 24 * 3_600_000;
/// One key backup per day
pub const EVERY_MS: i64 = 24 * 3_600_000;

/// The folder of the key backups; each copy is known by the time it was made
pub trait KeyBackupStore: Send + Sync {
    fn create(&self, now: i64) -> impl Future<Output = Result<(), StoreError>> + Send;

    fn list(&self) -> impl Future<Output = Result<Vec<i64>, StoreError>> + Send;

    fn delete(&self, made_at: i64) -> impl Future<Output = Result<(), StoreError>> + Send;
}

/// Makes the daily copy when due and deletes those past the retention
///
/// # Errors
/// When the folder or the key store cannot be read or written.
pub async fn run_key_backups<S: KeyBackupStore>(store: &S, now: i64) -> Result<(), StoreError> {
    let made = store.list().await?;
    if made.iter().max().is_none_or(|newest| now - newest >= EVERY_MS) {
        store.create(now).await?;
    }
    for made_at in made.into_iter().filter(|made_at| now - made_at > RETENTION_MS) {
        store.delete(made_at).await?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use super::*;

    #[derive(Default)]
    struct MemoryKeyBackups(Mutex<Vec<i64>>);

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl KeyBackupStore for MemoryKeyBackups {
        async fn create(&self, now: i64) -> Result<(), StoreError> {
            self.0.lock().expect("made").push(now);
            Ok(())
        }

        async fn list(&self) -> Result<Vec<i64>, StoreError> {
            Ok(self.0.lock().expect("made").clone())
        }

        async fn delete(&self, made_at: i64) -> Result<(), StoreError> {
            self.0.lock().expect("made").retain(|at| *at != made_at);
            Ok(())
        }
    }

    #[tokio::test]
    async fn one_copy_a_day_and_none_older_than_thirty_days() {
        let store = MemoryKeyBackups::default();
        run_key_backups(&store, 0).await.expect("first");
        run_key_backups(&store, EVERY_MS - 1).await.expect("same day");
        assert_eq!(store.list().await.expect("list"), [0]);
        for day in 1..=40 {
            run_key_backups(&store, day * EVERY_MS).await.expect("day");
        }
        let made = store.list().await.expect("list");
        assert_eq!(made.len(), 31);
        assert!(made.iter().all(|at| 40 * EVERY_MS - at <= RETENTION_MS));
    }
}
