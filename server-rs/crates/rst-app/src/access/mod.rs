//! The access policy of the server (template: `loadAccess` in `server/access.ts`), encrypted with the server key in
//! the server-wide settings. Without a saved policy only the admins may log in.

use rst_domain::access::{AccessPolicy, RawAccess};
use rst_domain::identity::values::Login;

use crate::crypto::cipher::{open, seal};
use crate::ports::StoreError;
use crate::ports::keys::DataKey;
use crate::ports::server_settings::ServerSettingsStore;
use crate::vault::VaultError;

const KEY: &str = "access";

#[derive(Debug, Clone)]
pub struct AccessSettings<P> {
    store: P,
    server_key: DataKey,
}

impl<P: ServerSettingsStore> AccessSettings<P> {
    pub const fn new(store: P, server_key: DataKey) -> Self {
        Self { store, server_key }
    }

    /// The saved policy, or the initial one with only the admins on the allowlist
    ///
    /// # Errors
    /// `Unreadable` for a policy that does not decrypt (wrong master key).
    pub async fn load(&self, admins: &[Login]) -> Result<AccessPolicy, VaultError> {
        let Some(sealed) = self.store.get(KEY).await? else { return Ok(AccessPolicy::initial(admins)) };
        let plaintext = open(self.server_key.bytes(), &sealed, KEY.as_bytes()).map_err(|_| VaultError::Unreadable)?;
        let raw: RawAccess = serde_json::from_slice(&plaintext).map_err(|_| VaultError::Unreadable)?;
        Ok(AccessPolicy::sanitize(&raw))
    }

    /// # Errors
    /// When storing fails.
    pub async fn save(&self, policy: &AccessPolicy, now: i64) -> Result<(), VaultError> {
        let json = serde_json::to_vec(policy).map_err(|error| VaultError::Store(StoreError::new(error)))?;
        let sealed = seal(self.server_key.bytes(), &json, KEY.as_bytes())
            .map_err(|error| VaultError::Store(StoreError::new(error)))?;
        Ok(self.store.put(KEY, &sealed, now).await?)
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::access::Registration;

    use super::*;
    use crate::testing::MemoryServerSettings;

    fn login(value: &str) -> Login {
        Login::parse(value).expect("login")
    }

    #[tokio::test]
    async fn initial_policy_then_the_saved_one() {
        let access = AccessSettings::new(MemoryServerSettings::default(), DataKey::from_bytes([9; 32]));
        let initial = access.load(&[login("rezondes")]).await.expect("load");
        assert_eq!(initial.allowlist, [login("rezondes")]);
        let open = AccessPolicy { registration: Registration::Open, ..initial };
        access.save(&open, 1).await.expect("save");
        assert_eq!(access.load(&[]).await.expect("load"), open);
        let other = AccessSettings::new(access.store.clone(), DataKey::from_bytes([8; 32]));
        assert_eq!(other.load(&[]).await, Err(VaultError::Unreadable));
    }
}
