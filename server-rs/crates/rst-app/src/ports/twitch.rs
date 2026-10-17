//! Ports of Twitch: the OAuth app (exchange a login code for tokens, check and revoke them), `EventSub` and the chat over Helix.

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

/// Result of a chat message as the streamer
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Said {
    Sent,
    /// The login may not write to chat: the streamer has to reconnect Twitch
    MissingScope,
}

/// Helix chat: messages as the streamer in the own chat
pub trait ChatSender: Send + Sync {
    /// # Errors
    /// Network problems and answers other than success, 401 and 403.
    fn say(&self, tokens: &TwitchTokens, message: &str) -> impl Future<Output = Result<Said, ProviderError>> + Send;

    /// Whether the login has the chat scope; `None` when Twitch cannot tell
    fn can_chat(&self, tokens: &TwitchTokens) -> impl Future<Output = Option<bool>> + Send;
}
