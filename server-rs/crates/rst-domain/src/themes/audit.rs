//! Shared check of a theme schema (template: `src/themes/schemaAudit.ts` and `registry.check.ts`): unique keys,
//! label and group on every field, valid defaults, scene mapping only for existing groups, personalize values that
//! pass the schema, and the core keys of the effects and the commands page for a theme that brings these scenes. Dead
//! keys are found by the TypeScript audit as long as the scenes live there.

use std::collections::BTreeSet;

use serde_json::{Map, Value};

use crate::identity::values::Login;
use crate::settings::validate::validate_settings;
use crate::themes::info_fields::info_fields;
use crate::themes::registry::Theme;
use crate::themes::schema::SceneName;

/// Keys the core reads for every theme with effects (`FX_KEYS` in `src/core/fx/fx.ts`)
const FX_KEYS: [&str; 4] = ["fxMax", "fxDuration", "fxSize", "fxMargin"];

fn values_object<T: serde::Serialize>(pairs: impl Iterator<Item = (String, T)>) -> Value {
    Value::Object(
        pairs.map(|(key, value)| (key, serde_json::to_value(value).unwrap_or(Value::Null))).collect::<Map<_, _>>(),
    )
}

/// Problems of a theme as readable lines; empty = the theme is fine
#[must_use]
pub fn audit(theme: &Theme) -> Vec<String> {
    let schema = &theme.schema;
    let mut problems = Vec::new();
    let mut keys = BTreeSet::new();
    for field in &schema.fields {
        if !keys.insert(field.key.as_str()) {
            problems.push(format!("duplicate key {}", field.key));
        }
        if field.label.is_empty() || field.group.is_empty() {
            problems.push(format!("field {} without label or group", field.key));
        }
    }
    let defaults = values_object(schema.fields.iter().map(|field| (field.key.clone(), field.default_value())));
    for error in validate_settings(schema, &defaults).errors {
        problems.push(format!("invalid default {}: {:?}", error.key, error.code));
    }
    let groups: BTreeSet<&str> = schema.fields.iter().map(|field| field.group.as_str()).collect();
    problems.extend(
        schema
            .group_scenes
            .keys()
            .filter(|group| !groups.contains(group.as_str()))
            .map(|group| format!("scene mapping for unknown group {group}")),
    );
    // The longest possible Twitch login
    if let Ok(longest) = Login::parse(&format!("{}_123456789", "a".repeat(15))) {
        let personalized = values_object((theme.personalize)(&longest).into_iter());
        for error in validate_settings(schema, &personalized).errors {
            problems.push(format!("invalid personalization {}: {:?}", error.key, error.code));
        }
    }
    // Core keys only for the scenes the theme brings (a theme without effects or commands page needs none of their keys)
    let has_scene = |scene: SceneName| schema.group_scenes.values().any(|scenes| scenes.contains(&scene));
    let fx = has_scene(SceneName::Fx).then(|| FX_KEYS.iter().map(|key| (*key).to_owned()).collect::<Vec<_>>());
    let info = has_scene(SceneName::Info).then(|| info_fields().into_iter().map(|field| field.key).collect::<Vec<_>>());
    let required = fx.into_iter().flatten().chain(info.into_iter().flatten());
    problems.extend(required.filter(|key| !keys.contains(key.as_str())).map(|key| format!("missing core key {key}")));
    problems
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::*;
    use crate::settings::field::{SettingValue, SettingValues, color, text};
    use crate::themes::registry::themes;
    use crate::themes::schema::ThemeSchema;

    fn personalize(_: &Login) -> SettingValues {
        BTreeMap::from([("title".to_owned(), SettingValue::Text("x".repeat(50)))])
    }

    #[test]
    fn built_in_themes_pass() {
        for theme in themes() {
            assert_eq!(audit(theme), Vec::<String>::new(), "{}", theme.schema.id);
        }
    }

    #[test]
    fn reports_every_kind_of_problem() {
        let schema = ThemeSchema {
            id: "probe".to_owned(),
            name: "Probe".to_owned(),
            fields: vec![
                color("accent", "Color", "A", "not-hex"),
                text("title", "", "A", "x", Some(10)),
                text("title", "Title", "A", "y", Some(10)),
            ],
            group_scenes: BTreeMap::from([
                ("Nothing".to_owned(), vec![]),
                ("A".to_owned(), vec![SceneName::Fx, SceneName::Info]),
            ]),
            minime_variants: None,
            minime_teams: None,
        };
        let problems = audit(&Theme { schema, personalize });
        for expected in [
            "duplicate key title",
            "field title without label or group",
            "invalid default accent: InvalidColor",
            "scene mapping for unknown group Nothing",
            "invalid personalization title: TooLong",
            "missing core key fxMax",
            "missing core key infoTitle",
        ] {
            assert!(problems.iter().any(|problem| problem == expected), "{expected} not in {problems:?}");
        }
    }

    #[test]
    fn core_keys_only_for_brought_scenes() {
        fn none(_: &Login) -> SettingValues {
            BTreeMap::new()
        }
        let schema = ThemeSchema {
            id: "probe".to_owned(),
            name: "Probe".to_owned(),
            fields: vec![color("accent", "Color", "A", "#ffffff")],
            group_scenes: BTreeMap::from([("A".to_owned(), vec![SceneName::Starting])]),
            minime_variants: None,
            minime_teams: None,
        };
        assert_eq!(audit(&Theme { schema, personalize: none }), Vec::<String>::new());
    }
}
