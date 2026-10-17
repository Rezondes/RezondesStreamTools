//! Twitch login of a streamer (template: `twitchCallback`, `logout` and `twitchDisconnect` in `server/index.ts`):
//! exchange the code, check access and the owning Twitch account, store the tokens, create first settings and the
//! overlay key, open a session. A refused login gets its token revoked right away. Every login, logout and
//! disconnect lands in the audit log.

use rst_domain::identity::session::SessionToken;
use rst_domain::identity::values::{Login, StreamerId};
use serde_json::json;

use crate::access::AccessSettings;
use crate::audit::{AuditEntry, AuditLog};
use crate::channel::overlay_key::OverlayKeys;
use crate::crypto::cipher::random_bytes;
use crate::identity::sessions::Sessions;
use crate::identity::streamers::{RegisterError, Streamers};
use crate::ports::StoreError;
use crate::ports::audit::AuditStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::server_settings::ServerSettingsStore;
use crate::ports::sessions::SessionStore;
use crate::ports::streamers::StreamerRepository;
use crate::ports::twitch::TwitchAuth;
use crate::profile::Profile;
use crate::vault::VaultError;

#[derive(Debug)]
pub enum LoginOutcome {
    /// Logged in: the token goes into the session cookie
    Session {
        streamer: StreamerId,
        token: SessionToken,
    },
    /// Code refused or Twitch unreachable
    Failed,
    NotAllowed,
    AccountChanged,
}

impl LoginOutcome {
    /// Code for `/?error=` in the dashboard
    #[must_use]
    pub const fn error(&self) -> Option<&'static str> {
        match self {
            Self::Session { .. } => None,
            Self::Failed => Some("login-failed"),
            Self::NotAllowed => Some("not-allowed"),
            Self::AccountChanged => Some("account-changed"),
        }
    }
}

fn entry(actor: &str, action: &str) -> AuditEntry {
    AuditEntry { id: 0, created_at: 0, actor: actor.to_owned(), action: action.to_owned(), before: None, after: None }
}

fn random<const N: usize>() -> Result<[u8; N], VaultError> {
    random_bytes().map_err(|error| VaultError::Store(StoreError::new(error)))
}

/// The use cases a login touches
pub struct LoginFlow<'a, R, S, K, Q, P, A> {
    pub streamers: &'a Streamers<R, S, K>,
    pub profile: &'a Profile<S, K>,
    pub sessions: &'a Sessions<Q>,
    pub overlay_keys: &'a OverlayKeys<S, K>,
    pub access: &'a AccessSettings<P>,
    pub audit: &'a AuditLog<A, K>,
    pub admins: &'a [Login],
}

impl<R, S, K, Q, P, A> LoginFlow<'_, R, S, K, Q, P, A>
where
    R: StreamerRepository,
    S: RecordStore,
    K: KeyStore,
    Q: SessionStore,
    P: ServerSettingsStore,
    A: AuditStore,
{
    async fn revoke(twitch: &impl TwitchAuth, access: &str) {
        if let Err(error) = twitch.revoke(access).await {
            eprintln!("Revoking a token failed: {error}");
        }
    }

    /// The callback with a valid state: from the code to a session
    ///
    /// # Errors
    /// When a store fails; a refused login is an outcome, not an error.
    pub async fn complete(&self, twitch: &impl TwitchAuth, code: &str, now: i64) -> Result<LoginOutcome, VaultError> {
        let tokens = match twitch.exchange(code).await {
            Ok(Some(tokens)) => tokens,
            Ok(None) => return Ok(LoginOutcome::Failed),
            Err(error) => {
                eprintln!("Twitch login failed: {error}");
                return Ok(LoginOutcome::Failed);
            }
        };
        let policy = self.access.load(self.admins).await?;
        if !policy.can_use(self.admins, &tokens.login) {
            Self::revoke(twitch, &tokens.access).await;
            self.audit.append(None, &entry(tokens.login.as_str(), "login.refused"), now).await?;
            return Ok(LoginOutcome::NotAllowed);
        }
        let streamer =
            match self.streamers.register(&tokens.user_id, &tokens.login, StreamerId::from_bytes(random()?), now).await
            {
                Ok(streamer) => streamer,
                Err(RegisterError::AccountChanged) => {
                    // Same name, another Twitch account (name reassigned after a rename): neither profile nor access
                    Self::revoke(twitch, &tokens.access).await;
                    self.audit.append(None, &entry(tokens.login.as_str(), "login.account-changed"), now).await?;
                    return Ok(LoginOutcome::AccountChanged);
                }
                Err(RegisterError::Vault(error)) => return Err(error),
            };
        let id = streamer.id.unwrap_or_else(|| unreachable!("a registered streamer has an ID"));
        self.profile.save_twitch_tokens(&id, &tokens, now).await?;
        self.profile.ensure_settings(&id, &tokens.login, now).await?;
        self.overlay_keys.get(&id, random()?, now).await?;
        let token = self.sessions.create(&id, random()?, now).await?;
        self.audit.append(Some(&id), &entry(tokens.login.as_str(), "login"), now).await?;
        Ok(LoginOutcome::Session { streamer: id, token })
    }

    /// Ends the session of the cookie; the overlays keep running
    ///
    /// # Errors
    /// When a store fails.
    pub async fn logout(&self, cookie: Option<&str>, now: i64) -> Result<(), VaultError> {
        if let Some(id) = self.sessions.resolve(cookie, now).await? {
            let login = self.streamers.login_of(&id).await.ok().flatten();
            self.audit
                .append(Some(&id), &entry(login.as_ref().map_or("unknown", Login::as_str), "logout"), now)
                .await?;
        }
        Ok(self.sessions.revoke(cookie).await?)
    }

    /// Revokes and deletes the Twitch tokens and ends every session of the streamer
    ///
    /// # Errors
    /// When a store fails.
    pub async fn disconnect(
        &self,
        twitch: &impl TwitchAuth,
        id: &StreamerId,
        actor: &str,
        now: i64,
    ) -> Result<(), VaultError> {
        if let Some(tokens) = self.profile.twitch_tokens(id).await? {
            Self::revoke(twitch, &tokens.access).await;
        }
        self.profile.delete_twitch_tokens(id).await?;
        self.sessions.revoke_all(id).await?;
        self.audit
            .append(
                Some(id),
                &AuditEntry { after: Some(json!({ "tokens": "deleted" })), ..entry(actor, "twitch.disconnect") },
                now,
            )
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use rst_domain::access::{AccessPolicy, Registration};
    use rst_domain::identity::values::TwitchUserId;
    use rst_domain::twitch::tokens::TwitchTokens;

    use super::*;
    use crate::crypto::lookup::LookupKey;
    use crate::ports::keys::DataKey;
    use crate::ports::twitch::ProviderError;
    use crate::testing::{
        MemoryAudit, MemoryKeys, MemoryRecords, MemoryServerSettings, MemorySessions, MemoryStreamers,
    };
    use crate::vault::Vault;

    /// Code `code-<login>-<id>` gives tokens for that user, anything else is refused
    #[derive(Default)]
    struct FakeTwitch {
        revoked: Mutex<Vec<String>>,
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl TwitchAuth for FakeTwitch {
        async fn exchange(&self, code: &str) -> Result<Option<TwitchTokens>, ProviderError> {
            let Some((login, id)) = code.strip_prefix("code-").and_then(|rest| rest.split_once('-')) else {
                return Ok(None);
            };
            Ok(Some(TwitchTokens {
                access: format!("access-{login}"),
                refresh: format!("refresh-{login}"),
                user_id: TwitchUserId::parse(id).map_err(ProviderError::new)?,
                login: Login::parse(login).map_err(ProviderError::new)?,
            }))
        }

        async fn revoke(&self, access: &str) -> Result<(), ProviderError> {
            self.revoked.lock().map_err(|_| ProviderError::new("lock"))?.push(access.to_owned());
            Ok(())
        }
    }

    impl FakeTwitch {
        fn revoked(&self) -> Vec<String> {
            self.revoked.lock().map(|revoked| revoked.clone()).unwrap_or_default()
        }
    }

    struct World {
        streamers: Streamers<MemoryStreamers, MemoryRecords, MemoryKeys>,
        profile: Profile<MemoryRecords, MemoryKeys>,
        sessions: Sessions<MemorySessions>,
        overlay_keys: OverlayKeys<MemoryRecords, MemoryKeys>,
        access: AccessSettings<MemoryServerSettings>,
        audit: AuditLog<MemoryAudit, MemoryKeys>,
        admins: Vec<Login>,
    }

    impl World {
        fn new() -> Self {
            let keys = MemoryKeys::default();
            let vault = Vault::new(MemoryRecords::default(), keys.clone());
            let lookup = LookupKey::from_bytes([4; 32]);
            Self {
                streamers: Streamers::new(MemoryStreamers::default(), vault.clone(), lookup.clone()),
                profile: Profile::new(vault.clone()),
                sessions: Sessions::new(MemorySessions::default()),
                overlay_keys: OverlayKeys::new(vault, lookup),
                access: AccessSettings::new(MemoryServerSettings::default(), DataKey::from_bytes([9; 32])),
                audit: AuditLog::new(MemoryAudit::default(), keys, DataKey::from_bytes([9; 32])),
                admins: vec![Login::parse("rezondes").expect("login")],
            }
        }

        fn flow(
            &self,
        ) -> LoginFlow<'_, MemoryStreamers, MemoryRecords, MemoryKeys, MemorySessions, MemoryServerSettings, MemoryAudit>
        {
            LoginFlow {
                streamers: &self.streamers,
                profile: &self.profile,
                sessions: &self.sessions,
                overlay_keys: &self.overlay_keys,
                access: &self.access,
                audit: &self.audit,
                admins: &self.admins,
            }
        }

        async fn open_registration(&self) {
            let policy = AccessPolicy { registration: Registration::Open, ..AccessPolicy::initial(&self.admins) };
            self.access.save(&policy, 0).await.expect("open");
        }

        async fn actions(&self, id: Option<&StreamerId>) -> Vec<String> {
            self.audit.list(id, 50).await.expect("audit").into_iter().map(|entry| entry.action).collect()
        }
    }

    #[tokio::test]
    async fn first_login_creates_streamer_settings_key_and_session() {
        let world = World::new();
        let twitch = FakeTwitch::default();
        let LoginOutcome::Session { streamer, token } =
            world.flow().complete(&twitch, "code-rezondes-1", 10).await.expect("login")
        else {
            panic!("expected a session")
        };
        assert_eq!(world.sessions.resolve(Some(&token.to_text()), 11).await.expect("resolve"), Some(streamer.clone()));
        assert!(world.profile.twitch_tokens(&streamer).await.expect("tokens").is_some());
        let settings = world.profile.settings(&streamer).await.expect("settings").expect("first settings");
        assert_eq!(settings.values["standard"]["channelName"], "REZONDES");
        let key = world.overlay_keys.get(&streamer, [0; 16], 12).await.expect("key");
        assert!(world.overlay_keys.matches(&streamer, &key).await.expect("match"));
        assert_eq!(world.actions(Some(&streamer)).await, ["login"]);
    }

    #[tokio::test]
    async fn refused_logins_revoke_the_token() {
        let world = World::new();
        let twitch = FakeTwitch::default();
        assert!(matches!(
            world.flow().complete(&twitch, "code-smith-9", 1).await.expect("login"),
            LoginOutcome::NotAllowed
        ));
        assert_eq!(twitch.revoked(), ["access-smith"]);
        assert!(matches!(world.flow().complete(&twitch, "garbage", 1).await.expect("login"), LoginOutcome::Failed));
        world.open_registration().await;
        world.flow().complete(&twitch, "code-neo-7", 2).await.expect("neo");
        let other = world.flow().complete(&twitch, "code-neo-8", 3).await.expect("other account");
        assert!(matches!(other, LoginOutcome::AccountChanged));
        assert_eq!(other.error(), Some("account-changed"));
        assert_eq!(twitch.revoked(), ["access-smith", "access-neo"]);
        assert_eq!(world.actions(None).await, ["login.account-changed", "login.refused"]);
    }

    #[tokio::test]
    async fn logout_and_disconnect_end_sessions() {
        let world = World::new();
        let twitch = FakeTwitch::default();
        let LoginOutcome::Session { streamer, token } =
            world.flow().complete(&twitch, "code-rezondes-1", 1).await.expect("login")
        else {
            panic!("expected a session")
        };
        let cookie = token.to_text();
        world.flow().logout(Some(&cookie), 2).await.expect("logout");
        assert_eq!(world.sessions.resolve(Some(&cookie), 3).await.expect("resolve"), None);
        let LoginOutcome::Session { token: second, .. } =
            world.flow().complete(&twitch, "code-rezondes-1", 4).await.expect("again")
        else {
            panic!("expected a session")
        };
        world.flow().disconnect(&twitch, &streamer, "rezondes", 5).await.expect("disconnect");
        assert_eq!(world.sessions.resolve(Some(&second.to_text()), 6).await.expect("resolve"), None);
        assert_eq!(world.profile.twitch_tokens(&streamer).await.expect("tokens"), None);
        assert_eq!(twitch.revoked(), ["access-rezondes"]);
        assert_eq!(world.actions(Some(&streamer)).await, ["twitch.disconnect", "login", "logout", "login"]);
    }
}
