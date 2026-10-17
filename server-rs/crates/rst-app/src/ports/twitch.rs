//! Ports of Twitch: the OAuth app (exchange a login code for tokens, check and revoke them) and `EventSub` over Helix.

use std::fmt;
use std::future::Future;

use rst_domain::twitch::tokens::TwitchTokens;

/// Twitch could not be reached or answered with an error; the message is for the log
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProviderError(pub String);

impl ProviderError {
    pub fn new(message: impl fmt::Display) -> Self {
        Self(message.to_string())
    }
}

impl fmt::Display for ProviderError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for ProviderError {}

pub trait TwitchAuth: Send + Sync {
    /// Tokens and login for the code from the callback; `None` if Twitch refuses the code
    fn exchange(&self, code: &str) -> impl Future<Output = Result<Option<TwitchTokens>, ProviderError>> + Send;

    /// Invalidates the token at Twitch
    fn revoke(&self, access: &str) -> impl Future<Output = Result<(), ProviderError>> + Send;

    /// Twitch requires a regular check: the same tokens when valid, renewed ones when expired, `None` when the login
    /// is rejected; network problems are errors, so they never end a login
    fn validate(
        &self,
        tokens: &TwitchTokens,
    ) -> impl Future<Output = Result<Option<TwitchTokens>, ProviderError>> + Send;
}

/// Helix: requests an `EventSub` subscription (type, version, condition and transport) for a channel
pub trait EventSubscriber: Send + Sync {
    fn subscribe(
        &self,
        access: &str,
        subscription: &serde_json::Value,
    ) -> impl Future<Output = Result<(), ProviderError>> + Send;
}
