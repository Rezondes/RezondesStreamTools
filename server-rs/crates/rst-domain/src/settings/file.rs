//! The settings of a streamer (template: `server/settings.ts`): the chosen theme and the stored values per theme, so
//! a theme switch loses nothing. Values are checked against the schema of their theme.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use ts_rs::TS;

use crate::identity::values::Login;
use crate::minimes::rules::{MinimeRules, minime_rules};
use crate::settings::field::SettingValues;
use crate::settings::validate::{SettingError, SettingErrorCode, resolve_settings, validate_settings};
use crate::themes::minime_fields::has_minimes;
use crate::themes::registry::{DEFAULT_THEME, Theme, find, themes};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SettingsFile {
    pub theme: String,
    pub values: BTreeMap<String, Map<String, Value>>,
}

/// What overlays see: the chosen theme with resolved values, nothing foreign and nothing secret
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct PublicSettings {
    pub theme: String,
    pub values: SettingValues,
}

/// Old theme IDs from saved files and their current name (`starter` is called `standard` since RST, `suedfrucht` is
/// called `urlaub` since its minimes are beach things)
fn current_id(id: &str) -> &str {
    match id {
        "starter" => "standard",
        "suedfrucht" => "urlaub",
        other => other,
    }
}

fn default_theme() -> &'static Theme {
    find(DEFAULT_THEME).unwrap_or_else(|| unreachable!("the default theme is built in"))
}

/// Defaults a theme has changed: theme, key, old default, new default. Whoever still has the old default stored gets
/// the new one when reading; values chosen by the streamer stay. Entries come with the theme plan that needs them.
type OldDefault = (&'static str, &'static str, &'static str, &'static str);
const OLD_DEFAULTS: &[OldDefault] = &[];

/// Brings stored settings into valid shape: old IDs are renamed, an unknown theme becomes the default, values only
/// as objects per theme, old defaults become the current ones
#[must_use]
pub fn parse_settings_file(raw: &Value) -> SettingsFile {
    parse_with_old_defaults(raw, OLD_DEFAULTS)
}

fn parse_with_old_defaults(raw: &Value, old_defaults: &[OldDefault]) -> SettingsFile {
    let named = raw.get("theme").and_then(Value::as_str).map(current_id).unwrap_or_default();
    let theme = if find(named).is_some() { named } else { DEFAULT_THEME };
    let mut values: BTreeMap<String, Map<String, Value>> = raw
        .get("values")
        .and_then(Value::as_object)
        .map(|values| {
            values
                .iter()
                .filter_map(|(id, stored)| Some((current_id(id).to_owned(), stored.as_object()?.clone())))
                .collect()
        })
        .unwrap_or_default();
    for (theme, key, old, new) in old_defaults {
        if let Some(stored) = values.get_mut(*theme)
            && stored.get(*key).and_then(Value::as_str) == Some(*old)
        {
            stored.insert((*key).to_owned(), Value::String((*new).to_owned()));
        }
    }
    SettingsFile { theme: theme.to_owned(), values }
}

fn stored_values(file: &SettingsFile, id: &str) -> Value {
    file.values.get(id).map_or(Value::Null, |values| Value::Object(values.clone()))
}

#[must_use]
pub fn public_settings(file: &SettingsFile) -> PublicSettings {
    let theme = find(&file.theme).unwrap_or_else(default_theme);
    PublicSettings {
        theme: theme.schema.id.clone(),
        values: resolve_settings(&theme.schema, &stored_values(file, &theme.schema.id)),
    }
}

/// Minime rules from the values of the chosen theme (with its variants); `None` if the theme has no minimes
#[must_use]
pub fn minime_rules_of(file: &SettingsFile) -> Option<MinimeRules> {
    let theme = find(&file.theme).unwrap_or_else(default_theme);
    let schema = &theme.schema;
    has_minimes(&schema.fields).then(|| {
        minime_rules(&stored_values(file, &schema.id), schema.minime_variants.as_ref(), schema.minime_teams.as_ref())
    })
}

/// Sets the values of a theme and, with `choose`, selects it as the overlay theme. Only error-free input gives a
/// new file.
///
/// # Errors
/// The errors of the input, or `theme`/`unknown_option` for an unknown theme.
pub fn update_settings(
    file: &SettingsFile,
    theme: &str,
    input: &Value,
    choose: bool,
) -> Result<SettingsFile, Vec<SettingError>> {
    let Some(found) = find(theme) else {
        return Err(vec![SettingError { key: "theme".to_owned(), code: SettingErrorCode::UnknownOption }]);
    };
    let checked = validate_settings(&found.schema, input);
    if !checked.errors.is_empty() {
        return Err(checked.errors);
    }
    let values = match serde_json::to_value(&checked.values) {
        Ok(Value::Object(values)) => values,
        _ => Map::new(),
    };
    let mut next = file.clone();
    next.values.insert(theme.to_owned(), values);
    if choose {
        theme.clone_into(&mut next.theme);
    }
    Ok(next)
}

/// Settings on first login: the default theme is chosen, every theme with its personalization of the login
#[must_use]
pub fn first_settings(login: &Login) -> SettingsFile {
    let values = themes()
        .iter()
        .filter_map(|theme| match serde_json::to_value((theme.personalize)(login)) {
            Ok(Value::Object(values)) if !values.is_empty() => Some((theme.schema.id.clone(), values)),
            _ => None,
        })
        .collect();
    SettingsFile { theme: DEFAULT_THEME.to_owned(), values }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::settings::field::SettingValue;
    use crate::themes::ascii_text::ascii_text;

    fn text(values: &SettingValues, key: &str) -> Option<String> {
        match values.get(key) {
            Some(SettingValue::Text(text)) => Some(text.clone()),
            _ => None,
        }
    }

    #[test]
    fn broken_unknown_and_renamed_files() {
        assert_eq!(
            parse_settings_file(&json!("broken")),
            SettingsFile { theme: "standard".to_owned(), values: BTreeMap::new() }
        );
        assert_eq!(parse_settings_file(&json!({ "theme": "does-not-exist", "values": {} })).theme, "standard");
        let renamed = parse_settings_file(
            &json!({ "theme": "starter", "values": { "starter": { "accent": "#ff0000" }, "matrix": 5 } }),
        );
        assert_eq!(renamed.theme, "standard");
        assert_eq!(
            serde_json::to_value(&renamed.values).expect("json"),
            json!({ "standard": { "accent": "#ff0000" } })
        );
    }

    #[test]
    fn minime_rules_from_the_chosen_theme() {
        let rules = |raw: Value| minime_rules_of(&parse_settings_file(&raw));
        assert_eq!(
            rules(json!({ "theme": "matrix", "values": { "matrix": { "minimeMax": 5 } } })).map(|rules| rules.max),
            Some(5)
        );
        assert_eq!(rules(json!({ "theme": "matrix", "values": {} })).map(|rules| rules.max), Some(30));
        assert!(rules(json!({ "theme": "standard", "values": { "matrix": { "minimeMax": 5 } } })).is_none());
        assert_eq!(rules(json!({ "theme": "matrix" })).and_then(|rules| rules.variants), None);
        let fruits =
            |values: Value| rules(json!({ "theme": "urlaub", "values": { "urlaub": values } })).expect("rules");
        assert_eq!(fruits(json!({})).variants.map(|variants| variants.len()), Some(16));
        assert_eq!(fruits(json!({ "minimeNames_durian": "" })).variants.map(|variants| variants.len()), Some(15));
        assert_eq!(fruits(json!({})).commands.look, "!frucht");
    }

    #[test]
    fn public_view_resolves_the_chosen_theme_only() {
        let file = parse_settings_file(
            &json!({ "theme": "matrix", "values": { "matrix": { "accent": "#ff0000", "foreign": 1 } } }),
        );
        let view = public_settings(&file);
        assert_eq!(view.theme, "matrix");
        assert_eq!(text(&view.values, "accent").as_deref(), Some("#ff0000"));
        assert_eq!(text(&view.values, "channelName").as_deref(), Some("STREAM"));
        assert!(!view.values.contains_key("foreign"));
    }

    #[test]
    fn stored_hop_values_stay_after_the_fields_moved_to_the_core() {
        let file = parse_settings_file(&json!({ "theme": "urlaub", "values": { "urlaub": { "hopHeight": 50 } } }));
        assert_eq!(public_settings(&file).values.get("hopHeight"), Some(&SettingValue::Number(50.0)));
    }

    #[test]
    fn suedfrucht_is_read_as_urlaub() {
        let file =
            parse_settings_file(&json!({ "theme": "suedfrucht", "values": { "suedfrucht": { "fruitSize": 120 } } }));
        assert_eq!(file.theme, "urlaub");
        assert_eq!(file.values.keys().collect::<Vec<_>>(), ["urlaub"]);
        assert_eq!(public_settings(&file).values.get("fruitSize"), Some(&SettingValue::Number(120.0)));
    }

    #[test]
    fn update_checks_and_keeps_other_themes() {
        let file = parse_settings_file(
            &json!({ "theme": "matrix", "values": { "matrix": { "accent": "#ff0000" }, "standard": { "title": "x" } } }),
        );
        let saved = update_settings(&file, "matrix", &json!({ "accent": "#00ff00" }), true).expect("valid");
        assert_eq!(saved.values["matrix"]["accent"], json!("#00ff00"));
        assert_eq!(saved.values["standard"], *json!({ "title": "x" }).as_object().expect("object"));
        assert_eq!(
            update_settings(&file, "matrix", &json!({ "accent": "green" }), true),
            Err(vec![SettingError { key: "accent".to_owned(), code: SettingErrorCode::InvalidColor }])
        );
        assert_eq!(
            update_settings(&file, "does-not-exist", &json!({}), true),
            Err(vec![SettingError { key: "theme".to_owned(), code: SettingErrorCode::UnknownOption }])
        );
        let kept = update_settings(&file, "standard", &json!({ "accent": "#ff0000" }), false).expect("valid");
        assert_eq!(kept.theme, "matrix");
        assert_eq!(kept.values["standard"]["accent"], json!("#ff0000"));
    }

    #[test]
    fn first_login_personalizes_every_theme() {
        let login = Login::parse("neo_42").expect("login");
        let first = first_settings(&login);
        assert_eq!(first.theme, "standard");
        assert_eq!(text(&public_settings(&first).values, "channelName").as_deref(), Some("NEO_42"));
        assert_eq!(first.values["matrix"]["logo"], json!(ascii_text("neo_42")));
        assert_eq!(first.values["standard"], *json!({ "channelName": "NEO_42" }).as_object().expect("object"));
        assert_eq!(parse_settings_file(&serde_json::to_value(&first).expect("json")), first);
    }

    #[test]
    fn old_defaults_are_replaced_and_own_values_stay() {
        let table: &[OldDefault] = &[("standard", "helpWord", "!alt", "!neu")];
        let read = |values: Value| parse_with_old_defaults(&json!({ "theme": "standard", "values": values }), table);
        let replaced = read(json!({ "standard": { "helpWord": "!alt", "other": 1 } }));
        assert_eq!(replaced.values["standard"]["helpWord"], "!neu");
        assert_eq!(replaced.values["standard"]["other"], 1);
        assert_eq!(read(json!({ "standard": { "helpWord": "!eigen" } })).values["standard"]["helpWord"], "!eigen");
        // After the rename of an old theme ID
        assert_eq!(read(json!({ "starter": { "helpWord": "!alt" } })).values["standard"]["helpWord"], "!neu");
        assert!(OLD_DEFAULTS.iter().all(|(theme, ..)| find(theme).is_some()));
    }
}
