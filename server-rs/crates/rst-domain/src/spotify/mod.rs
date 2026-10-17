//! Context Spotify: tokens, the current track from the Spotify answer, its progress and when a change is worth
//! sending, plus the redirect of the login (template: the pure parts of `server/spotify.ts`).

use std::fmt;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;

pub const SCOPES: &str = "user-read-currently-playing user-read-playback-state";
/// Polling interval while an overlay of the streamer is open
pub const POLL_MS: u64 = 3000;
/// A progress jump above this counts as seeking
const SEEK_MS: u32 = 3000;

/// Secrets are never shown in `Debug`
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SpotifyTokens {
    pub access: String,
    pub refresh: String,
    /// Milliseconds since the epoch
    #[serde(rename = "expiresAt")]
    pub expires_at: i64,
}

impl fmt::Debug for SpotifyTokens {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.debug_struct("SpotifyTokens").field("expires_at", &self.expires_at).finish_non_exhaustive()
    }
}

/// Only known fields with valid values, otherwise `None`
#[must_use]
pub fn to_tokens(value: &Value) -> Option<SpotifyTokens> {
    let text = |key: &str| value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty()).map(str::to_owned);
    #[expect(clippy::cast_possible_truncation, reason = "a time in milliseconds fits i64")]
    let expires_at = value.get("expiresAt").and_then(Value::as_f64)? as i64;
    Some(SpotifyTokens { access: text("access")?, refresh: text("refresh")?, expires_at })
}

/// Current Spotify track; `progress_ms` applies to the moment the message arrives
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub cover: Option<String>,
    #[serde(rename = "durationMs")]
    pub duration_ms: u32,
    #[serde(rename = "progressMs")]
    pub progress_ms: u32,
    pub playing: bool,
}

/// What the connection page shows: the account, the current track and whether an overlay is listening
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
pub struct SpotifyDetails {
    pub account: Option<String>,
    pub track: Option<Track>,
    pub polling: bool,
}

fn text(value: &Value, path: &[&str]) -> Option<String> {
    path.iter().try_fold(value, |current, key| current.get(key)).and_then(Value::as_str).map(str::to_owned)
}

fn millis(value: Option<&Value>) -> u32 {
    value.and_then(Value::as_u64).and_then(|ms| u32::try_from(ms).ok()).unwrap_or(0)
}

/// Songs have artists and album, podcast episodes a show and their own images; `None` = nothing is playing
#[must_use]
pub fn to_track(answer: &Value) -> Option<Track> {
    let item = answer.get("item").filter(|item| item.is_object())?;
    let show = text(item, &["show", "name"]);
    let artist = match item.get("artists").and_then(Value::as_array) {
        Some(artists) => {
            artists.iter().map(|artist| text(artist, &["name"]).unwrap_or_default()).collect::<Vec<_>>().join(", ")
        }
        None => show.clone().unwrap_or_default(),
    };
    let images = item.get("album").and_then(|album| album.get("images")).or_else(|| item.get("images"));
    Some(Track {
        id: text(item, &["id"]).or_else(|| text(item, &["uri"])).unwrap_or_default(),
        title: text(item, &["name"]).unwrap_or_default(),
        artist,
        album: text(item, &["album", "name"]).or(show).unwrap_or_default(),
        cover: images.and_then(|images| images.get(0)).and_then(|image| text(image, &["url"])),
        duration_ms: millis(item.get("duration_ms")),
        progress_ms: millis(answer.get("progress_ms")),
        playing: answer.get("is_playing").and_then(Value::as_bool).unwrap_or(false),
    })
}

/// State at `now`: a playing track has moved on since `sent_at`, never past its end
#[must_use]
pub fn progressed(track: Option<&Track>, sent_at: i64, now: i64) -> Option<Track> {
    let track = track?;
    let mut next = track.clone();
    if track.playing {
        let elapsed = u32::try_from(now.saturating_sub(sent_at).max(0)).unwrap_or(u32::MAX);
        next.progress_ms = track.duration_ms.min(track.progress_ms.saturating_add(elapsed));
    }
    Some(next)
}

/// Only changes are sent: another track, play or pause, seeking, or a switch between track and silence
#[must_use]
pub fn changed(before: Option<&Track>, next: Option<&Track>) -> bool {
    match (before, next) {
        (Some(before), Some(next)) => {
            next.id != before.id
                || next.playing != before.playing
                || next.progress_ms.abs_diff(before.progress_ms) > SEEK_MS
        }
        (before, next) => before.is_some() != next.is_some(),
    }
}

/// Scheme and host of a URL in lower case, without a default port; `None` if it is no http(s) URL
fn origin(public_url: &str) -> Option<(String, String)> {
    let (scheme, rest) = public_url.split_once("://")?;
    let scheme = scheme.to_ascii_lowercase();
    let default_port = match scheme.as_str() {
        "http" => ":80",
        "https" => ":443",
        _ => return None,
    };
    let host = rest.split(['/', '?', '#']).next().unwrap_or_default().to_ascii_lowercase();
    let host = host.strip_suffix(default_port).map_or(host.clone(), str::to_owned);
    (!host.is_empty() && !host.contains('@')).then_some((scheme, host))
}

/// For local redirects Spotify only allows the loopback IP, not `localhost`; otherwise `PUBLIC_URL` applies
#[must_use]
pub fn redirect_uri(public_url: &str) -> Option<String> {
    let (scheme, host) = origin(public_url)?;
    let host = match host.strip_prefix("localhost") {
        Some(port) if port.is_empty() || port.starts_with(':') => format!("127.0.0.1{port}"),
        _ => host,
    };
    Some(format!("{scheme}://{host}/spotify/callback"))
}

/// If the callback arrives on the dashboard's host it carries the session cookie, so it must come from the streamer
/// who started the connection. Locally (`localhost` to `127.0.0.1`) the cookie is missing.
#[must_use]
pub fn callback_has_session(public_url: &str) -> bool {
    let redirect = redirect_uri(public_url).and_then(|uri| origin(&uri));
    redirect.is_some() && redirect == origin(public_url)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn track() -> Track {
        Track {
            id: "1".to_owned(),
            title: "t".to_owned(),
            artist: "a".to_owned(),
            album: "b".to_owned(),
            cover: None,
            duration_ms: 10_000,
            progress_ms: 2000,
            playing: true,
        }
    }

    #[test]
    fn redirect_via_loopback_locally() {
        assert_eq!(redirect_uri("http://localhost:8089").as_deref(), Some("http://127.0.0.1:8089/spotify/callback"));
        assert_eq!(
            redirect_uri("https://overlays.example.org/").as_deref(),
            Some("https://overlays.example.org/spotify/callback")
        );
        assert_eq!(redirect_uri("https://Example.org:443").as_deref(), Some("https://example.org/spotify/callback"));
        assert_eq!(
            redirect_uri("http://localhost.evil.example").as_deref(),
            Some("http://localhost.evil.example/spotify/callback")
        );
        assert_eq!(redirect_uri("ftp://x"), None);
        assert_eq!(redirect_uri("nonsense"), None);
        assert!(callback_has_session("https://overlays.example.org"));
        assert!(!callback_has_session("http://localhost:8089"));
        assert!(!callback_has_session("nonsense"));
    }

    #[test]
    fn only_complete_tokens_with_expiry() {
        let tokens = to_tokens(&json!({ "access": "a", "refresh": "r", "expiresAt": 5, "extra": 1 })).expect("tokens");
        assert_eq!(
            serde_json::to_value(&tokens).expect("json"),
            json!({ "access": "a", "refresh": "r", "expiresAt": 5 })
        );
        assert_eq!(to_tokens(&json!({ "access": "a", "refresh": "r" })), None);
        assert_eq!(to_tokens(&Value::Null), None);
        assert!(!format!("{tokens:?}").contains("\"a\""));
    }

    #[test]
    fn songs_episodes_and_silence() {
        let song = to_track(
            &json!({ "is_playing": true, "progress_ms": 1000, "item": { "id": "1", "name": "Wake Up", "duration_ms": 60_000, "artists": [{ "name": "RATM" }, { "name": "Guest" }], "album": { "name": "Matrix", "images": [{ "url": "cover.jpg" }] } } }),
        );
        let expected = json!({ "id": "1", "title": "Wake Up", "artist": "RATM, Guest", "album": "Matrix", "cover": "cover.jpg", "durationMs": 60_000, "progressMs": 1000, "playing": true });
        assert_eq!(serde_json::to_value(song).expect("json"), expected);
        let episode = to_track(
            &json!({ "item": { "uri": "episode:2", "name": "Episode", "show": { "name": "Podcast" }, "images": [] } }),
        );
        let expected = json!({ "id": "episode:2", "title": "Episode", "artist": "Podcast", "album": "Podcast", "cover": null, "durationMs": 0, "progressMs": 0, "playing": false });
        assert_eq!(serde_json::to_value(episode).expect("json"), expected);
        assert_eq!(to_track(&json!({ "item": null })), None);
        assert_eq!(to_track(&Value::Null), None);
    }

    #[test]
    fn progress_moves_only_while_playing() {
        let track = track();
        assert_eq!(progressed(Some(&track), 1000, 4000).map(|next| next.progress_ms), Some(5000));
        assert_eq!(progressed(Some(&track), 0, 60_000).map(|next| next.progress_ms), Some(10_000));
        let paused = Track { playing: false, ..track };
        assert_eq!(progressed(Some(&paused), 0, 60_000).map(|next| next.progress_ms), Some(2000));
        assert_eq!(progressed(None, 0, 0), None);
    }

    #[test]
    fn changes_worth_sending() {
        let track = track();
        assert!(!changed(None, None));
        assert!(changed(None, Some(&track)));
        assert!(changed(Some(&track), None));
        assert!(!changed(Some(&track), Some(&Track { progress_ms: 4000, ..track.clone() })));
        assert!(changed(Some(&track), Some(&Track { progress_ms: 6000, ..track.clone() })));
        assert!(changed(Some(&track), Some(&Track { id: "2".to_owned(), ..track.clone() })));
        assert!(changed(Some(&track), Some(&Track { playing: false, ..track.clone() })));
    }
}
