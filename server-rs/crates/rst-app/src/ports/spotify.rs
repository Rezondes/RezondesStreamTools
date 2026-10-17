//! Port of the Spotify app: tokens from a code or a refresh token, the current track and the account name.

use std::future::Future;

use serde_json::Value;

use crate::ports::twitch::ProviderError;

/// Answer of the token endpoint; Spotify does not always send a new refresh token
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TokenAnswer {
    pub access: Option<String>,
    pub refresh: Option<String>,
    pub expires_in: Option<i64>,
}

/// Answer of `currently-playing`
#[derive(Debug, Clone, PartialEq)]
pub enum Playing {
    /// The answer as sent (200)
    Answer(Value),
    /// Nothing plays (204)
    Nothing,
    /// Too many requests: pause for so many seconds
    Limited(u64),
    /// The access token expired
    Unauthorized,
}

pub trait SpotifyApi: Send + Sync + 'static {
    /// Tokens for the code from the callback. `None` when Spotify refuses it (400, 401); other failures are errors.
    fn exchange(&self, code: &str) -> impl Future<Output = Result<Option<TokenAnswer>, ProviderError>> + Send;

    /// New tokens; `None` when Spotify refuses the refresh token, other failures are errors, so a network problem
    /// never ends a login
    fn refresh(&self, refresh: &str) -> impl Future<Output = Result<Option<TokenAnswer>, ProviderError>> + Send;

    fn playing(&self, access: &str) -> impl Future<Output = Result<Playing, ProviderError>> + Send;

    /// Display name, otherwise the Spotify ID; `None` on any error
    fn account(&self, access: &str) -> impl Future<Output = Option<String>> + Send;
}
