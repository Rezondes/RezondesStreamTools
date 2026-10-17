//! The Spotify app over HTTP (template: `requestToken`, `loadAccount` and `poll` in `server/spotify.ts`): login URL,
//! tokens, the current track (songs and podcast episodes) and the account name.

use reqwest::header::RETRY_AFTER;
use reqwest::{Client, StatusCode, Url};
use rst_app::ports::spotify::{Playing, SpotifyApi, TokenAnswer};
use rst_app::ports::twitch::ProviderError;
use rst_domain::spotify::SCOPES;
use serde_json::Value;

/// Pause after a 429 without `Retry-After`, in seconds
const DEFAULT_RETRY_S: u64 = 30;

#[derive(Debug, Clone)]
pub struct SpotifyClient {
    http: Client,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
    /// e.g. `https://accounts.spotify.com`
    accounts_url: String,
    /// e.g. `https://api.spotify.com/v1`
    api_url: String,
}

impl SpotifyClient {
    #[must_use]
    pub fn new(client_id: &str, client_secret: &str, redirect_uri: &str, accounts_url: &str, api_url: &str) -> Self {
        Self {
            http: Client::new(),
            client_id: client_id.to_owned(),
            client_secret: client_secret.to_owned(),
            redirect_uri: redirect_uri.to_owned(),
            accounts_url: accounts_url.to_owned(),
            api_url: api_url.to_owned(),
        }
    }

    /// Where the streamer allows the access; `state` binds the callback to the streamer
    ///
    /// # Errors
    /// When the configured Spotify URL is no URL.
    pub fn authorize_url(&self, state: &str) -> Result<String, ProviderError> {
        let query = [
            ("client_id", self.client_id.as_str()),
            ("response_type", "code"),
            ("redirect_uri", self.redirect_uri.as_str()),
            ("scope", SCOPES),
            ("state", state),
        ];
        let url =
            Url::parse_with_params(&format!("{}/authorize", self.accounts_url), query).map_err(ProviderError::new)?;
        Ok(url.into())
    }
}

fn text(answer: &Value, key: &str) -> Option<String> {
    answer.get(key).and_then(Value::as_str).filter(|text| !text.is_empty()).map(str::to_owned)
}

impl SpotifyClient {
    async fn token(&self, form: &[(&str, &str)]) -> Result<Option<TokenAnswer>, ProviderError> {
        let response = self
            .http
            .post(format!("{}/api/token", self.accounts_url))
            .basic_auth(&self.client_id, Some(&self.client_secret))
            .form(form)
            .send()
            .await
            .map_err(ProviderError::new)?;
        match response.status() {
            StatusCode::BAD_REQUEST | StatusCode::UNAUTHORIZED => Ok(None),
            status if status.is_success() => {
                let answer: Value = response.json().await.map_err(ProviderError::new)?;
                Ok(Some(TokenAnswer {
                    access: text(&answer, "access_token"),
                    refresh: text(&answer, "refresh_token"),
                    expires_in: answer.get("expires_in").and_then(Value::as_i64),
                }))
            }
            status => Err(ProviderError::new(format!("Spotify token request failed: {status}"))),
        }
    }
}

impl SpotifyApi for SpotifyClient {
    async fn exchange(&self, code: &str) -> Result<Option<TokenAnswer>, ProviderError> {
        self.token(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", self.redirect_uri.as_str()),
        ])
        .await
    }

    async fn refresh(&self, refresh: &str) -> Result<Option<TokenAnswer>, ProviderError> {
        self.token(&[("grant_type", "refresh_token"), ("refresh_token", refresh)]).await
    }

    async fn playing(&self, access: &str) -> Result<Playing, ProviderError> {
        let response = self
            .http
            .get(format!("{}/me/player/currently-playing?additional_types=episode", self.api_url))
            .bearer_auth(access)
            .send()
            .await
            .map_err(ProviderError::new)?;
        match response.status() {
            StatusCode::OK => response.json().await.map(Playing::Answer).map_err(ProviderError::new),
            StatusCode::NO_CONTENT => Ok(Playing::Nothing),
            StatusCode::UNAUTHORIZED => Ok(Playing::Unauthorized),
            StatusCode::TOO_MANY_REQUESTS => {
                let retry = response.headers().get(RETRY_AFTER).and_then(|value| value.to_str().ok());
                Ok(Playing::Limited(
                    retry
                        .and_then(|value| value.parse().ok())
                        .filter(|seconds| *seconds > 0)
                        .unwrap_or(DEFAULT_RETRY_S),
                ))
            }
            status => Err(ProviderError::new(format!("Spotify answered {status}"))),
        }
    }

    async fn account(&self, access: &str) -> Option<String> {
        let response = self.http.get(format!("{}/me", self.api_url)).bearer_auth(access).send().await.ok()?;
        if !response.status().is_success() {
            return None;
        }
        let answer: Value = response.json().await.ok()?;
        text(&answer, "display_name").or_else(|| text(&answer, "id"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn login_url_with_scopes_redirect_and_state() {
        let client =
            SpotifyClient::new("id", "secret", "https://x/spotify/callback", "https://accounts", "https://api");
        let url = client.authorize_url("s1").expect("url");
        assert!(url.starts_with("https://accounts/authorize?client_id=id&response_type=code"));
        assert!(url.contains("redirect_uri=https%3A%2F%2Fx%2Fspotify%2Fcallback") && url.contains("state=s1"));
        assert!(url.contains("scope=user-read-currently-playing+user-read-playback-state"));
    }
}
