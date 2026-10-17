//! Automatic backups: off by default; admins switch them on with an interval in hours and how many automatic backups
//! stay. Manual backups are never cleaned up. The setting is stored encrypted with the server key.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::crypto::cipher::{open, seal};
use crate::ports::StoreError;
use crate::ports::backups::BackupInfo;
use crate::ports::keys::DataKey;
use crate::ports::server_settings::ServerSettingsStore;
use crate::vault::VaultError;

const KEY: &str = "backup-schedule";
/// Longest interval: 30 days
pub const MAX_INTERVAL_HOURS: u32 = 720;
/// Most automatic backups that are kept
pub const MAX_KEEP: u32 = 100;
const HOUR_MS: i64 = 3_600_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct BackupSchedule {
    pub enabled: bool,
    #[serde(rename = "intervalHours")]
    pub interval_hours: u32,
    pub keep: u32,
}

impl Default for BackupSchedule {
    fn default() -> Self {
        Self { enabled: false, interval_hours: 24, keep: 7 }
    }
}

impl BackupSchedule {
    /// The input of the form; `None` for anything outside the limits
    #[must_use]
    pub fn parse(input: &Value) -> Option<Self> {
        let number = |key: &str| input.get(key).and_then(Value::as_u64).and_then(|value| u32::try_from(value).ok());
        let schedule = Self {
            enabled: input.get("enabled")?.as_bool()?,
            interval_hours: number("intervalHours").filter(|hours| (1..=MAX_INTERVAL_HOURS).contains(hours))?,
            keep: number("keep").filter(|keep| (1..=MAX_KEEP).contains(keep))?,
        };
        Some(schedule)
    }

    /// Whether an automatic backup is due; `newest`: when the last automatic one was made
    #[must_use]
    pub fn due(&self, newest: Option<i64>, now: i64) -> bool {
        self.enabled && newest.is_none_or(|newest| now - newest >= i64::from(self.interval_hours) * HOUR_MS)
    }

    /// Automatic backups beyond the newest `keep`; `backups` sorted newest first
    #[must_use]
    pub fn surplus(&self, backups: &[BackupInfo]) -> Vec<String> {
        let keep = usize::try_from(self.keep).unwrap_or(usize::MAX);
        backups.iter().filter(|backup| backup.automatic).skip(keep).map(|backup| backup.id.clone()).collect()
    }
}

#[derive(Debug, Clone)]
pub struct ScheduleSettings<P> {
    store: P,
    server_key: DataKey,
}

impl<P: ServerSettingsStore> ScheduleSettings<P> {
    pub const fn new(store: P, server_key: DataKey) -> Self {
        Self { store, server_key }
    }

    /// The saved schedule, otherwise the default (off)
    ///
    /// # Errors
    /// `Unreadable` for a setting that does not decrypt (wrong master key).
    pub async fn load(&self) -> Result<BackupSchedule, VaultError> {
        let Some(sealed) = self.store.get(KEY).await? else { return Ok(BackupSchedule::default()) };
        let plaintext = open(self.server_key.bytes(), &sealed, KEY.as_bytes()).map_err(|_| VaultError::Unreadable)?;
        serde_json::from_slice(&plaintext).map_err(|_| VaultError::Unreadable)
    }

    /// # Errors
    /// When storing fails.
    pub async fn save(&self, schedule: &BackupSchedule, now: i64) -> Result<(), VaultError> {
        let json = serde_json::to_vec(schedule).map_err(|error| VaultError::Store(StoreError::new(error)))?;
        let sealed = seal(self.server_key.bytes(), &json, KEY.as_bytes())
            .map_err(|error| VaultError::Store(StoreError::new(error)))?;
        Ok(self.store.put(KEY, &sealed, now).await?)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::testing::MemoryServerSettings;

    fn backup(id: &str, automatic: bool) -> BackupInfo {
        BackupInfo { id: id.to_owned(), created_at: 0, bytes: 1, automatic }
    }

    #[test]
    fn off_never_due_on_after_the_interval() {
        let off = BackupSchedule::default();
        assert!(!off.due(None, 0));
        let on = BackupSchedule { enabled: true, interval_hours: 2, keep: 3 };
        assert!(on.due(None, 0));
        assert!(!on.due(Some(0), 2 * HOUR_MS - 1));
        assert!(on.due(Some(0), 2 * HOUR_MS));
    }

    #[test]
    fn only_old_automatic_backups_are_surplus() {
        let schedule = BackupSchedule { enabled: true, interval_hours: 1, keep: 2 };
        let list =
            [backup("a3", true), backup("m2", false), backup("a2", true), backup("a1", true), backup("m1", false)];
        assert_eq!(schedule.surplus(&list), ["a1"]);
    }

    #[test]
    fn form_input_within_the_limits() {
        let valid = json!({ "enabled": true, "intervalHours": 12, "keep": 5 });
        assert_eq!(BackupSchedule::parse(&valid), Some(BackupSchedule { enabled: true, interval_hours: 12, keep: 5 }));
        for invalid in [
            json!({ "enabled": true, "intervalHours": 0, "keep": 5 }),
            json!({ "enabled": true, "intervalHours": 721, "keep": 5 }),
            json!({ "enabled": true, "intervalHours": 1, "keep": 101 }),
            json!({ "enabled": "yes", "intervalHours": 1, "keep": 1 }),
            json!(null),
        ] {
            assert_eq!(BackupSchedule::parse(&invalid), None, "{invalid}");
        }
    }

    #[tokio::test]
    async fn stored_encrypted_and_off_by_default() {
        let store = MemoryServerSettings::default();
        let settings = ScheduleSettings::new(store.clone(), DataKey::from_bytes([4; 32]));
        assert_eq!(settings.load().await.expect("load"), BackupSchedule::default());
        let schedule = BackupSchedule { enabled: true, interval_hours: 6, keep: 4 };
        settings.save(&schedule, 1).await.expect("save");
        assert_eq!(settings.load().await.expect("load"), schedule);
        let other = ScheduleSettings::new(store, DataKey::from_bytes([5; 32]));
        assert_eq!(other.load().await, Err(VaultError::Unreadable));
    }
}
