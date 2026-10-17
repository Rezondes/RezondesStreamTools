//! Value objects of the media context: the name of an uploaded media file and the name of a rendered output file
//! (templates: `isMediaName` in `src/core/streamerPath.ts`, `isOutputName` in `server/render.ts`).

use std::fmt;

use serde::{Deserialize, Serialize};

use crate::error::InvalidValue;
use crate::identity::values::string_value;

/// Known media extensions, compared without case
const MEDIA_EXTENSIONS: [&str; 11] = [
    "gif", "png", "jpg", "jpeg", "webp", "svg", "mp4", "webm", "mp3", "wav", "ogg",
];
/// At most this many characters before the extension
const MEDIA_STEM_MAX: usize = 100;
/// Files a render produces: the stinger video, the banner GIFs and their still images
pub const OUTPUT_NAMES: [&str; 5] = [
    "stinger.webm",
    "profile.gif",
    "profile.png",
    "offline.gif",
    "offline.png",
];

const fn is_word(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

/// Name of a media file: a simple name without path that starts with a letter, digit or underscore, followed by
/// letters, digits, `_`, space, `(`, `)` and `-` (at most 100 characters), and a known extension.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct MediaName(String);

impl MediaName {
    /// # Errors
    /// When the name has a path, a hidden or unknown extension, invalid characters or is too long.
    pub fn parse(value: &str) -> Result<Self, InvalidValue> {
        let invalid = InvalidValue::new("media name");
        let (stem, extension) = value.rsplit_once('.').ok_or(invalid)?;
        let known = MEDIA_EXTENSIONS
            .iter()
            .any(|known| known.eq_ignore_ascii_case(extension));
        let bytes = stem.as_bytes();
        let valid_stem = bytes.first().is_some_and(|first| is_word(*first))
            && bytes.len() <= MEDIA_STEM_MAX
            && bytes.iter().all(|byte| is_word(*byte) || b" ()-".contains(byte));
        if known && valid_stem {
            Ok(Self(value.to_owned()))
        } else {
            Err(invalid)
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Name of a rendered output file, one of [`OUTPUT_NAMES`].
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct OutputName(String);

impl OutputName {
    /// # Errors
    /// When the name is not one of the render outputs.
    pub fn parse(value: &str) -> Result<Self, InvalidValue> {
        if OUTPUT_NAMES.contains(&value) {
            Ok(Self(value.to_owned()))
        } else {
            Err(InvalidValue::new("output name"))
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

string_value!(MediaName);
string_value!(OutputName);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn media_name_accepts_simple_names() {
        for value in ["a.png", "lizard.gif", "Lizard (2).MP4", "my lizard.webm", "x_1-2.jpeg"] {
            assert!(MediaName::parse(value).is_ok(), "{value}");
        }
        assert!(MediaName::parse(&format!("{}.png", "a".repeat(100))).is_ok());
    }

    #[test]
    fn media_name_rejects_paths_hidden_and_unknown() {
        let too_long = format!("{}.png", "a".repeat(101));
        for value in [
            "",
            "../a.png",
            "a/b.png",
            "a\\b.png",
            "a.exe",
            "lizard.html",
            ".hidden.png",
            "a.b.png",
            "png",
            &too_long,
        ] {
            assert!(MediaName::parse(value).is_err(), "{value}");
        }
    }

    #[test]
    fn output_name_only_render_outputs() {
        for value in OUTPUT_NAMES {
            assert!(OutputName::parse(value).is_ok(), "{value}");
        }
        for value in ["stinger.gif", "tokens.json", "../profile.gif", ""] {
            assert!(OutputName::parse(value).is_err(), "{value}");
        }
    }

    #[test]
    fn deserialize_rejects_invalid() {
        assert!(serde_json::from_str::<MediaName>("\"../a.png\"").is_err());
        assert!(serde_json::from_str::<OutputName>("\"x.gif\"").is_err());
        assert!(serde_json::from_str::<MediaName>("\"a.png\"").is_ok());
    }
}
