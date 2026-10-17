//! Rules of the minime list from the settings of the chosen theme (template: `readMinimeOptions` in
//! `src/core/minimeFields.ts`): command words, roles, limits and switches; with a variant set the allowed variants
//! with their normalized chat names. Missing or invalid values become the defaults.

use serde_json::Value;

use crate::minimes::command::normalize_name;
use crate::settings::field::{SettingValue, SettingValues};
use crate::settings::validate::resolve_settings;
use crate::themes::minime_fields::{ROLES, minime_fields, minime_names_key, minime_variant_fields};
use crate::themes::schema::{MinimeVariantSet, ThemeSchema};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WhenFull {
    /// The longest inactive minime is removed
    Replace,
    /// New minimes are rejected
    Reject,
}

/// An allowed variant with its normalized names in chat
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MinimeVariantRule {
    pub id: String,
    pub names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MinimeCommands {
    pub join: String,
    /// Command for color or variant
    pub look: String,
    pub leave: String,
}

/// Everything that decides what the list does. Roles: Twitch badges or `everyone`; the streamer may always.
#[allow(clippy::struct_excessive_bools, reason = "one switch per setting of the theme")]
#[derive(Debug, Clone, PartialEq)]
pub struct MinimeRules {
    pub commands: MinimeCommands,
    pub join_roles: Vec<String>,
    pub kick_roles: Vec<String>,
    /// The look command joins chatters who have not joined
    pub color_joins: bool,
    pub max: usize,
    pub when_full: WhenFull,
    /// 0 = never
    pub idle_minutes: f64,
    pub color_cooldown_s: f64,
    /// 0 to 255, brightest channel of a color
    pub min_brightness: f64,
    pub use_twitch_color: bool,
    pub chat_keeps_alive: bool,
    pub react_to_chat: bool,
    /// Evaluated by the server when the stream ends
    pub clear_offline: bool,
    pub remove_on_ban: bool,
    /// `None` = the theme uses colors
    pub variants: Option<Vec<MinimeVariantRule>>,
}

fn text(values: &SettingValues, key: &str) -> String {
    match values.get(key) {
        Some(SettingValue::Text(text)) => text.clone(),
        _ => String::new(),
    }
}

fn number(values: &SettingValues, key: &str) -> f64 {
    match values.get(key) {
        Some(SettingValue::Number(number)) => *number,
        _ => 0.0,
    }
}

fn flag(values: &SettingValues, key: &str) -> bool {
    matches!(values.get(key), Some(SettingValue::Flag(true)))
}

/// The chosen minimum role and all above it; `everyone` stays alone
fn roles_from(role: &str) -> Vec<String> {
    if role == "everyone" {
        return vec!["everyone".to_owned()];
    }
    let start = ROLES.iter().position(|known| *known == role).unwrap_or(0);
    ROLES[start..].iter().map(|role| (*role).to_owned()).collect()
}

/// `^!\S{1,24}$`, lengths in UTF-16 code units like the browser
fn command(value: &str, fallback: &str) -> String {
    let valid = value
        .strip_prefix('!')
        .is_some_and(|word| (1..=24).contains(&word.encode_utf16().count()) && !word.chars().any(char::is_whitespace));
    if valid { value.to_owned() } else { fallback.to_owned() }
}

/// Allowed variants: a name belongs to the first variant that lists it, variants without names drop out
fn variant_rules(set: &MinimeVariantSet, values: &SettingValues) -> Vec<MinimeVariantRule> {
    let mut taken: Vec<String> = Vec::new();
    let mut rules = Vec::new();
    for variant in &set.variants {
        let names: Vec<String> = text(values, &minime_names_key(&variant.id))
            .split(',')
            .map(normalize_name)
            .filter(|name| !name.is_empty() && !taken.contains(name))
            .collect();
        taken.extend(names.iter().cloned());
        let mut unique: Vec<String> = Vec::new();
        for name in names {
            if !unique.contains(&name) {
                unique.push(name);
            }
        }
        if !unique.is_empty() {
            rules.push(MinimeVariantRule { id: variant.id.clone(), names: unique });
        }
    }
    rules
}

/// Rules from arbitrary settings values; `set`: variants of the theme, without it chatters choose colors
#[must_use]
pub fn minime_rules(stored: &Value, set: Option<&MinimeVariantSet>) -> MinimeRules {
    let mut fields = minime_fields();
    if let Some(set) = set {
        fields.extend(minime_variant_fields(set));
    }
    let schema = ThemeSchema {
        id: "minimes".to_owned(),
        name: "Minimes".to_owned(),
        fields,
        group_scenes: std::collections::BTreeMap::new(),
        minime_variants: None,
    };
    let values = resolve_settings(&schema, stored);
    let look = match set {
        Some(set) => command(&text(&values, "minimeVariantCommand"), &set.command),
        None => command(&text(&values, "minimeColorCommand"), "!color"),
    };
    #[expect(clippy::cast_possible_truncation, clippy::cast_sign_loss, reason = "the schema limits it to 1 to 100")]
    let max = number(&values, "minimeMax") as usize;
    MinimeRules {
        commands: MinimeCommands {
            join: command(&text(&values, "minimeJoinCommand"), "!join"),
            look,
            leave: command(&text(&values, "minimeLeaveCommand"), "!leave"),
        },
        join_roles: roles_from(&text(&values, "minimeJoinRole")),
        kick_roles: roles_from(&text(&values, "minimeKickRole")),
        color_joins: flag(&values, "minimeColorJoins"),
        max,
        when_full: if text(&values, "minimeWhenFull") == "reject" { WhenFull::Reject } else { WhenFull::Replace },
        idle_minutes: number(&values, "minimeIdleMinutes"),
        color_cooldown_s: number(&values, "minimeColorCooldown"),
        min_brightness: number(&values, "minimeMinBrightness"),
        use_twitch_color: flag(&values, "minimeUseTwitchColor"),
        chat_keeps_alive: flag(&values, "minimeChatKeepsAlive"),
        react_to_chat: flag(&values, "minimeReactToChat"),
        clear_offline: flag(&values, "minimeClearOffline"),
        remove_on_ban: flag(&values, "minimeRemoveOnBan"),
        variants: set.map(|set| variant_rules(set, &values)),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::themes::schema::MinimeVariantInfo;

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| (*value).to_owned()).collect()
    }

    #[test]
    fn defaults_without_saved_values() {
        let rules = minime_rules(&json!({}), None);
        let commands =
            MinimeCommands { join: "!join".to_owned(), look: "!color".to_owned(), leave: "!leave".to_owned() };
        assert_eq!(
            rules,
            MinimeRules {
                commands,
                join_roles: strings(&["everyone"]),
                kick_roles: strings(&["moderator", "broadcaster"]),
                color_joins: true,
                max: 30,
                when_full: WhenFull::Replace,
                idle_minutes: 20.0,
                color_cooldown_s: 10.0,
                min_brightness: 80.0,
                use_twitch_color: true,
                chat_keeps_alive: true,
                react_to_chat: true,
                clear_offline: true,
                remove_on_ban: true,
                variants: None,
            }
        );
        assert_eq!(minime_rules(&Value::Null, None), rules);
    }

    #[test]
    fn invalid_values_give_the_defaults() {
        let stored = json!({ "minimeJoinCommand": "join", "minimeColorCommand": "!change color", "minimeLeaveCommand": "!café", "minimeMax": 999 });
        let rules = minime_rules(&stored, None);
        assert_eq!(
            rules.commands,
            MinimeCommands { join: "!join".to_owned(), look: "!color".to_owned(), leave: "!café".to_owned() }
        );
        assert_eq!(rules.max, 30);
    }

    #[test]
    fn roles_from_the_chosen_minimum() {
        assert_eq!(
            minime_rules(&json!({ "minimeJoinRole": "vip" }), None).join_roles,
            strings(&["vip", "moderator", "broadcaster"])
        );
        assert_eq!(
            minime_rules(&json!({ "minimeKickRole": "broadcaster" }), None).kick_roles,
            strings(&["broadcaster"])
        );
        assert_eq!(minime_rules(&json!({ "minimeWhenFull": "reject" }), None).when_full, WhenFull::Reject);
    }

    #[test]
    fn variant_names_normalized_and_owned_by_the_first_variant() {
        let variant = |id: &str, label: &str, names: &[&str]| MinimeVariantInfo {
            id: id.to_owned(),
            label: label.to_owned(),
            names: strings(names),
        };
        let set = MinimeVariantSet {
            command: "!frucht".to_owned(),
            label: "Frucht".to_owned(),
            variants: vec![
                variant("mango", "Mango", &["mango", "mangos"]),
                variant("kiwi", "Kiwi", &["kiwi", "mango"]),
            ],
        };
        let rules = minime_rules(
            &json!({ "minimeNames_mango": "Mango,  MANGOS, ", "minimeVariantCommand": "!fruit" }),
            Some(&set),
        );
        assert_eq!(rules.commands.look, "!fruit");
        let expected = vec![
            MinimeVariantRule { id: "mango".to_owned(), names: strings(&["mango", "mangos"]) },
            MinimeVariantRule { id: "kiwi".to_owned(), names: strings(&["kiwi"]) },
        ];
        assert_eq!(rules.variants, Some(expected));
        let without_mango = minime_rules(&json!({ "minimeNames_mango": "" }), Some(&set)).variants;
        assert_eq!(
            without_mango,
            Some(vec![MinimeVariantRule { id: "kiwi".to_owned(), names: strings(&["kiwi", "mango"]) }])
        );
        assert_eq!(minime_rules(&json!({ "minimeVariantCommand": "fruit" }), Some(&set)).commands.look, "!frucht");
    }
}
