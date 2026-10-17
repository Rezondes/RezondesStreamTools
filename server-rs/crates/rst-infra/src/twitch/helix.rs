//! Helix calls of the Twitch client beyond the login (template: `say`, `canChat` and `subscribeAll` in
//! `server/twitch.ts`): `EventSub` subscriptions and chat messages as the streamer.

use reqwest::StatusCode;
use rst_app::ports::twitch::{ChatSender, EventSubscriber, ProviderError, Said};
use rst_domain::twitch::tokens::{CHAT_SCOPE, TwitchTokens};
use serde_json::{Value, json};

use crate::twitch::oauth::TwitchClient;

impl EventSubscriber for TwitchClient {
    async fn subscribe(&self, access: &str, subscription: &Value) -> Result<(), ProviderError> {
        let response = self
            .http
            .post(format!("{}/eventsub/subscriptions", self.api_url))
            .header("Client-Id", &self.client_id)
            .bearer_auth(access)
            .json(subscription)
            .send()
            .await
            .map_err(ProviderError::new)?;
        if response.status().is_success() {
            Ok(())
        } else {
            let status = response.status();
            Err(ProviderError::new(format!("{status} {}", response.text().await.unwrap_or_default())))
        }
    }
}

impl ChatSender for TwitchClient {
    async fn say(&self, tokens: &TwitchTokens, message: &str) -> Result<Said, ProviderError> {
        let user = tokens.user_id.as_str();
        let response = self
            .http
            .post(format!("{}/chat/messages", self.api_url))
            .header("Client-Id", &self.client_id)
            .bearer_auth(&tokens.access)
            .json(&json!({ "broadcaster_id": user, "sender_id": user, "message": message }))
            .send()
            .await
            .map_err(ProviderError::new)?;
        match response.status() {
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Ok(Said::MissingScope),
            status if status.is_success() => Ok(Said::Sent),
            status => Err(ProviderError::new(format!("Twitch chat message failed: {status}"))),
        }
    }

    async fn can_chat(&self, tokens: &TwitchTokens) -> Option<bool> {
        let response = self
            .http
            .get(format!("{}/validate", self.id_url))
            .header("Authorization", format!("OAuth {}", tokens.access))
            .send()
            .await
            .ok()
            .filter(|response| response.status().is_success())?;
        let answer: Value = response.json().await.ok()?;
        let scopes = answer.get("scopes").and_then(Value::as_array);
        Some(scopes.is_some_and(|scopes| scopes.iter().any(|scope| scope == CHAT_SCOPE)))
    }
}
