//! Public URLs of a streamer: everything under `/s/<login>/...` (templates: `parse` in `src/core/streamerPath.ts`,
//! `overlayRoute` in `server/routes.ts`). The path is split before decoding, so `%2F` never becomes a separator.

use crate::identity::values::Login;
use crate::media::values::MediaName;

/// Scenes of the overlays; a scene is served as `<scene>.html`
pub const SCENES: [&str; 10] = [
    "starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "minimes", "info",
];

/// Login and the individually decoded path parts after it, e.g. `["media", "lizard.gif"]`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StreamerPath {
    pub login: Login,
    pub segments: Vec<String>,
}

impl StreamerPath {
    /// Splits `/s/<login>/<rest>`. `None` when the path does not look like that, the login is invalid or a part
    /// cannot be decoded. The login itself is not decoded.
    #[must_use]
    pub fn parse(pathname: &str) -> Option<Self> {
        let mut parts = pathname.split('/');
        if parts.next() != Some("") || parts.next() != Some("s") {
            return None;
        }
        let login = Login::parse(parts.next()?).ok()?;
        let segments = parts.map(percent_decode).collect::<Option<Vec<_>>>()?;
        Some(Self { login, segments })
    }

    /// Path prefix of all URLs of a streamer
    #[must_use]
    pub fn base(login: &Login) -> String {
        format!("/s/{login}")
    }
}

/// Like `decodeURIComponent`: `%XX` bytes must form valid UTF-8; a broken sequence makes the whole part invalid
fn percent_decode(segment: &str) -> Option<String> {
    let bytes = segment.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' {
            let hex = segment.get(index + 1..index + 3)?;
            decoded.push(u8::from_str_radix(hex, 16).ok()?);
            index += 3;
        } else {
            decoded.push(bytes[index]);
            index += 1;
        }
    }
    String::from_utf8(decoded).ok()
}

/// Public overlay URL under `/s/<login>/`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OverlayRoute {
    Status,
    Settings,
    Events,
    /// List of the chat commands
    Commands,
    /// File in `dist/`, e.g. `alerts.html`
    Scene(String),
    Media(MediaName),
}

impl OverlayRoute {
    /// `segments`: the decoded path parts after `/s/<login>/`. `None` = no overlay URL (404).
    #[must_use]
    pub fn from_segments(segments: &[String]) -> Option<Self> {
        match segments {
            // `/s/<login>/` is the public commands page
            [] => Some(Self::Scene("info.html".to_owned())),
            [single] => Self::single(single),
            [media, file] if media == "media" => MediaName::parse(file).ok().map(Self::Media),
            _ => None,
        }
    }

    fn single(segment: &str) -> Option<Self> {
        match segment {
            "" => Some(Self::Scene("info.html".to_owned())),
            "status" => Some(Self::Status),
            "settings" => Some(Self::Settings),
            "events" => Some(Self::Events),
            "commands" => Some(Self::Commands),
            // Scenes are named like their file in dist/; index.html is the dashboard, not a scene
            "index.html" => None,
            _ if is_scene_file(segment) => Some(Self::Scene(segment.to_owned())),
            // Short URL without extension, only for known scenes
            _ if SCENES.contains(&segment) => Some(Self::Scene(format!("{segment}.html"))),
            _ => None,
        }
    }
}

/// `^[a-z]+\.html$`
fn is_scene_file(segment: &str) -> bool {
    segment
        .strip_suffix(".html")
        .is_some_and(|name| !name.is_empty() && name.bytes().all(|byte| byte.is_ascii_lowercase()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn path(pathname: &str) -> Option<(String, Vec<String>)> {
        StreamerPath::parse(pathname).map(|path| (path.login.to_string(), path.segments))
    }

    fn strings(parts: &[&str]) -> Vec<String> {
        parts.iter().map(|part| (*part).to_owned()).collect()
    }

    fn route(parts: &[&str]) -> Option<OverlayRoute> {
        OverlayRoute::from_segments(&strings(parts))
    }

    fn scene(file: &str) -> OverlayRoute {
        OverlayRoute::Scene(file.to_owned())
    }

    #[test]
    fn overlay_paths_return_login_and_decoded_parts() {
        assert_eq!(
            path("/s/rezondes/alerts.html"),
            Some(("rezondes".to_owned(), strings(&["alerts.html"])))
        );
        assert_eq!(
            path("/s/Rezondes/media/my%20lizard.gif"),
            Some(("rezondes".to_owned(), strings(&["media", "my lizard.gif"])))
        );
        assert_eq!(path("/s/rezondes"), Some(("rezondes".to_owned(), vec![])));
    }

    #[test]
    fn other_paths_invalid_logins_and_broken_encoding_are_none() {
        for pathname in [
            "/alerts.html",
            "/src/main.tsx",
            "s/rezondes/status",
            "/s/",
            "/s/../status",
            "/s/re%7A/status",
            "/s/rezondes/media/%E0",
            "/s/rezondes/%4",
        ] {
            assert_eq!(path(pathname), None, "{pathname}");
        }
    }

    #[test]
    fn encoded_slash_stays_one_part_and_is_no_media_name() {
        let (_, segments) = path("/s/rezondes/media/..%2F..%2Ftokens.json").expect("valid path");
        assert_eq!(segments, strings(&["media", "../../tokens.json"]));
        assert!(MediaName::parse(&segments[1]).is_err());
    }

    #[test]
    fn base_is_the_prefix() {
        let login = Login::parse("rezondes").expect("valid login");
        assert_eq!(StreamerPath::base(&login), "/s/rezondes");
    }

    #[test]
    fn overlay_routes() {
        assert_eq!(route(&["status"]), Some(OverlayRoute::Status));
        assert_eq!(route(&["settings"]), Some(OverlayRoute::Settings));
        assert_eq!(route(&["settings", "x"]), None);
        assert_eq!(route(&["events"]), Some(OverlayRoute::Events));
        assert_eq!(route(&["commands"]), Some(OverlayRoute::Commands));
        assert_eq!(route(&[""]), Some(scene("info.html")));
        assert_eq!(route(&[]), Some(scene("info.html")));
        assert_eq!(route(&["info"]), Some(scene("info.html")));
        assert_eq!(route(&["alerts.html"]), Some(scene("alerts.html")));
        let lizard = MediaName::parse("lizard.gif").expect("valid name");
        assert_eq!(route(&["media", "lizard.gif"]), Some(OverlayRoute::Media(lizard)));
    }

    #[test]
    fn short_scene_urls_only_for_known_scenes() {
        assert_eq!(route(&["alerts"]), Some(scene("alerts.html")));
        assert_eq!(route(&["starting"]), Some(scene("starting.html")));
        assert_eq!(route(&["minimes"]), Some(scene("minimes.html")));
        assert_eq!(route(&["index"]), None);
        assert_eq!(route(&["unknown"]), None);
    }

    #[test]
    fn everything_else_is_no_overlay_url() {
        for parts in [
            &["index.html"][..],
            &["../tokens.json"],
            &["status", "x"],
            &["media", "../../tokens.json"],
            &["media", "tokens.json"],
            &["media", "a", "b.gif"],
            &["Alerts.html"],
        ] {
            assert_eq!(route(parts), None, "{parts:?}");
        }
    }
}
