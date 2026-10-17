//! Lookups without plaintext: HMAC-SHA256 with a key derived from the master key (purpose `lookup`). The same value
//! always gives the same digest, so the database can find a streamer by Twitch ID or login without storing either.

use std::fmt;

use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;
use zeroize::Zeroizing;

#[derive(Clone)]
pub struct LookupKey(Zeroizing<[u8; 32]>);

impl LookupKey {
    #[must_use]
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(Zeroizing::new(bytes))
    }

    /// Digest of `value` for one `purpose` (e.g. `login`); different purposes never collide
    #[must_use]
    pub fn digest(&self, purpose: &str, value: &str) -> [u8; 32] {
        let mut mac = <Hmac<Sha256> as KeyInit>::new_from_slice(self.0.as_slice())
            .unwrap_or_else(|_| unreachable!("HMAC takes any key length"));
        mac.update(purpose.as_bytes());
        mac.update(&[0]);
        mac.update(value.as_bytes());
        mac.finalize().into_bytes().into()
    }
}

impl fmt::Debug for LookupKey {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("LookupKey(..)")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_input_same_digest_and_purposes_apart() {
        let key = LookupKey::from_bytes([1; 32]);
        assert_eq!(key.digest("login", "neo"), key.digest("login", "neo"));
        assert_ne!(key.digest("login", "neo"), key.digest("user", "neo"));
        assert_ne!(key.digest("login", "neo"), key.digest("login", "trinity"));
        assert_ne!(key.digest("login", "neo"), LookupKey::from_bytes([2; 32]).digest("login", "neo"));
        // The separator keeps "a" + "bc" apart from "ab" + "c"
        assert_ne!(key.digest("a", "bc"), key.digest("ab", "c"));
        assert_eq!(format!("{key:?}"), "LookupKey(..)");
    }
}
