//! Context minimes: chatters as figures in the scene minimes. Commands from chat, the rules from the theme settings,
//! the list and its events, plus reading a saved state and turning chat lines into events (template:
//! `server/minimes.ts`). Movement stays in the overlay; saving and timers come with the runtime.

pub mod command;
pub mod roster;
pub mod rules;

use std::collections::BTreeMap;

use serde_json::{Map, Value};

use crate::minimes::command::{MinimeCommand, parse_command};
use crate::minimes::roster::{MAX_STORED, MinimeEntry, MinimeEvent, MinimeState, StoredColor, StoredVariant};
use crate::minimes::rules::MinimeRules;

/// Memory guard for the list in the file (the setting allows at most 100)
pub const MAX_ROSTER: usize = 100;
/// Longest display name kept from a file
const MAX_USER: usize = 50;

fn is_login(text: &str) -> bool {
    (1..=25).contains(&text.len())
        && text.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
}

/// `^#[0-9a-f]{6}$`
fn is_color(text: &str) -> bool {
    text.strip_prefix('#')
        .is_some_and(|hex| hex.len() == 6 && hex.bytes().all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f')))
}

/// `^[a-z0-9]{1,30}$`
fn is_variant(text: &str) -> bool {
    (1..=30).contains(&text.len()) && text.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
}

fn entry(value: &Value) -> Option<MinimeEntry> {
    let object = value.as_object()?;
    let login = object.get("login")?.as_str().filter(|login| is_login(login))?;
    let user =
        object.get("user")?.as_str().filter(|user| !user.is_empty() && user.encode_utf16().count() <= MAX_USER)?;
    let last_seen = object.get("lastSeen")?.as_i64()?;
    let color = match object.get("color")? {
        Value::Null => None,
        Value::String(color) if is_color(color) => Some(color.clone()),
        _ => return None,
    };
    // The variant is missing in files from before variants, invalid variants become none
    let variant =
        object.get("variant").and_then(Value::as_str).filter(|variant| is_variant(variant)).map(str::to_owned);
    Some(MinimeEntry { login: login.to_owned(), user: user.to_owned(), color, variant, last_seen })
}

/// Remembered values under `key` that pass `valid`, the newest up to the limit
fn remembered(value: Option<&Value>, key: &str, valid: fn(&str) -> bool) -> Vec<(String, String, i64, i64)> {
    let empty = Map::new();
    let map = value.and_then(Value::as_object).unwrap_or(&empty);
    let mut entries: Vec<(String, String, i64, i64)> = map
        .iter()
        .filter_map(|(login, stored)| {
            let stored = stored.as_object().filter(|_| is_login(login))?;
            let value = stored.get(key)?.as_str().filter(|value| valid(value))?;
            Some((login.clone(), value.to_owned(), stored.get("usedAt")?.as_i64()?, stored.get("changedAt")?.as_i64()?))
        })
        .collect();
    entries.sort_by_key(|entry| std::cmp::Reverse(entry.2));
    entries.truncate(MAX_STORED);
    entries
}

/// Brings a read state file into valid shape: invalid and duplicate entries drop out
#[must_use]
pub fn parse_minime_file(raw: &Value) -> MinimeState {
    let Some(object) = raw.as_object() else { return MinimeState::default() };
    let mut roster: Vec<MinimeEntry> = Vec::new();
    for found in object.get("roster").and_then(Value::as_array).into_iter().flatten().filter_map(entry) {
        if !roster.iter().any(|known| known.login == found.login) {
            roster.push(found);
        }
    }
    roster.truncate(MAX_ROSTER);
    let colors: BTreeMap<String, StoredColor> = remembered(object.get("colors"), "color", is_color)
        .into_iter()
        .map(|(login, color, used_at, changed_at)| (login, StoredColor { color, used_at, changed_at }))
        .collect();
    let variants: BTreeMap<String, StoredVariant> = remembered(object.get("variants"), "variant", is_variant)
        .into_iter()
        .map(|(login, variant, used_at, changed_at)| (login, StoredVariant { variant, used_at, changed_at }))
        .collect();
    MinimeState { roster, colors, variants }
}

/// A chat line as the minimes see it
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChatLine {
    pub login: String,
    pub user: String,
    pub text: String,
    pub roles: Vec<String>,
    /// Twitch name color, if the chatter chose one
    pub color: Option<String>,
}

/// Chat line as an event: a command or otherwise a normal message
#[must_use]
pub fn to_minime_event(line: &ChatLine, rules: &MinimeRules) -> MinimeEvent {
    let (login, user, twitch_color) = (line.login.clone(), line.user.clone(), line.color.clone());
    match parse_command(&line.text, &line.roles, rules) {
        Some(MinimeCommand::Join { color, variant }) => MinimeEvent::Join { login, user, color, variant, twitch_color },
        Some(MinimeCommand::Color { color }) => MinimeEvent::Color { login, user, color, twitch_color },
        Some(MinimeCommand::Variant { variant }) => MinimeEvent::Variant { login, user, variant },
        Some(MinimeCommand::Leave) => MinimeEvent::Leave { login },
        Some(MinimeCommand::Kick { login }) => MinimeEvent::Kick { login },
        None => MinimeEvent::Chat { login },
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::minimes::command::tests::rules;

    fn line(text: &str, login: &str, roles: &[&str]) -> ChatLine {
        ChatLine {
            login: login.to_owned(),
            user: login.to_uppercase(),
            text: text.to_owned(),
            roles: roles.iter().map(|role| (*role).to_owned()).collect(),
            color: Some("#ff0000".to_owned()),
        }
    }

    fn entry(login: &str, user: &str, color: Option<&str>, variant: Option<&str>, last_seen: i64) -> MinimeEntry {
        MinimeEntry {
            login: login.to_owned(),
            user: user.to_owned(),
            color: color.map(str::to_owned),
            variant: variant.map(str::to_owned),
            last_seen,
        }
    }

    #[test]
    fn broken_or_foreign_files_give_an_empty_state() {
        assert_eq!(parse_minime_file(&Value::Null), MinimeState::default());
        assert_eq!(parse_minime_file(&json!("x")), MinimeState::default());
    }

    #[test]
    fn only_valid_entries_stay() {
        let state = parse_minime_file(&json!({
            "roster": [
                { "login": "../a", "user": "A", "color": null, "lastSeen": 1 },
                { "login": "b", "user": "B", "color": "red", "lastSeen": 1 },
                { "login": "c", "user": "C", "color": "#00ff00", "lastSeen": "now" },
                { "login": "neo", "user": "Neo", "color": "#ff00aa", "lastSeen": 5 },
                { "login": "neo", "user": "Neo", "color": null, "lastSeen": 6 },
                { "login": "trinity", "user": "Trinity", "color": null, "lastSeen": 7 }
            ],
            "colors": {
                "neo": { "color": "#ff00aa", "usedAt": 5, "changedAt": 4 },
                "x y": { "color": "#ffffff", "usedAt": 1, "changedAt": 1 },
                "b": { "color": "#fff", "usedAt": 1, "changedAt": 1 }
            }
        }));
        let expected = vec![entry("neo", "Neo", Some("#ff00aa"), None, 5), entry("trinity", "Trinity", None, None, 7)];
        assert_eq!(state.roster, expected);
        let neo = StoredColor { color: "#ff00aa".to_owned(), used_at: 5, changed_at: 4 };
        assert_eq!(state.colors, BTreeMap::from([("neo".to_owned(), neo)]));
        assert!(state.variants.is_empty());
    }

    #[test]
    fn variants_in_the_file() {
        let state = parse_minime_file(&json!({
            "roster": [
                { "login": "neo", "user": "Neo", "color": null, "variant": "mango", "lastSeen": 1 },
                { "login": "smith", "user": "Smith", "color": null, "variant": "../x", "lastSeen": 1 }
            ],
            "variants": {
                "neo": { "variant": "mango", "usedAt": 1, "changedAt": 1 },
                "smith": { "variant": "../x", "usedAt": 1, "changedAt": 1 }
            }
        }));
        assert_eq!(
            state.roster,
            vec![entry("neo", "Neo", None, Some("mango"), 1), entry("smith", "Smith", None, None, 1)]
        );
        assert_eq!(state.variants.keys().collect::<Vec<_>>(), ["neo"]);
    }

    #[test]
    fn roster_is_limited_and_state_round_trips() {
        let roster: Vec<Value> = (0..150)
            .map(|index| json!({ "login": format!("c{index}"), "user": "C", "color": null, "lastSeen": index }))
            .collect();
        let state = parse_minime_file(&json!({ "roster": roster }));
        assert_eq!(state.roster.len(), MAX_ROSTER);
        let saved = serde_json::to_value(&state).expect("serialize");
        assert_eq!(parse_minime_file(&saved), state);
    }

    #[test]
    fn chat_lines_become_events() {
        let rules = rules();
        let twitch = Some("#ff0000".to_owned());
        let event = to_minime_event(&line("!join #f0a", "neo", &[]), &rules);
        let join = MinimeEvent::Join {
            login: "neo".to_owned(),
            user: "NEO".to_owned(),
            color: Some("#ff00aa".to_owned()),
            variant: None,
            twitch_color: twitch.clone(),
        };
        assert_eq!(event, join);
        let color = MinimeEvent::Color {
            login: "neo".to_owned(),
            user: "NEO".to_owned(),
            color: "#00ff00".to_owned(),
            twitch_color: twitch,
        };
        assert_eq!(to_minime_event(&line("!color 0 255 0", "neo", &[]), &rules), color);
        assert_eq!(
            to_minime_event(&line("!leave", "neo", &[]), &rules),
            MinimeEvent::Leave { login: "neo".to_owned() }
        );
        let kick = to_minime_event(&line("!leave @trinity", "mod", &["moderator"]), &rules);
        assert_eq!(kick, MinimeEvent::Kick { login: "trinity".to_owned() });
        assert_eq!(to_minime_event(&line("hello", "neo", &[]), &rules), MinimeEvent::Chat { login: "neo".to_owned() });
        assert_eq!(
            to_minime_event(&line("!color purple", "neo", &[]), &rules),
            MinimeEvent::Chat { login: "neo".to_owned() }
        );
    }
}
