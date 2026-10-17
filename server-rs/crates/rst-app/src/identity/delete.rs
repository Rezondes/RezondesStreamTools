//! Deleting a streamer for good (new, admins only): every session ends, the Twitch token is revoked, then the data key
//! is shredded before the rows and files go. Without the key every older backup of the streamer stays unreadable, so a
//! restore leaves them out. The audit entry names only the streamer id, never the login. The caller stops the runtime
//! first.

use rst_domain::identity::values::StreamerId;
use serde_json::json;

use crate::audit::{AuditEntry, AuditLog};
use crate::identity::sessions::Sessions;
use crate::identity::streamers::Streamers;
use crate::media::MediaLibrary;
use crate::ports::audit::AuditStore;
use crate::ports::files::FileStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::sessions::SessionStore;
use crate::ports::streamers::StreamerRepository;
use crate::ports::twitch::TwitchAuth;
use crate::profile::Profile;
use crate::vault::VaultError;

pub struct StreamerDeletion<'a, R, S, K, P, F, A> {
    pub streamers: &'a Streamers<R, S, K>,
    pub sessions: &'a Sessions<P>,
    pub profile: &'a Profile<S, K>,
    pub media: &'a MediaLibrary<S, K, F>,
    pub audit: &'a AuditLog<A, K>,
}

impl<R, S, K, P, F, A> StreamerDeletion<'_, R, S, K, P, F, A>
where
    R: StreamerRepository,
    S: RecordStore,
    K: KeyStore,
    P: SessionStore,
    F: FileStore,
    A: AuditStore,
{
    /// # Errors
    /// When a store fails; the steps already done stay done, a repeat finishes the rest.
    pub async fn delete(
        &self,
        twitch: &impl TwitchAuth,
        id: &StreamerId,
        actor: &str,
        now: i64,
    ) -> Result<(), VaultError> {
        self.sessions.revoke_all(id).await?;
        // A shredded profile has no tokens to revoke any more
        if let Ok(Some(tokens)) = self.profile.twitch_tokens(id).await
            && let Err(error) = twitch.revoke(&tokens.access).await
        {
            eprintln!("Revoking the Twitch token of streamer {} failed: {error}", id.as_str());
        }
        self.streamers.remove(id).await?;
        self.media.delete_files(id)?;
        let entry = AuditEntry {
            id: 0,
            created_at: 0,
            actor: actor.to_owned(),
            action: "streamer.delete".to_owned(),
            before: None,
            after: Some(json!({ "streamer": id.as_str() })),
        };
        self.audit.append(None, &entry, now).await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use rst_domain::identity::values::{Login, TwitchUserId};
    use rst_domain::twitch::tokens::TwitchTokens;

    use super::*;
    use crate::crypto::lookup::LookupKey;
    use crate::media::Shelf;
    use crate::ports::keys::DataKey;
    use crate::ports::twitch::ProviderError;
    use crate::testing::{MemoryAudit, MemoryFiles, MemoryKeys, MemoryRecords, MemorySessions, MemoryStreamers};
    use crate::vault::Vault;

    #[derive(Default)]
    struct FakeTwitch {
        revoked: Mutex<Vec<String>>,
    }

    #[allow(clippy::unused_async_trait_impl, reason = "the fake answers right away")]
    impl TwitchAuth for FakeTwitch {
        async fn exchange(&self, _code: &str) -> Result<Option<TwitchTokens>, ProviderError> {
            Ok(None)
        }

        async fn validate(&self, tokens: &TwitchTokens) -> Result<Option<TwitchTokens>, ProviderError> {
            Ok(Some(tokens.clone()))
        }

        async fn revoke(&self, access: &str) -> Result<(), ProviderError> {
            self.revoked.lock().expect("revoked").push(access.to_owned());
            Ok(())
        }
    }

    #[tokio::test]
    async fn the_streamer_is_gone_with_sessions_key_rows_and_files() {
        let keys = MemoryKeys::default();
        let vault = Vault::new(MemoryRecords::default(), keys.clone());
        let streamers = Streamers::new(MemoryStreamers::default(), vault.clone(), LookupKey::from_bytes([4; 32]));
        let sessions = Sessions::new(MemorySessions::default());
        let profile = Profile::new(vault.clone());
        let files = MemoryFiles::default();
        let media = MediaLibrary::new(vault.clone(), files.clone());
        let audit = AuditLog::new(MemoryAudit::default(), keys.clone(), DataKey::from_bytes([9; 32]));
        let neo = Login::parse("neo").expect("login");
        let user = TwitchUserId::parse("7").expect("user");
        let id = StreamerId::from_bytes([1; 16]);
        streamers.register(&user, &neo, id.clone(), 1).await.expect("register");
        let access = "access".to_owned();
        let tokens = TwitchTokens { access, refresh: "refresh".to_owned(), user_id: user, login: neo.clone() };
        profile.save_twitch_tokens(&id, &tokens, 1).await.expect("tokens");
        let session = sessions.create(&id, [5; 32], 1).await.expect("session");
        media.store(&id, Shelf::Media, "a.gif", b"GIF", [6; 16], 1).await.expect("file");
        let twitch = FakeTwitch::default();

        let deletion = StreamerDeletion {
            streamers: &streamers,
            sessions: &sessions,
            profile: &profile,
            media: &media,
            audit: &audit,
        };
        deletion.delete(&twitch, &id, "rezondes", 2).await.expect("delete");

        assert_eq!(streamers.find_by_login(&neo).await.expect("find"), None);
        assert_eq!(sessions.resolve(Some(&session.to_text()), 2).await.expect("resolve"), None);
        assert!(keys.get(&id).await.expect("key").is_none());
        assert_eq!(*twitch.revoked.lock().expect("revoked"), ["access"]);
        assert_eq!(files.names(), 0);
        assert!(vault.records().export_all().await.expect("records").is_empty());
        let entries = audit.list(None, 10).await.expect("audit");
        assert_eq!(entries[0].action, "streamer.delete");
        assert!(!entries[0].after.as_ref().expect("after").to_string().contains("neo"));
        // A second delete finds nothing left and still succeeds
        deletion.delete(&twitch, &id, "rezondes", 3).await.expect("again");
    }
}
