//! Shared stinger fields of every theme: frame rate, hold at the transition point, motion curve and output size
//! (template: `stingerFields` in `src/core/stingerOptions.ts`). Labels are the German UI texts. The server checks only
//! ranges and choices; the drawing with the options happens in the dashboard.

use crate::settings::field::{SettingField, Unit, choice, number};

/// Motion curves of the stinger (`EASE_CHOICES` in `src/core/motion/ease.ts`)
const EASES: [&str; 5] = ["linear", "nagel", "federnd", "weich", "stempel"];
const SIZES: [&str; 2] = ["1080p", "720p"];

/// The four stinger fields in this order; defaults for frame rate and hold per theme
#[must_use]
pub fn stinger_fields(group: &str, fps_default: f64, hold_default: f64) -> Vec<SettingField> {
    vec![
        number("stingerFps", "Bildrate (Bilder pro Sekunde)", group, fps_default, 10.0, 60.0, None, None),
        number(
            "stingerHold",
            "Pause am Übergangspunkt (Anteil je Hälfte)",
            group,
            hold_default,
            0.0,
            80.0,
            Some(Unit::Percent),
            None,
        ),
        choice("stingerEase", "Bewegungskurve", group, "linear", &EASES),
        choice("stingerSize", "Ausgabegrösse", group, "1080p", &SIZES),
    ]
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::json;

    use super::*;
    use crate::settings::validate::validate_settings;
    use crate::themes::schema::ThemeSchema;

    #[test]
    fn rejects_out_of_range() {
        let schema = ThemeSchema {
            id: "probe".to_owned(),
            name: "Probe".to_owned(),
            fields: stinger_fields("Stinger", 30.0, 20.0),
            group_scenes: BTreeMap::new(),
            minime_variants: None,
            minime_teams: None,
        };
        let bad = validate_settings(
            &schema,
            &json!({ "stingerFps": 5, "stingerHold": 90, "stingerEase": "zack", "stingerSize": "4k" }),
        );
        let keys: Vec<&str> = bad.errors.iter().map(|error| error.key.as_str()).collect();
        assert_eq!(keys, ["stingerFps", "stingerHold", "stingerEase", "stingerSize"]);
        let good = validate_settings(
            &schema,
            &json!({ "stingerFps": 24, "stingerHold": 0, "stingerEase": "stempel", "stingerSize": "720p" }),
        );
        assert!(good.errors.is_empty(), "{:?}", good.errors);
    }

    #[test]
    fn fields_and_defaults() {
        let fields = stinger_fields("Stinger", 60.0, 0.0);
        let keys: Vec<&str> = fields.iter().map(|field| field.key.as_str()).collect();
        assert_eq!(keys, ["stingerFps", "stingerHold", "stingerEase", "stingerSize"]);
        assert!(fields.iter().all(|field| field.group == "Stinger"));
    }
}
