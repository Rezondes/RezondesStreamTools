//! Validation of setting values against a theme schema and resolving of saved values (template:
//! `src/core/settings.ts`). Input is arbitrary JSON from the dashboard or an old file; text lengths count UTF-16
//! code units like the browser.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use ts_rs::TS;

use crate::media::values::MediaName;
use crate::settings::field::{
    FieldKind, MediaKind, SettingField, SettingValue, SettingValues, SoundValue,
};
use crate::themes::schema::ThemeSchema;

/// Limit of texts and lines without an own maximum
const TEXT_LIMIT: usize = 2000;
const LINE_LIMIT: usize = 200;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum SettingErrorCode {
    InvalidType,
    InvalidColor,
    OutOfRange,
    TooLong,
    TooManyLines,
    UnknownOption,
    InvalidMedia,
}

/// Error of one field; `key` is empty when the whole input is not an object
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct SettingError {
    pub key: String,
    pub code: SettingErrorCode,
}

/// Result of a validation: resolved values without the invalid ones, and the errors in field order
#[derive(Debug, Clone, PartialEq)]
pub struct Validated {
    pub values: SettingValues,
    pub errors: Vec<SettingError>,
}

fn utf16_len(value: &str) -> usize {
    value.encode_utf16().count()
}

/// `^#[0-9a-f]{6}([0-9a-f]{2})?$`, case-insensitive
fn is_color(value: &str) -> bool {
    value.strip_prefix('#').is_some_and(|hex| {
        (hex.len() == 6 || hex.len() == 8) && hex.bytes().all(|byte| byte.is_ascii_hexdigit())
    })
}

fn extensions(kind: MediaKind) -> &'static [&'static str] {
    match kind {
        MediaKind::Image => &["gif", "png", "jpg", "jpeg", "webp", "svg"],
        MediaKind::Video => &["mp4", "webm"],
        MediaKind::Audio => &["mp3", "wav", "ogg"],
    }
}

/// Empty = no media; otherwise an allowed file name of the matching kind
fn check_media(value: &Value, kind: MediaKind) -> Option<SettingErrorCode> {
    let Value::String(name) = value else {
        return Some(SettingErrorCode::InvalidType);
    };
    if name.is_empty() {
        return None;
    }
    let extension = name.rsplit_once('.').map_or("", |(_, extension)| extension);
    let matches = extensions(kind)
        .iter()
        .any(|known| known.eq_ignore_ascii_case(extension));
    if MediaName::parse(name).is_ok() && matches {
        None
    } else {
        Some(SettingErrorCode::InvalidMedia)
    }
}

fn check_text(value: &Value, limit: usize) -> Option<SettingErrorCode> {
    match value {
        Value::String(text) if utf16_len(text) > limit => Some(SettingErrorCode::TooLong),
        Value::String(_) => None,
        _ => Some(SettingErrorCode::InvalidType),
    }
}

fn check_lines(value: &Value, max_lines: usize) -> Option<SettingErrorCode> {
    let Some(lines) = value
        .as_array()
        .and_then(|items| items.iter().map(Value::as_str).collect::<Option<Vec<_>>>())
    else {
        return Some(SettingErrorCode::InvalidType);
    };
    if lines.len() > max_lines {
        return Some(SettingErrorCode::TooManyLines);
    }
    lines
        .iter()
        .any(|line| utf16_len(line) > TEXT_LIMIT)
        .then_some(SettingErrorCode::TooLong)
}

fn check_sound(value: &Value) -> Option<SettingErrorCode> {
    let Some(volume) = value
        .get("volume")
        .and_then(Value::as_f64)
        .filter(|_| value.is_object())
    else {
        return Some(SettingErrorCode::InvalidType);
    };
    check_media(value.get("file").unwrap_or(&Value::Null), MediaKind::Audio)
        .or_else(|| (!(0.0..=1.0).contains(&volume)).then_some(SettingErrorCode::OutOfRange))
}

fn limit(value: Option<u32>, fallback: usize) -> usize {
    value.map_or(fallback, |limit| {
        usize::try_from(limit).unwrap_or(usize::MAX)
    })
}

/// Error code for a value, `None` if it is valid
fn check_value(field: &SettingField, value: &Value) -> Option<SettingErrorCode> {
    match &field.kind {
        FieldKind::Color { .. } => match value {
            Value::String(color) => (!is_color(color)).then_some(SettingErrorCode::InvalidColor),
            _ => Some(SettingErrorCode::InvalidType),
        },
        FieldKind::Text { max_length, .. } | FieldKind::Textarea { max_length, .. } => {
            check_text(value, limit(*max_length, TEXT_LIMIT))
        }
        FieldKind::Lines { max_lines, .. } => check_lines(value, limit(*max_lines, LINE_LIMIT)),
        FieldKind::Number { min, max, .. } => match value.as_f64() {
            Some(number) => {
                (number < *min || number > *max).then_some(SettingErrorCode::OutOfRange)
            }
            None => Some(SettingErrorCode::InvalidType),
        },
        FieldKind::Boolean { .. } => (!value.is_boolean()).then_some(SettingErrorCode::InvalidType),
        FieldKind::Select { options, .. } | FieldKind::Font { options, .. } => match value {
            Value::String(option) => {
                (!options.contains(option)).then_some(SettingErrorCode::UnknownOption)
            }
            _ => Some(SettingErrorCode::InvalidType),
        },
        FieldKind::Media { accept, .. } => check_media(value, *accept),
        FieldKind::Sound { .. } => check_sound(value),
    }
}

/// A valid JSON value as the setting value of its field
fn to_setting(field: &SettingField, value: &Value) -> SettingValue {
    match (&field.kind, value) {
        (FieldKind::Number { .. }, Value::Number(number)) => {
            SettingValue::Number(number.as_f64().unwrap_or_default())
        }
        (FieldKind::Boolean { .. }, Value::Bool(flag)) => SettingValue::Flag(*flag),
        (FieldKind::Lines { .. }, Value::Array(items)) => SettingValue::Lines(
            items
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect(),
        ),
        (FieldKind::Sound { .. }, sound) => SettingValue::Sound(SoundValue {
            file: sound
                .get("file")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned(),
            volume: sound.get("volume").and_then(Value::as_f64).unwrap_or(1.0),
        }),
        (_, Value::String(text)) => SettingValue::Text(text.clone()),
        _ => field.default_value(),
    }
}

/// One value per field: saved and valid, otherwise the default. Foreign keys drop out.
#[must_use]
pub fn resolve_settings(schema: &ThemeSchema, stored: &Value) -> SettingValues {
    let empty = Map::new();
    let source = stored.as_object().unwrap_or(&empty);
    schema
        .fields
        .iter()
        .map(|field| {
            let value = source
                .get(&field.key)
                .filter(|value| check_value(field, value).is_none());
            (
                field.key.clone(),
                value.map_or_else(|| field.default_value(), |value| to_setting(field, value)),
            )
        })
        .collect()
}

/// Validates input: errors per invalid field (only for present keys), values = resolved without the invalid ones
#[must_use]
pub fn validate_settings(schema: &ThemeSchema, input: &Value) -> Validated {
    let Some(object) = input.as_object() else {
        let error = SettingError {
            key: String::new(),
            code: SettingErrorCode::InvalidType,
        };
        return Validated {
            values: resolve_settings(schema, &Value::Null),
            errors: vec![error],
        };
    };
    let errors = schema
        .fields
        .iter()
        .filter_map(|field| {
            let code = check_value(field, object.get(&field.key)?)?;
            Some(SettingError {
                key: field.key.clone(),
                code,
            })
        })
        .collect();
    Validated {
        values: resolve_settings(schema, input),
        errors,
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::json;

    use super::*;
    use crate::settings::field::{
        Unit, choice, color, flag, font, lines, media, number, sound, text,
    };

    fn probe() -> ThemeSchema {
        ThemeSchema {
            id: "probe".to_owned(),
            name: "Probe".to_owned(),
            fields: vec![
                color("accent", "Color", "General", "#39ff14"),
                text("title", "Title", "General", "HELLO", Some(10)),
                lines("lines", "Lines", "Terminal", &["a"], Some(2)),
                number(
                    "size",
                    "Size",
                    "General",
                    10.0,
                    0.0,
                    100.0,
                    Some(Unit::Px),
                    None,
                ),
                flag("glow", "Glow", "General", true),
                choice("art", "Display", "Music", "cover", &["cover", "vinyl"]),
                font(
                    "font",
                    "Font",
                    "General",
                    "Share Tech Mono",
                    &["Share Tech Mono", "VT323"],
                ),
                media("logo", "Logo", "General", MediaKind::Image),
                sound("ping", "Sound", "Alerts"),
            ],
            group_scenes: BTreeMap::new(),
            minime_variants: None,
        }
    }

    fn codes(validated: &Validated) -> Vec<String> {
        let code = |error: &SettingError| {
            serde_json::to_value(error.code)
                .expect("code")
                .as_str()
                .unwrap_or_default()
                .to_owned()
        };
        validated
            .errors
            .iter()
            .map(|error| format!("{}:{}", error.key, code(error)))
            .collect()
    }

    #[test]
    fn resolve_keeps_valid_values_and_drops_foreign_keys() {
        let resolved = resolve_settings(
            &probe(),
            &json!({ "accent": "#ff0000", "title": 42, "stranger": "x" }),
        );
        assert_eq!(
            resolved.get("accent"),
            Some(&SettingValue::Text("#ff0000".to_owned()))
        );
        assert_eq!(
            resolved.get("title"),
            Some(&SettingValue::Text("HELLO".to_owned()))
        );
        assert_eq!(resolved.get("size"), Some(&SettingValue::Number(10.0)));
        assert!(!resolved.contains_key("stranger"));
        assert_eq!(resolved.len(), probe().fields.len());
    }

    #[test]
    fn broken_store_gives_only_defaults() {
        assert_eq!(
            resolve_settings(&probe(), &json!("broken")),
            resolve_settings(&probe(), &json!({}))
        );
    }

    #[test]
    fn one_valid_value_per_field_type() {
        let input = json!({
            "accent": "#00ff00aa", "title": "OK", "lines": ["x", "y"], "size": 99, "glow": false, "art": "vinyl",
            "font": "VT323", "logo": "logo.png", "ping": { "file": "ping.mp3", "volume": 0.5 }
        });
        let good = validate_settings(&probe(), &input);
        assert!(good.errors.is_empty(), "{:?}", good.errors);
        assert_eq!(
            good.values.get("art"),
            Some(&SettingValue::Text("vinyl".to_owned()))
        );
        let ping = SoundValue {
            file: "ping.mp3".to_owned(),
            volume: 0.5,
        };
        assert_eq!(good.values.get("ping"), Some(&SettingValue::Sound(ping)));
    }

    #[test]
    fn one_invalid_value_per_field_type() {
        let input = json!({
            "accent": "green", "title": "MUCH TOO LONG TITLE", "lines": ["1", "2", "3"], "size": 101, "glow": "yes",
            "art": "disco", "font": "Comic Sans", "logo": "../x.png", "ping": { "file": "a.mp3", "volume": 2 }
        });
        let bad = validate_settings(&probe(), &input);
        assert_eq!(
            codes(&bad),
            [
                "accent:invalid_color",
                "title:too_long",
                "lines:too_many_lines",
                "size:out_of_range",
                "glow:invalid_type",
                "art:unknown_option",
                "font:unknown_option",
                "logo:invalid_media",
                "ping:out_of_range",
            ]
        );
        assert_eq!(
            bad.values.get("accent"),
            Some(&SettingValue::Text("#39ff14".to_owned()))
        );
    }

    #[test]
    fn media_only_of_the_matching_kind_and_empty_is_none() {
        assert_eq!(
            codes(&validate_settings(&probe(), &json!({ "logo": "clip.mp4" }))),
            ["logo:invalid_media"]
        );
        assert!(
            validate_settings(&probe(), &json!({ "logo": "" }))
                .errors
                .is_empty()
        );
    }

    #[test]
    fn wrong_types_inside_lines_and_sound_and_utf16_lengths() {
        let input =
            json!({ "lines": [1], "ping": { "file": 3, "volume": 0.5 }, "title": "é".repeat(10) });
        assert_eq!(
            codes(&validate_settings(&probe(), &input)),
            ["lines:invalid_type", "ping:invalid_type"]
        );
        assert_eq!(
            codes(&validate_settings(&probe(), &json!({ "ping": "x" }))),
            ["ping:invalid_type"]
        );
        assert_eq!(
            codes(&validate_settings(
                &probe(),
                &json!({ "title": "😀".repeat(6) })
            )),
            ["title:too_long"]
        );
    }

    #[test]
    fn not_an_object_is_one_error_for_the_whole() {
        let validated = validate_settings(&probe(), &json!([1, 2]));
        assert_eq!(
            validated.errors,
            vec![SettingError {
                key: String::new(),
                code: SettingErrorCode::InvalidType
            }]
        );
    }

    #[test]
    fn defaults_of_all_building_blocks_pass() {
        let schema = probe();
        let defaults: Map<String, Value> = schema
            .fields
            .iter()
            .map(|field| {
                (
                    field.key.clone(),
                    serde_json::to_value(field.default_value()).expect("default"),
                )
            })
            .collect();
        assert!(
            validate_settings(&schema, &Value::Object(defaults))
                .errors
                .is_empty()
        );
    }
}
