//! What admins do (template: `saveAccess` and `adminStreamers` in `server/index.ts`): change access and feature
//! levels, see all streamers and read the audit log. Whoever loses access loses every session at once; the change
//! lands in the audit log with the policy before and after.

use rst_domain::access::{AccessPolicy, RawAccess, is_admin};
use rst_domain::identity::values::{Login, StreamerId};
use serde::Serialize;
use serde_json::Value;

use crate::access::AccessSettings;
use crate::audit::{AuditEntry, AuditLog};
use crate::identity::sessions::Sessions;
use crate::identity::streamers::Streamers;
use crate::ports::StoreError;
use crate::ports::audit::AuditStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::server_settings::ServerSettingsStore;
use crate::ports::sessions::SessionStore;
use crate::ports::streamers::StreamerRepository;
use crate::profile::Profile;
use crate::vault::VaultError;

/// One line of the admin overview
#[allow(clippy::struct_excessive_bools, reason = "the JSON answer of /api/admin/streamers")]
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct StreamerRow {
    pub login: String,
    pub allowed: bool,
    pub admin: bool,
    /// Has Twitch tokens
    pub connected: bool,
    pub live: bool,
    #[serde(rename = "lastLogin")]
    pub last_login: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AuditRow {
    pub id: i64,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    pub actor: String,
    pub action: String,
    pub before: Option<Value>,
    pub after: Option<Value>,
}

fn json_of(policy: &AccessPolicy) -> Result<Value, VaultError> {
    serde_json::to_value(policy).map_err(|error| VaultError::Store(StoreError::new(error)))
}

pub struct AccessAdmin<'a, R, S, K, Q, P, A> {
    pub access: &'a AccessSettings<P>,
    pub audit: &'a AuditLog<A, K>,
    pub sessions: &'a Sessions<Q>,
    pub streamers: &'a Streamers<R, S, K>,
    pub profile: &'a Profile<S, K>,
    pub admins: &'a [Login],
}

impl<R, S, K, Q, P, A> AccessAdmin<'_, R, S, K, Q, P, A>
where
    R: StreamerRepository,
    S: RecordStore,
    K: KeyStore,
    Q: SessionStore,
    P: ServerSettingsStore,
    A: AuditStore,
{
    /// Saves the sanitized policy; returns it and the logins that lost access
    ///
    /// # Errors
    /// When a store fails.
    pub async fn change(
        &self,
        raw: &RawAccess,
        actor: &str,
        now: i64,
    ) -> Result<(AccessPolicy, Vec<Login>), VaultError> {
        let (before, after) = self.access.replace(self.admins, raw, now).await?;
        let mut revoked = Vec::new();
        for streamer in self.streamers.list().await? {
            if before.can_use(self.admins, &streamer.login) && !after.can_use(self.admins, &streamer.login) {
                if let Some(id) = &streamer.id {
                    self.sessions.revoke_all(id).await?;
                }
                revoked.push(streamer.login);
            }
        }
        let entry = AuditEntry {
            id: 0,
            created_at: 0,
            actor: actor.to_owned(),
            action: "access.change".to_owned(),
            before: Some(json_of(&before)?),
            after: Some(json_of(&after)?),
        };
        self.audit.append(None, &entry, now).await?;
        Ok((after, revoked))
    }

    /// Every streamer with access, connection and last login
    ///
    /// # Errors
    /// When a store fails.
    pub async fn streamers(&self) -> Result<Vec<StreamerRow>, VaultError> {
        let policy = self.access.load(self.admins).await?;
        let mut rows = Vec::new();
        for streamer in self.streamers.list().await? {
            let Some(id) = &streamer.id else { continue };
            rows.push(StreamerRow {
                allowed: policy.can_use(self.admins, &streamer.login),
                admin: is_admin(self.admins, &streamer.login),
                connected: self.profile.twitch_tokens(id).await?.is_some(),
                live: false,
                last_login: Some(streamer.last_login),
                login: streamer.login.to_string(),
            });
        }
        Ok(rows)
    }

    /// The newest entries of a streamer or the server-wide ones
    ///
    /// # Errors
    /// `Unreadable` for a shredded streamer.
    pub async fn audit(&self, streamer: Option<&StreamerId>, limit: u32) -> Result<Vec<AuditRow>, VaultError> {
        Ok(self
            .audit
            .list(streamer, limit)
            .await?
            .into_iter()
            .map(|entry| AuditRow {
                id: entry.id,
                created_at: entry.created_at,
                actor: entry.actor,
                action: entry.action,
                before: entry.before,
                after: entry.after,
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::access::{Feature, FeatureLevel, Registration};
    use rst_domain::identity::values::TwitchUserId;

    use super::*;
    use crate::crypto::lookup::LookupKey;
    use crate::ports::keys::DataKey;
    use crate::testing::{
        MemoryAudit, MemoryKeys, MemoryRecords, MemoryServerSettings, MemorySessions, MemoryStreamers,
    };
    use crate::vault::Vault;

    struct World {
        access: AccessSettings<MemoryServerSettings>,
        audit: AuditLog<MemoryAudit, MemoryKeys>,
        sessions: Sessions<MemorySessions>,
        streamers: Streamers<MemoryStreamers, MemoryRecords, MemoryKeys>,
        profile: Profile<MemoryRecords, MemoryKeys>,
        admins: Vec<Login>,
    }

    fn login(value: &str) -> Login {
        Login::parse(value).expect("login")
    }

    impl World {
        fn new() -> Self {
            let keys = MemoryKeys::default();
            let vault = Vault::new(MemoryRecords::default(), keys.clone());
            Self {
                access: AccessSettings::new(MemoryServerSettings::default(), DataKey::from_bytes([9; 32])),
                audit: AuditLog::new(MemoryAudit::default(), keys, DataKey::from_bytes([9; 32])),
                sessions: Sessions::new(MemorySessions::default()),
                streamers: Streamers::new(MemoryStreamers::default(), vault.clone(), LookupKey::from_bytes([4; 32])),
                profile: Profile::new(vault),
                admins: vec![login("rezondes")],
            }
        }

        fn admin(
            &self,
        ) -> AccessAdmin<
            '_,
            MemoryStreamers,
            MemoryRecords,
            MemoryKeys,
            MemorySessions,
            MemoryServerSettings,
            MemoryAudit,
        > {
            AccessAdmin {
                access: &self.access,
                audit: &self.audit,
                sessions: &self.sessions,
                streamers: &self.streamers,
                profile: &self.profile,
                admins: &self.admins,
            }
        }
    }

    fn raw(allowlist: &[&str]) -> RawAccess {
        RawAccess { allowlist: allowlist.iter().map(|login| (*login).to_owned()).collect(), ..RawAccess::default() }
    }

    #[tokio::test]
    async fn revoked_access_ends_every_session_and_is_audited() {
        let world = World::new();
        let neo = StreamerId::from_bytes([1; 16]);
        world
            .streamers
            .register(&TwitchUserId::parse("7").expect("id"), &login("neo"), neo.clone(), 5)
            .await
            .expect("register");
        let (policy, revoked) = world.admin().change(&raw(&["neo"]), "rezondes", 1).await.expect("allow");
        assert_eq!(policy.allowlist, [login("neo")]);
        assert!(revoked.is_empty());
        let cookie = world.sessions.create(&neo, [5; 32], 2).await.expect("session").to_text();
        let mut levels = raw(&[]);
        levels.features.insert("minimes".to_owned(), "beta".to_owned());
        let (policy, revoked) = world.admin().change(&levels, "rezondes", 3).await.expect("revoke");
        assert_eq!(revoked, [login("neo")]);
        assert_eq!(policy.features[&Feature::Minimes], FeatureLevel::Beta);
        assert_eq!(world.sessions.resolve(Some(&cookie), 4).await.expect("resolve"), None);
        let audit = world.admin().audit(None, 10).await.expect("audit");
        assert_eq!(audit.len(), 2);
        assert_eq!(
            audit[0].before.as_ref().map(|before| before["allowlist"].clone()),
            Some(serde_json::json!(["neo"]))
        );
        assert_eq!(
            audit[0].after.as_ref().map(|after| after["features"]["minimes"].clone()),
            Some(serde_json::json!("beta"))
        );
    }

    #[tokio::test]
    async fn saving_at_once_never_mixes_two_changes() {
        let world = World::new();
        let open = RawAccess { registration: Some("open".to_owned()), ..raw(&["neo"]) };
        let closed = raw(&["trinity"]);
        let admin = world.admin();
        let (first, second) = tokio::join!(admin.change(&open, "a", 1), admin.change(&closed, "b", 1));
        let (first, second) = (first.expect("first").0, second.expect("second").0);
        let saved = world.access.load(&world.admins).await.expect("load");
        assert!(saved == first || saved == second);
        assert!(saved.registration == Registration::Open || saved.allowlist == [login("trinity")]);
    }

    #[tokio::test]
    async fn streamer_rows() {
        let world = World::new();
        let neo = StreamerId::from_bytes([1; 16]);
        world
            .streamers
            .register(&TwitchUserId::parse("7").expect("id"), &login("neo"), neo, 5)
            .await
            .expect("register");
        world
            .streamers
            .register(&TwitchUserId::parse("1").expect("id"), &login("rezondes"), StreamerId::from_bytes([2; 16]), 6)
            .await
            .expect("admin");
        let rows = world.admin().streamers().await.expect("rows");
        let neo_row = StreamerRow {
            login: "neo".to_owned(),
            allowed: false,
            admin: false,
            connected: false,
            live: false,
            last_login: Some(5),
        };
        assert_eq!(rows[0], neo_row);
        assert!(rows[1].admin && rows[1].allowed);
    }
}
