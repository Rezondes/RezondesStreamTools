//! Chat commands of a streamer (template: `loadHelp`, `saveHelp` and `publicCommands` in `server/commands.ts`): the
//! help command setting and the public list of commands, with only the parts whose features are on.

use std::collections::BTreeMap;

use rst_domain::access::Feature;
use rst_domain::commands::{CommandList, HelpConfig, command_list, to_help_config};
use rst_domain::identity::values::{Login, StreamerId};
use rst_domain::settings::file::minime_rules_of;
use serde_json::{Value, json};

use crate::audit::{AuditEntry, AuditLog};
use crate::ports::audit::AuditStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::profile::{Profile, ProfileError};
use crate::vault::VaultError;

pub struct CommandService<'a, S, K, A> {
    pub profile: &'a Profile<S, K>,
    pub audit: &'a AuditLog<A, K>,
}

impl<S: RecordStore, K: KeyStore, A: AuditStore> CommandService<'_, S, K, A> {
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn help(&self, id: &StreamerId) -> Result<HelpConfig, VaultError> {
        self.profile.help(id).await
    }

    /// # Errors
    /// `Invalid` when the input is no valid help setting, otherwise when a store fails.
    pub async fn save_help(
        &self,
        id: &StreamerId,
        actor: &str,
        input: &Value,
        now: i64,
    ) -> Result<HelpConfig, ProfileError> {
        let help = to_help_config(input).ok_or_else(|| ProfileError::Invalid(vec!["invalid-json".to_owned()]))?;
        let saved = self.profile.save_help(id, &help, now).await?;
        let entry = AuditEntry {
            id: 0,
            created_at: 0,
            actor: actor.to_owned(),
            action: "help.save".to_owned(),
            before: None,
            after: Some(json!(saved)),
        };
        self.audit.append(Some(id), &entry, now).await?;
        Ok(saved)
    }

    /// All chat commands of the streamer; minimes only with the feature minimes, triggers only with triggers and fx
    ///
    /// # Errors
    /// As [`Self::help`].
    pub async fn public(
        &self,
        id: &StreamerId,
        login: &Login,
        features: &BTreeMap<Feature, bool>,
    ) -> Result<CommandList, VaultError> {
        public_commands(self.profile, id, login, features).await
    }
}

/// See [`CommandService::public`]; the runtime needs the list for the help reply without an audit log
///
/// # Errors
/// `Unreadable` after the streamer was shredded.
pub async fn public_commands<S: RecordStore, K: KeyStore>(
    profile: &Profile<S, K>,
    id: &StreamerId,
    login: &Login,
    features: &BTreeMap<Feature, bool>,
) -> Result<CommandList, VaultError> {
    let on = |feature: Feature| features.get(&feature) == Some(&true);
    let minimes =
        if on(Feature::Minimes) { profile.settings(id).await?.as_ref().and_then(minime_rules_of) } else { None };
    let triggers = if on(Feature::Triggers) && on(Feature::Fx) { profile.triggers(id).await? } else { Vec::new() };
    Ok(command_list(login.as_str(), Some(&profile.help(id).await?), minimes.as_ref(), &triggers))
}

#[cfg(test)]
mod tests {
    use rst_domain::commands::{CommandItem, default_help};

    use super::*;
    use crate::ports::keys::DataKey;
    use crate::testing::{MemoryAudit, MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    #[tokio::test]
    async fn help_setting_and_public_list_by_features() {
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        let profile = Profile::new(Vault::new(MemoryRecords::default(), keys.clone()));
        let audit = AuditLog::new(MemoryAudit::default(), keys, DataKey::from_bytes([9; 32]));
        let service = CommandService { profile: &profile, audit: &audit };
        assert_eq!(service.help(&neo()).await.expect("help"), default_help());
        assert!(matches!(service.save_help(&neo(), "neo", &json!("nope"), 1).await, Err(ProfileError::Invalid(_))));
        let saved = service
            .save_help(&neo(), "neo", &json!({ "enabled": true, "command": "!Hilfe", "reply": "x", "cooldown": 5 }), 2)
            .await
            .expect("save");
        assert_eq!(saved.command, "!hilfe");
        let login = Login::parse("neo").expect("login");
        profile.ensure_settings(&neo(), &login, 3).await.expect("settings");
        let lizard = json!({ "name": "lizard", "when": { "type": "command", "match": "!lizard" }, "do": [{ "type": "text", "text": "hi" }] });
        profile.save_triggers(&neo(), &[lizard], 4).await.expect("triggers");
        let all: BTreeMap<Feature, bool> = Feature::ALL.into_iter().map(|feature| (feature, true)).collect();
        let kinds =
            |list: &CommandList| list.items.iter().filter(|item| matches!(item, CommandItem::Trigger { .. })).count();
        let everything = service.public(&neo(), &login, &all).await.expect("list");
        assert_eq!(everything.channel, "neo");
        assert_eq!(kinds(&everything), 1);
        let mut no_fx = all.clone();
        no_fx.insert(Feature::Fx, false);
        assert_eq!(kinds(&service.public(&neo(), &login, &no_fx).await.expect("list")), 0);
        assert_eq!(audit.list(Some(&neo()), 10).await.expect("audit").len(), 1);
    }
}
