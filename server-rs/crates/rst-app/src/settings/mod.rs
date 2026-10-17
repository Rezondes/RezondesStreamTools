//! Settings of a streamer (template: `settings` and `saveSettingsRequest` in `server/index.ts`): read the stored
//! settings, check and save the values of one theme, optionally choosing it for the overlays. Every save lands in
//! the audit log.

use rst_domain::identity::values::StreamerId;
use rst_domain::settings::file::{PublicSettings, SettingsFile, parse_settings_file, public_settings, update_settings};
use rst_domain::settings::validate::{SettingError, SettingErrorCode};
use serde_json::{Value, json};

use crate::audit::{AuditEntry, AuditLog};
use crate::ports::audit::AuditStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::profile::Profile;
use crate::vault::VaultError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SaveError {
    /// Errors per field, for the form
    Invalid(Vec<SettingError>),
    Vault(VaultError),
}

impl From<VaultError> for SaveError {
    fn from(error: VaultError) -> Self {
        Self::Vault(error)
    }
}

pub struct SettingsService<'a, S, K, A> {
    pub profile: &'a Profile<S, K>,
    pub audit: &'a AuditLog<A, K>,
}

impl<S: RecordStore, K: KeyStore, A: AuditStore> SettingsService<'_, S, K, A> {
    /// The stored settings; without any the default theme without values
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn current(&self, id: &StreamerId) -> Result<SettingsFile, VaultError> {
        Ok(self.profile.settings(id).await?.unwrap_or_else(|| parse_settings_file(&Value::Null)))
    }

    /// The overlays' view of the stored settings
    ///
    /// # Errors
    /// As [`Self::current`].
    pub async fn public(&self, id: &StreamerId) -> Result<PublicSettings, VaultError> {
        Ok(public_settings(&self.current(id).await?))
    }

    /// `input`: `{ theme, values, choose }`; `choose: false` only saves the values (e.g. from the render page)
    ///
    /// # Errors
    /// `Invalid` with the codes per field, otherwise when a store fails.
    pub async fn save(
        &self,
        id: &StreamerId,
        actor: &str,
        input: &Value,
        now: i64,
    ) -> Result<PublicSettings, SaveError> {
        let Some(theme) = input.get("theme").and_then(Value::as_str) else {
            return Err(SaveError::Invalid(vec![SettingError {
                key: "theme".to_owned(),
                code: SettingErrorCode::InvalidType,
            }]));
        };
        let values = input.get("values").cloned().unwrap_or_else(|| json!({}));
        let choose = input.get("choose") != Some(&Value::Bool(false));
        let next = update_settings(&self.current(id).await?, theme, &values, choose).map_err(SaveError::Invalid)?;
        self.profile.save_settings(id, &next, now).await?;
        let entry = AuditEntry {
            id: 0,
            created_at: 0,
            actor: actor.to_owned(),
            action: "settings.save".to_owned(),
            before: None,
            after: Some(json!({ "theme": theme, "chosen": next.theme, "values": next.values.get(theme) })),
        };
        self.audit.append(Some(id), &entry, now).await?;
        Ok(public_settings(&next))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ports::keys::DataKey;
    use crate::testing::{MemoryAudit, MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    async fn world() -> (Profile<MemoryRecords, MemoryKeys>, AuditLog<MemoryAudit, MemoryKeys>) {
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        (
            Profile::new(Vault::new(MemoryRecords::default(), keys.clone())),
            AuditLog::new(MemoryAudit::default(), keys, DataKey::from_bytes([9; 32])),
        )
    }

    #[tokio::test]
    async fn save_checks_chooses_and_audits() {
        let (profile, audit) = world().await;
        let service = SettingsService { profile: &profile, audit: &audit };
        assert_eq!(service.current(&neo()).await.expect("current").theme, "standard");
        let invalid =
            service.save(&neo(), "neo", &json!({ "theme": "matrix", "values": { "accent": "nope" } }), 1).await;
        assert_eq!(
            invalid,
            Err(SaveError::Invalid(vec![SettingError {
                key: "accent".to_owned(),
                code: SettingErrorCode::InvalidColor
            }]))
        );
        let missing = service.save(&neo(), "neo", &json!({ "values": {} }), 1).await;
        assert!(matches!(missing, Err(SaveError::Invalid(errors)) if errors[0].key == "theme"));
        let saved = service.save(&neo(), "neo", &json!({ "theme": "matrix", "values": {} }), 2).await.expect("save");
        assert_eq!(saved.theme, "matrix");
        assert_eq!(service.public(&neo()).await.expect("public").theme, "matrix");
        let kept = service
            .save(&neo(), "neo", &json!({ "theme": "standard", "values": {}, "choose": false }), 3)
            .await
            .expect("save");
        assert_eq!(kept.theme, "matrix");
        let actions: Vec<String> =
            audit.list(Some(&neo()), 10).await.expect("audit").into_iter().map(|entry| entry.action).collect();
        assert_eq!(actions, ["settings.save", "settings.save"]);
    }
}
