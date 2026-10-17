//! The master key from `RST_MASTER_KEY` (32 bytes, base64). It wraps the data keys of the streamers and derives
//! keys for server-wide purposes (HKDF). Without a valid key the server does not start. The key never appears in
//! `Debug` or logs and is wiped from memory when dropped.

use std::fmt;

use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::Zeroizing;

pub const MASTER_KEY_VAR: &str = "RST_MASTER_KEY";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MasterKeyError {
    Missing,
    NotBase64,
    WrongLength,
}

impl fmt::Display for MasterKeyError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::Missing => "RST_MASTER_KEY is missing: set 32 random bytes as base64 (e.g. openssl rand -base64 32)",
            Self::NotBase64 => "RST_MASTER_KEY is not valid base64",
            Self::WrongLength => "RST_MASTER_KEY must be exactly 32 bytes (44 base64 characters)",
        })
    }
}

impl std::error::Error for MasterKeyError {}

#[derive(Clone)]
pub struct MasterKey(Zeroizing<[u8; 32]>);

impl MasterKey {
    /// # Errors
    /// When the value is missing, empty, not base64 or not 32 bytes.
    pub fn from_value(value: Option<&str>) -> Result<Self, MasterKeyError> {
        let value = value.map(str::trim).filter(|value| !value.is_empty()).ok_or(MasterKeyError::Missing)?;
        let bytes = Zeroizing::new(STANDARD.decode(value).map_err(|_| MasterKeyError::NotBase64)?);
        let key: [u8; 32] = bytes.as_slice().try_into().map_err(|_| MasterKeyError::WrongLength)?;
        Ok(Self(Zeroizing::new(key)))
    }

    /// # Errors
    /// See [`Self::from_value`].
    pub fn from_env() -> Result<Self, MasterKeyError> {
        let value = std::env::var(MASTER_KEY_VAR).ok().map(Zeroizing::new);
        Self::from_value(value.as_deref().map(String::as_str))
    }

    #[must_use]
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(Zeroizing::new(bytes))
    }

    #[must_use]
    pub fn bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// A key for one purpose (e.g. `login-lookup`), always the same for the same master key and purpose
    #[must_use]
    pub fn derive(&self, purpose: &str) -> Zeroizing<[u8; 32]> {
        let mut key = Zeroizing::new([0; 32]);
        // 32 bytes are far below the HKDF limit of 255 * 32
        if Hkdf::<Sha256>::new(None, self.0.as_slice()).expand(purpose.as_bytes(), key.as_mut_slice()).is_err() {
            unreachable!("32 bytes are a valid HKDF output length");
        }
        key
    }
}

impl fmt::Debug for MasterKey {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("MasterKey(..)")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn encoded(bytes: &[u8]) -> String {
        STANDARD.encode(bytes)
    }

    #[test]
    fn accepts_32_bytes_in_base64() {
        let key = MasterKey::from_value(Some(&encoded(&[9; 32]))).expect("key");
        assert_eq!(key.bytes(), &[9; 32]);
        assert!(MasterKey::from_value(Some(&format!(" {} ", encoded(&[9; 32])))).is_ok());
    }

    #[test]
    fn rejects_missing_garbage_and_wrong_length() {
        assert_eq!(MasterKey::from_value(None).err(), Some(MasterKeyError::Missing));
        assert_eq!(MasterKey::from_value(Some("  ")).err(), Some(MasterKeyError::Missing));
        assert_eq!(MasterKey::from_value(Some("not base64!")).err(), Some(MasterKeyError::NotBase64));
        assert_eq!(MasterKey::from_value(Some(&encoded(&[9; 31]))).err(), Some(MasterKeyError::WrongLength));
        assert_eq!(MasterKey::from_value(Some(&encoded(&[9; 33]))).err(), Some(MasterKeyError::WrongLength));
        assert!(MasterKeyError::Missing.to_string().contains("RST_MASTER_KEY"));
    }

    #[test]
    fn debug_never_shows_the_key() {
        let value = encoded(&[9; 32]);
        let key = MasterKey::from_value(Some(&value)).expect("key");
        let debug = format!("{key:?}");
        assert!(!debug.contains(&value) && !debug.contains('9'));
    }

    #[test]
    fn derived_keys_depend_on_purpose_and_master() {
        let key = MasterKey::from_bytes([1; 32]);
        assert_eq!(*key.derive("login-lookup"), *key.derive("login-lookup"));
        assert_ne!(*key.derive("login-lookup"), *key.derive("server"));
        assert_ne!(*key.derive("login-lookup"), *MasterKey::from_bytes([2; 32]).derive("login-lookup"));
        assert_ne!(*key.derive("login-lookup"), *key.bytes());
    }
}
