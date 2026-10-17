//! Authenticated encryption with XChaCha20-Poly1305: a random 24 byte nonce in front of the ciphertext. The
//! associated data binds a ciphertext to its owner (e.g. the streamer ID), so it cannot be moved to someone else.

use std::fmt;

use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use zeroize::Zeroizing;

pub const NONCE_LEN: usize = 24;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CryptoError {
    /// The operating system gave no random bytes
    Random,
    Encrypt,
    /// Changed ciphertext, wrong key or wrong associated data
    Decrypt,
}

impl fmt::Display for CryptoError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::Random => "no random bytes available",
            Self::Encrypt => "encryption failed",
            Self::Decrypt => "decryption failed",
        })
    }
}

impl std::error::Error for CryptoError {}

/// Random bytes from the operating system
///
/// # Errors
/// When the operating system gives none.
pub fn random_bytes<const N: usize>() -> Result<[u8; N], CryptoError> {
    let mut bytes = [0; N];
    getrandom::fill(&mut bytes).map_err(|_| CryptoError::Random)?;
    Ok(bytes)
}

/// Nonce and ciphertext of `plaintext`
///
/// # Errors
/// Without random bytes for the nonce.
pub fn seal(key: &[u8; 32], plaintext: &[u8], aad: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let nonce = random_bytes::<NONCE_LEN>()?;
    let cipher = XChaCha20Poly1305::new(&(*key).into());
    let ciphertext =
        cipher.encrypt(&XNonce::from(nonce), Payload { msg: plaintext, aad }).map_err(|_| CryptoError::Encrypt)?;
    let mut sealed = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    sealed.extend_from_slice(&nonce);
    sealed.extend_from_slice(&ciphertext);
    Ok(sealed)
}

/// Plaintext of a value from [`seal`]; wiped from memory when dropped
///
/// # Errors
/// When the value is too short, was changed, or key or associated data do not match.
pub fn open(key: &[u8; 32], sealed: &[u8], aad: &[u8]) -> Result<Zeroizing<Vec<u8>>, CryptoError> {
    let (nonce, ciphertext) = sealed.split_at_checked(NONCE_LEN).ok_or(CryptoError::Decrypt)?;
    let nonce: [u8; NONCE_LEN] = nonce.try_into().map_err(|_| CryptoError::Decrypt)?;
    let cipher = XChaCha20Poly1305::new(&(*key).into());
    cipher
        .decrypt(&XNonce::from(nonce), Payload { msg: ciphertext, aad })
        .map(Zeroizing::new)
        .map_err(|_| CryptoError::Decrypt)
}

/// Ciphertext of one block with a nonce the caller derives (block-wise files: prefix, counter, last flag). A nonce
/// must never repeat for the same key.
///
/// # Errors
/// When encrypting fails.
pub fn seal_block(
    key: &[u8; 32],
    nonce: &[u8; NONCE_LEN],
    plaintext: &[u8],
    aad: &[u8],
) -> Result<Vec<u8>, CryptoError> {
    XChaCha20Poly1305::new(&(*key).into())
        .encrypt(&XNonce::from(*nonce), Payload { msg: plaintext, aad })
        .map_err(|_| CryptoError::Encrypt)
}

/// Plaintext of a block from [`seal_block`]
///
/// # Errors
/// When the block was changed or nonce, key or associated data do not match.
pub fn open_block(
    key: &[u8; 32],
    nonce: &[u8; NONCE_LEN],
    ciphertext: &[u8],
    aad: &[u8],
) -> Result<Vec<u8>, CryptoError> {
    XChaCha20Poly1305::new(&(*key).into())
        .decrypt(&XNonce::from(*nonce), Payload { msg: ciphertext, aad })
        .map_err(|_| CryptoError::Decrypt)
}

#[cfg(test)]
mod tests {
    use super::*;

    const KEY: [u8; 32] = [7; 32];

    #[test]
    fn round_trip_with_fresh_nonces() {
        let first = seal(&KEY, b"secret", b"streamer-1").expect("seal");
        let second = seal(&KEY, b"secret", b"streamer-1").expect("seal");
        assert_ne!(first, second);
        assert_eq!(open(&KEY, &first, b"streamer-1").expect("open").as_slice(), b"secret");
        assert_eq!(open(&KEY, &seal(&KEY, b"", b"").expect("seal"), b"").expect("open").len(), 0);
    }

    #[test]
    fn changed_data_wrong_owner_or_key_fail() {
        let sealed = seal(&KEY, b"secret", b"streamer-1").expect("seal");
        let mut changed = sealed.clone();
        if let Some(last) = changed.last_mut() {
            *last ^= 1;
        }
        assert_eq!(open(&KEY, &changed, b"streamer-1"), Err(CryptoError::Decrypt));
        assert_eq!(open(&KEY, &sealed, b"streamer-2"), Err(CryptoError::Decrypt));
        assert_eq!(open(&[8; 32], &sealed, b"streamer-1"), Err(CryptoError::Decrypt));
        assert_eq!(open(&KEY, &sealed[..10], b"streamer-1"), Err(CryptoError::Decrypt));
    }
}
