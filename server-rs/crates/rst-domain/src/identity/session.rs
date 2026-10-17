//! Dashboard sessions: a random token of 256 bits in the cookie `sid`, the server stores only its SHA-256, so a
//! session can be revoked and a leaked store reveals no usable token. The random bytes come from outside. Cookie texts
//! follow `server/session.ts`.

use std::fmt;

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

/// Sessions last 30 days
pub const SESSION_DAYS: i64 = 30;
/// A started OAuth login is valid for 10 minutes
pub const OAUTH_STATE_SECONDS: i64 = 600;

/// The secret in the cookie; never shown in `Debug`
#[derive(Clone, PartialEq, Eq)]
pub struct SessionToken([u8; 32]);

impl SessionToken {
    #[must_use]
    pub const fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Token from the cookie text; `None` for anything that is not 32 bytes in base64url
    #[must_use]
    pub fn parse(text: &str) -> Option<Self> {
        let bytes = URL_SAFE_NO_PAD.decode(text).ok()?;
        bytes.try_into().ok().map(Self)
    }

    /// Cookie text: base64url without padding (43 characters)
    #[must_use]
    pub fn to_text(&self) -> String {
        URL_SAFE_NO_PAD.encode(self.0)
    }

    #[must_use]
    pub fn hash(&self) -> SessionHash {
        SessionHash(Sha256::digest(self.0).into())
    }
}

impl fmt::Debug for SessionToken {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("SessionToken(..)")
    }
}

/// What the server stores; equality in constant time
#[derive(Debug, Clone, Copy, Eq)]
pub struct SessionHash([u8; 32]);

impl SessionHash {
    #[must_use]
    pub const fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    #[must_use]
    pub const fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl PartialEq for SessionHash {
    fn eq(&self, other: &Self) -> bool {
        self.0.ct_eq(&other.0).into()
    }
}

/// Secure cookies only when the server is reachable publicly via HTTPS (`PUBLIC_URL`, e.g. behind Caddy)
#[must_use]
pub fn is_secure_url(public_url: &str) -> bool {
    public_url.starts_with("https://")
}

fn cookie(name: &str, value: &str, secure: bool, max_age: i64) -> String {
    let secure = if secure { "; Secure" } else { "" };
    format!("{name}={value}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}{secure}")
}

/// Session cookie; `max_age` 0 deletes it
#[must_use]
pub fn session_cookie(value: &str, secure: bool, max_age: i64) -> String {
    cookie("sid", value, secure, max_age)
}

/// State of a started OAuth login, only for the callback; `max_age` 0 deletes it
#[must_use]
pub fn oauth_state_cookie(state: &str, secure: bool, max_age: i64) -> String {
    cookie("oauth_state", state, secure, max_age)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_text_and_hash_are_deterministic() {
        let token = SessionToken::from_bytes([7; 32]);
        let text = token.to_text();
        assert_eq!(text.len(), 43);
        assert_eq!(SessionToken::parse(&text), Some(token.clone()));
        assert_eq!(token.hash(), SessionToken::from_bytes([7; 32]).hash());
        assert_ne!(token.hash(), SessionToken::from_bytes([8; 32]).hash());
        // SHA-256 of 32 bytes 0x07
        let expected = Sha256::digest([7; 32]);
        assert_eq!(token.hash().as_bytes()[..], expected[..]);
    }

    #[test]
    fn garbage_is_no_token() {
        for text in ["", "broken", "a.b.c", &"A".repeat(42), &"A".repeat(44), &format!("{}=", "A".repeat(43))] {
            assert_eq!(SessionToken::parse(text), None, "{text}");
        }
    }

    #[test]
    fn debug_hides_the_token() {
        let token = SessionToken::from_bytes([7; 32]);
        assert!(!format!("{token:?}").contains(&token.to_text()));
        assert!(!format!("{token:?}").contains('7'));
    }

    #[test]
    fn cookies_http_only_lax_and_secure_with_https() {
        let secure = session_cookie("v", is_secure_url("https://overlays.example.de"), SESSION_DAYS * 86_400);
        assert_eq!(secure, "sid=v; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure");
        assert!(!session_cookie("v", is_secure_url("http://localhost:8089"), 0).contains("Secure"));
        assert_eq!(
            oauth_state_cookie("s1", true, OAUTH_STATE_SECONDS),
            "oauth_state=s1; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure"
        );
        assert_eq!(oauth_state_cookie("", false, 0), "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    }
}
