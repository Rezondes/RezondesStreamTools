//! The Twitch OAuth app over HTTP (template: `twitchApp` in `server/twitch.ts`): login URL, code exchange with the
//! login from Helix `/users` and revoking a token. A refused code (400, 401) is `None`; other failures are errors, so
//! a network problem never counts as an invalid login.

use reqwest::{Client, StatusCode, Url};
use rst_app::ports::twitch::{ProviderError, TwitchAuth};
use rst_domain::twitch::tokens::{SCOPES, TwitchTokens, to_tokens};
use serde_json::{Value, json};

#[derive(Debug, Clone)]
pub struct TwitchClient {
    pub(super) http: Client,
    pub(super) client_id: String,
    client_secret: String,
    redirect_uri: String,
    /// e.g. `https://id.twitch.tv/oauth2`
    pub(super) id_url: String,
    /// e.g. `https://api.twitch.tv/helix`
    pub(super) api_url: String,
}

impl TwitchClient {
    #[must_use]
    pub fn new(client_id: &str, client_secret: &str, redirect_uri: &str, id_url: &str, api_url: &str) -> Self {
        Self {
            http: Client::new(),
            client_id: client_id.to_owned(),
            client_secret: client_secret.to_owned(),
            redirect_uri: redirect_uri.to_owned(),
            id_url: id_url.to_owned(),
            api_url: api_url.to_owned(),
        }
    }

    /// Where the browser logs in; `state` binds the callback to it
    ///
    /// # Errors
    /// When the configured Twitch URL is no URL.
    pub fn authorize_url(&self, state: &str) -> Result<String, ProviderError> {
        let scopes = SCOPES.join(" ");
        let query = [
            ("client_id", self.client_id.as_str()),
            ("redirect_uri", self.redirect_uri.as_str()),
            ("response_type", "code"),
            ("scope", scopes.as_str()),
            ("state", state),
            ("force_verify", "true"),
        ];
        let url = Url::parse_with_params(&format!("{}/authorize", self.id_url), query).map_err(ProviderError::new)?;
        Ok(url.into())
    }

    async fn token(&self, form: &[(&str, &str)]) -> Result<Option<Value>, ProviderError> {
        let mut fields = vec![("client_id", self.client_id.as_str()), ("client_secret", self.client_secret.as_str())];
        fields.extend_from_slice(form);
        let response =
            self.http.post(format!("{}/token", self.id_url)).form(&fields).send().await.map_err(ProviderError::new)?;
        match response.status() {
            StatusCode::BAD_REQUEST | StatusCode::UNAUTHORIZED => Ok(None),
            status if status.is_success() => response.json().await.map(Some).map_err(ProviderError::new),
            status => Err(ProviderError::new(format!("Twitch token request failed: {status}"))),
        }
    }
}

impl TwitchAuth for TwitchClient {
    async fn exchange(&self, code: &str) -> Result<Option<TwitchTokens>, ProviderError> {
        let form = [("grant_type", "authorization_code"), ("code", code), ("redirect_uri", self.redirect_uri.as_str())];
        let Some(answer) = self.token(&form).await? else { return Ok(None) };
        let access = answer.get("access_token").and_then(Value::as_str).unwrap_or_default();
        let response = self
            .http
            .get(format!("{}/users", self.api_url))
            .header("Client-Id", &self.client_id)
            .bearer_auth(access)
            .send()
            .await
            .map_err(ProviderError::new)?;
        if !response.status().is_success() {
            return Err(ProviderError::new(format!("Twitch user request failed: {}", response.status())));
        }
        let users: Value = response.json().await.map_err(ProviderError::new)?;
        let user = &users["data"][0];
        Ok(to_tokens(&json!({
            "access": access,
            "refresh": answer.get("refresh_token"),
            "userId": user.get("id"),
            "login": user.get("login"),
        })))
    }

    async fn validate(&self, tokens: &TwitchTokens) -> Result<Option<TwitchTokens>, ProviderError> {
        let response = self
            .http
            .get(format!("{}/validate", self.id_url))
            .header("Authorization", format!("OAuth {}", tokens.access))
            .send()
            .await
            .map_err(ProviderError::new)?;
        if response.status().is_success() {
            return Ok(Some(tokens.clone()));
        }
        if response.status() != StatusCode::UNAUTHORIZED {
            return Err(ProviderError::new(format!("Twitch token validation failed: {}", response.status())));
        }
        let form = [("grant_type", "refresh_token"), ("refresh_token", tokens.refresh.as_str())];
        let Some(answer) = self.token(&form).await? else { return Ok(None) };
        let text = |key: &str| answer.get(key).and_then(Value::as_str).map(str::to_owned);
        let (Some(access), refresh) = (text("access_token"), text("refresh_token")) else { return Ok(None) };
        Ok(Some(TwitchTokens { access, refresh: refresh.unwrap_or_else(|| tokens.refresh.clone()), ..tokens.clone() }))
    }

    async fn revoke(&self, access: &str) -> Result<(), ProviderError> {
        let form = [("client_id", self.client_id.as_str()), ("token", access)];
        let response =
            self.http.post(format!("{}/revoke", self.id_url)).form(&form).send().await.map_err(ProviderError::new)?;
        if response.status().is_success() {
            Ok(())
        } else {
            Err(ProviderError::new(format!("Twitch revoke failed: {}", response.status())))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn login_url_with_redirect_scopes_and_state() {
        let client = TwitchClient::new(
            "client-id",
            "secret",
            "http://localhost:8089/auth/callback",
            "https://id.twitch.tv/oauth2",
            "https://api.twitch.tv/helix",
        );
        let url = Url::parse(&client.authorize_url("state-1").expect("url")).expect("parse");
        assert_eq!(url.as_str().split('?').next(), Some("https://id.twitch.tv/oauth2/authorize"));
        let query: Vec<(String, String)> =
            url.query_pairs().map(|(key, value)| (key.into_owned(), value.into_owned())).collect();
        let get = |name: &str| query.iter().find(|(key, _)| key == name).map(|(_, value)| value.as_str());
        assert_eq!(get("state"), Some("state-1"));
        assert_eq!(get("redirect_uri"), Some("http://localhost:8089/auth/callback"));
        assert!(
            get("scope")
                .is_some_and(|scope| scope.contains("channel:read:subscriptions") && scope.contains("user:write:chat"))
        );
        assert!(!client.authorize_url("s").expect("url").contains("secret"));
        let faked = TwitchClient::new("id", "secret", "x", "http://127.0.0.1:1/oauth2", "http://127.0.0.1:1/helix");
        assert!(faked.authorize_url("s").expect("url").starts_with("http://127.0.0.1:1/oauth2/authorize?"));
    }
}
