//! Field types of theme settings and the building blocks theme schemas are written with (templates: the
//! `SettingField` union in `src/core/theme.ts`, `src/core/fields.ts`). Serialized like the TypeScript union: one
//! object with `key`, `type`, `label`, `group` and the fields of its type.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::themes::schema::SceneName;

/// Sound: own file from the media (`file`) or empty = built-in sound of the theme; volume 0 to 1
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct SoundValue {
    pub file: String,
    pub volume: f64,
}

/// A resolved setting value
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(untagged)]
pub enum SettingValue {
    Flag(bool),
    Number(f64),
    Text(String),
    Lines(#[ts(type = "readonly string[]")] Vec<String>),
    Sound(SoundValue),
}

/// Resolved values of a theme, one per field key
pub type SettingValues = BTreeMap<String, SettingValue>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
pub enum Unit {
    #[serde(rename = "px")]
    Px,
    #[serde(rename = "ms")]
    Ms,
    #[serde(rename = "s")]
    S,
    #[serde(rename = "%")]
    Percent,
}

/// Kind of media a media field accepts
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum MediaKind {
    Image,
    Video,
    Audio,
}

/// The type of a field with its default and limits
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum FieldKind {
    Color {
        default: String,
    },
    Text {
        default: String,
        #[serde(rename = "maxLength", default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        max_length: Option<u32>,
    },
    /// `ascii`: the dashboard offers the ASCII logo generator for it
    Textarea {
        default: String,
        #[serde(rename = "maxLength", default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        max_length: Option<u32>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        ascii: Option<bool>,
    },
    Lines {
        default: Vec<String>,
        #[serde(rename = "maxLines", default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        max_lines: Option<u32>,
    },
    Number {
        default: f64,
        min: f64,
        max: f64,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        step: Option<f64>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        unit: Option<Unit>,
    },
    Boolean {
        default: bool,
    },
    /// `optionsBy`: the dashboard offers only the options for the value of another field (a coat for a breed);
    /// options holds all of them, so every one of them stays valid
    Select {
        default: String,
        options: Vec<String>,
        #[serde(rename = "optionsBy", default, skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        options_by: Option<OptionsBy>,
    },
    Font {
        default: String,
        options: Vec<String>,
    },
    Media {
        default: String,
        accept: MediaKind,
    },
    Sound {
        default: SoundValue,
    },
}

/// The options of a select field per value of another field (`field`)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct OptionsBy {
    pub field: String,
    pub options: BTreeMap<String, Vec<String>>,
}

/// A field of a theme schema: key, label and group (section in the form), optionally the one scene it affects
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct SettingField {
    pub key: String,
    pub label: String,
    pub group: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub scene: Option<SceneName>,
    /// Shown in the simple view of the dashboard (the few settings most streamers change); only the form reads it
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    #[ts(as = "Option<bool>", optional)]
    pub basic: bool,
    /// Key of the field whose value applies while this one is empty, e.g. a text color of the accent
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub inherit: Option<String>,
    #[serde(flatten)]
    pub kind: FieldKind,
}

impl SettingField {
    /// The default value of this field
    #[must_use]
    pub fn default_value(&self) -> SettingValue {
        match &self.kind {
            FieldKind::Color { default }
            | FieldKind::Text { default, .. }
            | FieldKind::Textarea { default, .. }
            | FieldKind::Select { default, .. }
            | FieldKind::Font { default, .. }
            | FieldKind::Media { default, .. } => SettingValue::Text(default.clone()),
            FieldKind::Lines { default, .. } => SettingValue::Lines(default.clone()),
            FieldKind::Number { default, .. } => SettingValue::Number(*default),
            FieldKind::Boolean { default } => SettingValue::Flag(*default),
            FieldKind::Sound { default } => SettingValue::Sound(default.clone()),
        }
    }

    /// Replaces the default with `value` when it has the type of the field; a value of another type is ignored
    pub fn set_default(&mut self, value: &SettingValue) {
        match (&mut self.kind, value) {
            (
                FieldKind::Color { default }
                | FieldKind::Text { default, .. }
                | FieldKind::Textarea { default, .. }
                | FieldKind::Select { default, .. }
                | FieldKind::Font { default, .. }
                | FieldKind::Media { default, .. },
                SettingValue::Text(text),
            ) => default.clone_from(text),
            (FieldKind::Lines { default, .. }, SettingValue::Lines(lines)) => default.clone_from(lines),
            (FieldKind::Number { default, .. }, SettingValue::Number(number)) => *default = *number,
            (FieldKind::Boolean { default }, SettingValue::Flag(flag)) => *default = *flag,
            (FieldKind::Sound { default }, SettingValue::Sound(sound)) => default.clone_from(sound),
            _ => {}
        }
    }
}

fn field(key: &str, label: &str, group: &str, kind: FieldKind) -> SettingField {
    SettingField {
        key: key.to_owned(),
        label: label.to_owned(),
        group: group.to_owned(),
        scene: None,
        basic: false,
        inherit: None,
        kind,
    }
}

fn strings(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| (*value).to_owned()).collect()
}

#[must_use]
pub fn color(key: &str, label: &str, group: &str, value: &str) -> SettingField {
    field(key, label, group, FieldKind::Color { default: value.to_owned() })
}

/// Single-line text, at most `max_length` characters (default 200)
#[must_use]
pub fn text(key: &str, label: &str, group: &str, value: &str, max_length: Option<u32>) -> SettingField {
    field(key, label, group, FieldKind::Text { default: value.to_owned(), max_length: Some(max_length.unwrap_or(200)) })
}

/// Multi-line text, at most `max_length` characters (default 4000)
#[must_use]
pub fn textarea(key: &str, label: &str, group: &str, value: &str, max_length: Option<u32>) -> SettingField {
    let kind =
        FieldKind::Textarea { default: value.to_owned(), max_length: Some(max_length.unwrap_or(4000)), ascii: None };
    field(key, label, group, kind)
}

/// Multi-line text for ASCII art; the dashboard offers a generator from a name
#[must_use]
pub fn ascii_art(key: &str, label: &str, group: &str, value: &str, max_length: Option<u32>) -> SettingField {
    let kind = FieldKind::Textarea {
        default: value.to_owned(),
        max_length: Some(max_length.unwrap_or(4000)),
        ascii: Some(true),
    };
    field(key, label, group, kind)
}

/// Lines, at most `max_lines` (default 100)
#[must_use]
pub fn lines(key: &str, label: &str, group: &str, value: &[&str], max_lines: Option<u32>) -> SettingField {
    field(key, label, group, FieldKind::Lines { default: strings(value), max_lines: Some(max_lines.unwrap_or(100)) })
}

#[must_use]
pub fn flag(key: &str, label: &str, group: &str, value: bool) -> SettingField {
    field(key, label, group, FieldKind::Boolean { default: value })
}

/// Sound: without a file the theme plays its built-in sound (or none)
#[must_use]
pub fn sound(key: &str, label: &str, group: &str) -> SettingField {
    field(key, label, group, FieldKind::Sound { default: SoundValue { file: String::new(), volume: 1.0 } })
}

#[must_use]
pub fn choice(key: &str, label: &str, group: &str, value: &str, options: &[&str]) -> SettingField {
    field(
        key,
        label,
        group,
        FieldKind::Select { default: value.to_owned(), options: strings(options), options_by: None },
    )
}

/// Select whose offered options depend on the value of another field (by: that value and its options); its options
/// are all of them in order of first appearance
#[must_use]
pub fn choice_by(
    key: &str,
    label: &str,
    group: &str,
    value: &str,
    other: &str,
    by: &[(&str, &[&str])],
) -> SettingField {
    let mut options: Vec<String> = Vec::new();
    for option in by.iter().flat_map(|(_, list)| list.iter()) {
        if !options.iter().any(|known| known == option) {
            options.push((*option).to_owned());
        }
    }
    let options_by = OptionsBy {
        field: other.to_owned(),
        options: by.iter().map(|(value, list)| ((*value).to_owned(), strings(list))).collect(),
    };
    field(key, label, group, FieldKind::Select { default: value.to_owned(), options, options_by: Some(options_by) })
}

#[must_use]
pub fn font(key: &str, label: &str, group: &str, value: &str, options: &[&str]) -> SettingField {
    field(key, label, group, FieldKind::Font { default: value.to_owned(), options: strings(options) })
}

/// Media file of one kind; empty default = no media
#[must_use]
pub fn media(key: &str, label: &str, group: &str, accept: MediaKind) -> SettingField {
    field(key, label, group, FieldKind::Media { default: String::new(), accept })
}

/// Number from `min` to `max`, optionally with unit and step
#[must_use]
#[expect(clippy::too_many_arguments, reason = "mirrors the number() building block of the theme schemas")]
pub fn number(
    key: &str,
    label: &str,
    group: &str,
    value: f64,
    min: f64,
    max: f64,
    unit: Option<Unit>,
    step: Option<f64>,
) -> SettingField {
    field(key, label, group, FieldKind::Number { default: value, min, max, step, unit })
}

impl SettingField {
    /// The same field with another default (a theme sets the defaults of shared fields); a value of the wrong type
    /// leaves the field unchanged, the limits always stay
    #[must_use]
    pub fn with_default(mut self, value: &SettingValue) -> Self {
        match (&mut self.kind, value) {
            (
                FieldKind::Color { default }
                | FieldKind::Text { default, .. }
                | FieldKind::Textarea { default, .. }
                | FieldKind::Select { default, .. }
                | FieldKind::Font { default, .. }
                | FieldKind::Media { default, .. },
                SettingValue::Text(text),
            ) => text.clone_into(default),
            (FieldKind::Number { default, .. }, SettingValue::Number(number)) => *default = *number,
            (FieldKind::Boolean { default }, SettingValue::Flag(flag)) => *default = *flag,
            (FieldKind::Lines { default, .. }, SettingValue::Lines(lines)) => lines.clone_into(default),
            (FieldKind::Sound { default }, SettingValue::Sound(sound)) => *default = sound.clone(),
            _ => {}
        }
        self
    }
}

/// Fields with the defaults of a theme by key (template: `withDefaults` in `src/core/fields.ts`)
#[must_use]
pub fn with_defaults(fields: Vec<SettingField>, defaults: &[(&str, SettingValue)]) -> Vec<SettingField> {
    fields
        .into_iter()
        .map(|field| match defaults.iter().find(|(key, _)| *key == field.key) {
            Some((_, value)) => field.with_default(value),
            None => field,
        })
        .collect()
}

/// Field that only affects one scene: the dashboard shows it only there
#[must_use]
pub fn in_scene(scene: SceneName, field: SettingField) -> SettingField {
    SettingField { scene: Some(scene), ..field }
}

/// The fields of a theme with its simple view listed in one place (template: `markBasic` in `src/core/fields.ts`; a
/// key without a field shows up in the fixture comparison)
#[must_use]
pub fn mark_basic(fields: Vec<SettingField>, keys: &[&str]) -> Vec<SettingField> {
    fields.into_iter().map(|field| if keys.contains(&field.key.as_str()) { basic(field) } else { field }).collect()
}

/// Field that takes the value of the field `parent` while it is empty (template: `inherits` in `src/core/fields.ts`):
/// the theme value by default, its own once set
#[must_use]
pub fn inherits(field: SettingField, parent: &str) -> SettingField {
    SettingField { inherit: Some(parent.to_owned()), ..field }.with_default(&SettingValue::Text(String::new()))
}

/// Parent of a field that follows its surroundings while empty (template: `SURROUNDING` in `src/core/fields.ts`): it gets
/// no value, so the element keeps the color or font of the part around it
pub const SURROUNDING: &str = "";

/// Field that follows its surroundings while empty (template: `follows` in `src/core/fields.ts`)
#[must_use]
pub fn follows(field: SettingField) -> SettingField {
    inherits(field, SURROUNDING)
}

/// Field of the simple view in the dashboard (template: `basic` in `src/core/fields.ts`)
#[must_use]
pub fn basic(field: SettingField) -> SettingField {
    SettingField { basic: true, ..field }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn number_keeps_limits_and_drops_missing_unit_and_step() {
        let size = number("size", "Size", "A", 10.0, 0.0, 100.0, Some(Unit::Px), Some(0.5));
        let expected = json!({ "key": "size", "type": "number", "label": "Size", "group": "A", "default": 10.0, "min": 0.0, "max": 100.0, "unit": "px", "step": 0.5 });
        assert_eq!(serde_json::to_value(&size).expect("serialize"), expected);
        let count = number("count", "Count", "A", 3.0, 1.0, 9.0, None, None);
        let expected = json!({ "key": "count", "type": "number", "label": "Count", "group": "A", "default": 3.0, "min": 1.0, "max": 9.0 });
        assert_eq!(serde_json::to_value(&count).expect("serialize"), expected);
    }

    #[test]
    fn sound_default_is_silent_file_at_full_volume() {
        assert_eq!(
            sound("beep", "Sound", "A").default_value(),
            SettingValue::Sound(SoundValue { file: String::new(), volume: 1.0 })
        );
    }

    #[test]
    fn ascii_art_is_a_textarea_with_generator_flag() {
        let banner = ascii_art("banner", "Banner", "A", "X", None);
        let expected = json!({ "key": "banner", "type": "textarea", "label": "Banner", "group": "A", "default": "X", "maxLength": 4000, "ascii": true });
        assert_eq!(serde_json::to_value(&banner).expect("serialize"), expected);
    }

    #[test]
    fn in_scene_only_adds_the_scene() {
        let title = text("brbTitle", "Title", "A", "BREAK", None);
        let scoped = in_scene(SceneName::Brb, title.clone());
        assert_eq!(scoped, SettingField { scene: Some(SceneName::Brb), ..title });
        assert_eq!(serde_json::to_value(&scoped).expect("serialize")["scene"], json!("brb"));
    }

    #[test]
    fn basic_only_adds_the_flag() {
        let title = text("title", "Title", "A", "Hello", None);
        assert_eq!(basic(title.clone()), SettingField { basic: true, ..title });
        let name = inherits(color("nameColor", "Name", "Texte", "#ffffff"), "accent");
        assert_eq!(
            (name.inherit.as_deref(), name.default_value()),
            (Some("accent"), SettingValue::Text(String::new()))
        );
    }

    #[test]
    fn mark_basic_marks_only_the_listed_keys() {
        let fields = mark_basic(vec![color("a", "A", "G", "#000000"), flag("b", "B", "G", true)], &["b"]);
        assert_eq!(fields.iter().map(|field| field.basic).collect::<Vec<_>>(), vec![false, true]);
    }

    #[test]
    fn basic_is_written_only_when_set() {
        let plain = color("accent", "Color", "A", "#39ff14");
        assert!(serde_json::to_value(&plain).expect("serialize").get("basic").is_none());
        assert_eq!(serde_json::to_value(basic(plain.clone())).expect("serialize")["basic"], json!(true));
        let read: SettingField =
            serde_json::from_value(serde_json::to_value(&plain).expect("serialize")).expect("deserialize");
        assert!(!read.basic);
    }

    #[test]
    fn fields_round_trip_as_json() {
        let fields = vec![
            color("accent", "Color", "A", "#39ff14"),
            lines("terminal", "Lines", "A", &["a", "b"], None),
            choice("align", "Position", "A", "center", &["left", "center"]),
            font("font", "Font", "A", "VT323", &["VT323", "Fira Mono"]),
            media("logo", "Logo", "A", MediaKind::Image),
            flag("glow", "Glow", "A", true),
        ];
        let json = serde_json::to_string(&fields).expect("serialize");
        assert_eq!(serde_json::from_str::<Vec<SettingField>>(&json).expect("deserialize"), fields);
    }
}
