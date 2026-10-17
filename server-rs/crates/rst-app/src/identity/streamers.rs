//! Streamers (template: `server/profile.ts` with `ownedByOther`): a profile belongs to the Twitch account that
//! created it, not to the name. Twitch reassigns names of renamed accounts, so another account with the same login
//! inherits neither profile nor access (`account-changed`). Twitch user ID and login are only stored as lookup
//! digests; the login itself is in the encrypted profile record.

use std::fmt;

use rst_domain::identity::values::{Login, StreamerId, TwitchUserId};
use serde::{Deserialize, Serialize};

use crate::crypto::lookup::LookupKey;
use crate::ports::StoreError;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::streamers::{StreamerRepository, StreamerRow};
use crate::vault::{Vault, VaultError};

pub const PROFILE_KIND: &str = "profile";

/// The encrypted profile record
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Streamer {
    #[serde(skip)]
    pub id: Option<StreamerId>,
    pub login: Login,
    #[serde(rename = "userId")]
    pub user_id: TwitchUserId,
    /// Milliseconds since the epoch, for the admin overview
    #[serde(rename = "lastLogin")]
    pub last_login: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RegisterError {
    /// The login belongs to another Twitch account
    AccountChanged,
    Vault(VaultError),
}

impl RegisterError {
    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::AccountChanged => "account-changed",
            Self::Vault(error) => error.code(),
        }
    }
}

impl fmt::Display for RegisterError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.code())
    }
}

impl std::error::Error for RegisterError {}

impl From<StoreError> for RegisterError {
    fn from(error: StoreError) -> Self {
        Self::Vault(VaultError::Store(error))
    }
}

impl From<VaultError> for RegisterError {
    fn from(error: VaultError) -> Self {
        Self::Vault(error)
    }
}

#[derive(Debug, Clone)]
pub struct Streamers<R, S, K> {
    repository: R,
    vault: Vault<S, K>,
    lookup: LookupKey,
}

impl<R: StreamerRepository, S: RecordStore, K: KeyStore> Streamers<R, S, K> {
    pub const fn new(repository: R, vault: Vault<S, K>, lookup: LookupKey) -> Self {
        Self { repository, vault, lookup }
    }

    fn user_digest(&self, user_id: &TwitchUserId) -> [u8; 32] {
        self.lookup.digest("user", user_id.as_str())
    }

    fn login_digest(&self, login: &Login) -> [u8; 32] {
        self.lookup.digest("login", login.as_str())
    }

    /// Registers a login: a known Twitch account keeps its profile (a rename updates the login), a new one gets
    /// `new_id` and its own data key. `new_id` is drawn by the caller.
    ///
    /// # Errors
    /// `AccountChanged` when the login belongs to another Twitch account.
    pub async fn register(
        &self,
        user_id: &TwitchUserId,
        login: &Login,
        new_id: StreamerId,
        now: i64,
    ) -> Result<Streamer, RegisterError> {
        let login_digest = self.login_digest(login);
        let owner = self.repository.find_by_login(&login_digest).await?;
        let id = match self.repository.find_by_user_id(&self.user_digest(user_id)).await? {
            Some(known) => {
                if owner.is_some_and(|owner| owner.id != known.id) {
                    return Err(RegisterError::AccountChanged);
                }
                if known.login_digest != login_digest {
                    self.repository.set_login(&known.id, &login_digest).await?;
                }
                known.id
            }
            None if owner.is_some() => return Err(RegisterError::AccountChanged),
            None => {
                self.vault.keys().create(&new_id).await?;
                let row = StreamerRow { id: new_id.clone(), user_id_digest: self.user_digest(user_id), login_digest };
                self.repository.insert(&row, now).await?;
                new_id
            }
        };
        let streamer =
            Streamer { id: Some(id.clone()), login: login.clone(), user_id: user_id.clone(), last_login: now };
        self.vault.put_json(&id, PROFILE_KIND, "", &streamer, now).await?;
        Ok(streamer)
    }

    /// # Errors
    /// When the database fails.
    pub async fn find_by_login(&self, login: &Login) -> Result<Option<StreamerId>, StoreError> {
        Ok(self.repository.find_by_login(&self.login_digest(login)).await?.map(|row| row.id))
    }

    /// # Errors
    /// When the database fails.
    pub async fn find_by_user_id(&self, user_id: &TwitchUserId) -> Result<Option<StreamerId>, StoreError> {
        Ok(self.repository.find_by_user_id(&self.user_digest(user_id)).await?.map(|row| row.id))
    }

    /// The decrypted profile; `None` without one
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn profile(&self, id: &StreamerId) -> Result<Option<Streamer>, VaultError> {
        let found: Option<Streamer> = self.vault.get_json(id, PROFILE_KIND, "").await?;
        Ok(found.map(|streamer| Streamer { id: Some(id.clone()), ..streamer }))
    }

    /// # Errors
    /// As [`Self::profile`].
    pub async fn login_of(&self, id: &StreamerId) -> Result<Option<Login>, VaultError> {
        Ok(self.profile(id).await?.map(|streamer| streamer.login))
    }

    /// Every readable streamer; shredded ones are left out
    ///
    /// # Errors
    /// When the database fails.
    pub async fn list(&self) -> Result<Vec<Streamer>, StoreError> {
        let mut streamers = Vec::new();
        for id in self.repository.ids().await? {
            match self.profile(&id).await {
                Ok(Some(streamer)) => streamers.push(streamer),
                Ok(None) | Err(VaultError::Unreadable) => {}
                Err(VaultError::Store(error)) => return Err(error),
            }
        }
        Ok(streamers)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords, MemoryStreamers};

    type MemoryStreamersCase = Streamers<MemoryStreamers, MemoryRecords, MemoryKeys>;

    fn streamers() -> MemoryStreamersCase {
        let vault = Vault::new(MemoryRecords::default(), MemoryKeys::default());
        Streamers::new(MemoryStreamers::default(), vault, LookupKey::from_bytes([7; 32]))
    }

    fn login(value: &str) -> Login {
        Login::parse(value).expect("login")
    }

    fn user(value: &str) -> TwitchUserId {
        TwitchUserId::parse(value).expect("user id")
    }

    fn id(byte: u8) -> StreamerId {
        StreamerId::from_bytes([byte; 16])
    }

    #[tokio::test]
    async fn register_and_find() {
        let streamers = streamers();
        let neo = streamers.register(&user("123"), &login("neo"), id(1), 10).await.expect("register");
        assert_eq!(neo.id, Some(id(1)));
        assert_eq!(streamers.find_by_login(&login("neo")).await.expect("find"), Some(id(1)));
        assert_eq!(streamers.find_by_user_id(&user("123")).await.expect("find"), Some(id(1)));
        assert_eq!(streamers.login_of(&id(1)).await.expect("login"), Some(login("neo")));
        // A second login keeps the ID and updates the time
        let again = streamers.register(&user("123"), &login("neo"), id(9), 20).await.expect("again");
        assert_eq!((again.id, again.last_login), (Some(id(1)), 20));
        assert_eq!(streamers.find_by_login(&login("trinity")).await.expect("find"), None);
    }

    #[tokio::test]
    async fn the_same_login_with_another_twitch_account_is_rejected() {
        let streamers = streamers();
        streamers.register(&user("123"), &login("neo"), id(1), 10).await.expect("register");
        assert_eq!(
            streamers.register(&user("999"), &login("neo"), id(2), 11).await,
            Err(RegisterError::AccountChanged)
        );
        assert_eq!(RegisterError::AccountChanged.code(), "account-changed");
        assert_eq!(streamers.list().await.expect("list").len(), 1);
    }

    #[tokio::test]
    async fn a_rename_keeps_the_profile() {
        let streamers = streamers();
        streamers.register(&user("123"), &login("neo"), id(1), 10).await.expect("register");
        streamers.register(&user("456"), &login("trinity"), id(2), 10).await.expect("register");
        let renamed = streamers.register(&user("123"), &login("the_one"), id(3), 11).await.expect("rename");
        assert_eq!(renamed.id, Some(id(1)));
        assert_eq!(streamers.find_by_login(&login("the_one")).await.expect("find"), Some(id(1)));
        assert_eq!(streamers.find_by_login(&login("neo")).await.expect("find"), None);
        // Renaming onto a login another account holds is rejected
        assert_eq!(
            streamers.register(&user("123"), &login("trinity"), id(4), 12).await,
            Err(RegisterError::AccountChanged)
        );
    }

    #[tokio::test]
    async fn list_leaves_out_shredded_streamers() {
        let streamers = streamers();
        streamers.register(&user("123"), &login("neo"), id(1), 10).await.expect("register");
        streamers.register(&user("456"), &login("trinity"), id(2), 10).await.expect("register");
        streamers.vault.keys().shred(&id(1)).await.expect("shred");
        let listed: Vec<Login> =
            streamers.list().await.expect("list").into_iter().map(|streamer| streamer.login).collect();
        assert_eq!(listed, [login("trinity")]);
        assert_eq!(streamers.login_of(&id(1)).await, Err(VaultError::Unreadable));
    }
}
