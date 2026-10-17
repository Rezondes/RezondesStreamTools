//! Chat triggers of a streamer from the editor (template: the trigger part of `server/triggers.ts`): the stored
//! rules, checking and saving a new list (all or nothing), and the names for the dashboard. Every save lands in the
//! audit log.

use rst_domain::identity::values::StreamerId;
use rst_domain::triggers::Trigger;
use serde::Serialize;
use serde_json::{Value, json};

use crate::audit::{AuditEntry, AuditLog};
use crate::ports::audit::AuditStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::profile::{Profile, ProfileError};
use crate::vault::VaultError;

/// A trigger in the dashboard list
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TriggerName {
    pub name: String,
    pub enabled: bool,
}

pub struct TriggerService<'a, S, K, A> {
    pub profile: &'a Profile<S, K>,
    pub audit: &'a AuditLog<A, K>,
}

impl<S: RecordStore, K: KeyStore, A: AuditStore> TriggerService<'_, S, K, A> {
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn rules(&self, id: &StreamerId) -> Result<Vec<Trigger>, VaultError> {
        self.profile.triggers(id).await
    }

    /// # Errors
    /// As [`Self::rules`].
    pub async fn names(&self, id: &StreamerId) -> Result<Vec<TriggerName>, VaultError> {
        Ok(self
            .rules(id)
            .await?
            .into_iter()
            .map(|trigger| TriggerName { enabled: trigger.enabled != Some(false), name: trigger.name })
            .collect())
    }

    /// Checks and stores the list from the editor; with any error nothing changes. Returns the stored rules.
    ///
    /// # Errors
    /// `Invalid` with one message per problem, otherwise when a store fails.
    pub async fn save(
        &self,
        id: &StreamerId,
        actor: &str,
        list: &[Value],
        now: i64,
    ) -> Result<Vec<Trigger>, ProfileError> {
        let saved = self.profile.save_triggers(id, list, now).await?;
        let names: Vec<&str> = saved.iter().map(|trigger| trigger.name.as_str()).collect();
        let entry = AuditEntry {
            id: 0,
            created_at: 0,
            actor: actor.to_owned(),
            action: "triggers.save".to_owned(),
            before: None,
            after: Some(json!({ "triggers": names })),
        };
        self.audit.append(Some(id), &entry, now).await?;
        Ok(saved)
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

    #[tokio::test]
    async fn invalid_lists_change_nothing_valid_ones_are_audited() {
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        let profile = Profile::new(Vault::new(MemoryRecords::default(), keys.clone()));
        let audit = AuditLog::new(MemoryAudit::default(), keys, DataKey::from_bytes([9; 32]));
        let service = TriggerService { profile: &profile, audit: &audit };
        let lizard = json!({ "name": "lizard", "when": { "type": "command", "match": "!lizard" }, "do": [{ "type": "text", "text": "hi" }] });
        let invalid = json!({ "name": "lizard", "when": { "type": "command", "match": "!lizard" }, "who": "moderator", "do": [] });
        assert!(matches!(service.save(&neo(), "neo", &[invalid], 1).await, Err(ProfileError::Invalid(_))));
        assert!(service.rules(&neo()).await.expect("rules").is_empty());
        service.save(&neo(), "neo", &[lizard], 2).await.expect("save");
        assert_eq!(
            service.names(&neo()).await.expect("names"),
            [TriggerName { name: "lizard".to_owned(), enabled: true }]
        );
        let entries = audit.list(Some(&neo()), 10).await.expect("audit");
        assert_eq!((entries.len(), entries[0].after.clone()), (1, Some(json!({ "triggers": ["lizard"] }))));
    }
}
