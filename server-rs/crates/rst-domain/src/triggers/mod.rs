//! Context triggers: chat triggers of a streamer (template: `server/triggers.ts`). When (`when`), who (`who`), how
//! often (cooldowns) and what (`do`: actions with zone). [`compile`] checks raw rules from the editor or the file;
//! faulty rules are reported (German texts for the editor) and skipped, the others stay usable.

pub mod cooldowns;
pub mod pattern;
pub mod schedule;

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;

use crate::triggers::pattern::{Pattern, WhenKind};

/// Longest description of a trigger (UTF-16 code units, like the browser)
pub const MAX_DESCRIPTION: usize = 200;
/// Largest delay, duration and after of an action, in seconds
pub const MAX_ACTION_SECONDS: f64 = 3600.0;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum ActionKind {
    #[default]
    Media,
    Text,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum NamedPosition {
    Center,
    Random,
}

/// "center", "random" or percent `{ x, y }` of the overlay area
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, TS)]
#[serde(untagged)]
pub enum FxPosition {
    Named(NamedPosition),
    Point { x: f64, y: f64 },
}

/// What an effects overlay shows: one action of a fired trigger with who wrote what (template: `FxEvent` in
/// `src/core/types.ts`)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct FxEvent {
    pub id: u64,
    pub zone: String,
    pub action: FxAction,
    pub user: String,
    pub message: String,
}

/// One action of a trigger, as in `triggers.json`
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, TS)]
pub struct FxAction {
    #[serde(rename = "type")]
    pub kind: ActionKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub zone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub image: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub video: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub sound: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub volume: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub duration: Option<f64>,
    /// Seconds visible but paused (first frame)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub delay: Option<f64>,
    /// Seconds standing paused (last frame)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub after: Option<f64>,
    /// Appears with the previous action
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub together: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub position: Option<FxPosition>,
    /// Width in px
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub size: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct When {
    /// word, contains, exact, command or regex
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(rename = "match")]
    pub text: String,
    #[serde(rename = "caseSensitive", default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub case_sensitive: Option<bool>,
}

/// A trigger as in `triggers.json`
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct Trigger {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub enabled: Option<bool>,
    /// Show on the commands page and in the chat help (default yes)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub public: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<String>,
    pub when: When,
    /// everyone, subscriber, vip, moderator, broadcaster (one role is enough)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub who: Option<Vec<String>>,
    /// Seconds, for everyone
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub cooldown: Option<f64>,
    /// Seconds, per viewer
    #[serde(rename = "userCooldown", default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub user_cooldown: Option<f64>,
    #[serde(rename = "do")]
    pub actions: Vec<FxAction>,
}

/// A checked trigger with its search pattern
#[derive(Debug, Clone)]
pub struct CompiledTrigger {
    pub trigger: Trigger,
    pub pattern: Pattern,
}

/// Result of [`compile`]: the usable triggers and one message per faulty rule
#[derive(Debug, Clone, Default)]
pub struct Compiled {
    pub triggers: Vec<CompiledTrigger>,
    pub errors: Vec<String>,
}

/// Whether a chatter with these badges may fire the trigger. The streamer may always, mods may everything that
/// subs and VIPs may.
#[must_use]
pub fn allowed(who: Option<&[String]>, roles: &[String]) -> bool {
    let everyone = [String::from("everyone")];
    let who = who.unwrap_or(&everyone);
    let has = |role: &str| roles.iter().any(|given| given == role);
    who.iter().any(|role| role == "everyone")
        || has("broadcaster")
        || who.iter().any(|role| has(role))
        || (has("moderator") && who.iter().any(|role| role == "subscriber" || role == "vip"))
}

fn text_field<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty())
}

fn check_action(action: &Value, number: usize) -> Result<(), String> {
    let error = |message: &str| Err(format!("Aktion {number}: {message}"));
    match action.get("type").and_then(Value::as_str) {
        Some("media") if ["image", "video", "sound"].iter().all(|key| text_field(action, key).is_none()) => {
            return error("Bild, Video oder Sound fehlt");
        }
        Some("text") if text_field(action, "text").is_none() => return error("Text fehlt"),
        Some("media" | "text") => {}
        _ => return error("type muss media oder text sein"),
    }
    for key in ["delay", "duration", "after"] {
        let Some(value) = action.get(key) else {
            continue;
        };
        if !value.as_f64().is_some_and(|seconds| (0.0..=MAX_ACTION_SECONDS).contains(&seconds)) {
            return error(&format!("{key} muss zwischen 0 und 3600 liegen"));
        }
    }
    Ok(())
}

/// Checks one raw rule in the order of the TypeScript editor and builds its pattern
fn check(raw: &Value, names: &mut BTreeSet<String>) -> Result<CompiledTrigger, String> {
    let name = text_field(raw, "name").filter(|name| !name.trim().is_empty()).ok_or("Name fehlt")?;
    if !names.insert(name.to_owned()) {
        return Err("Name doppelt vergeben".to_owned());
    }
    let when = raw.get("when");
    let kind = when.and_then(|when| when.get("type")).and_then(Value::as_str).and_then(WhenKind::parse);
    let kind = kind.ok_or_else(|| format!("when.type muss {} sein", WhenKind::NAMES.join(", ")))?;
    let text = when.and_then(|when| text_field(when, "match")).ok_or("Suchtext (when.match) fehlt")?;
    if raw.get("who").is_some_and(|who| !who.as_array().is_some_and(|roles| roles.iter().all(Value::is_string))) {
        return Err("who muss eine Liste von Rollen sein".to_owned());
    }
    let description = raw.get("description").and_then(Value::as_str).unwrap_or_default();
    if description.encode_utf16().count() > MAX_DESCRIPTION {
        return Err(format!("Beschreibung länger als {MAX_DESCRIPTION} Zeichen"));
    }
    let actions = raw
        .get("do")
        .and_then(Value::as_array)
        .filter(|actions| !actions.is_empty())
        .ok_or("mindestens eine Aktion nötig")?;
    for (index, action) in actions.iter().enumerate() {
        check_action(action, index + 1)?;
    }
    let case_sensitive = when.and_then(|when| when.get("caseSensitive")).and_then(Value::as_bool).unwrap_or(false);
    let pattern = Pattern::compile(kind, text, case_sensitive).map_err(|error| error.message().to_owned())?;
    let trigger = serde_json::from_value::<Trigger>(raw.clone()).map_err(|_| "Werte ungültig".to_owned())?;
    Ok(CompiledTrigger { trigger, pattern })
}

/// Checks rules and builds the search patterns. Faulty rules end up in `errors` and are skipped.
#[must_use]
pub fn compile(list: &[Value]) -> Compiled {
    let mut names = BTreeSet::new();
    let mut compiled = Compiled::default();
    for raw in list {
        match check(raw, &mut names) {
            Ok(trigger) => compiled.triggers.push(trigger),
            Err(message) => {
                let name = text_field(raw, "name").unwrap_or("?");
                compiled.errors.push(format!("Trigger \"{name}\": {message}"));
            }
        }
    }
    compiled
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn roles(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| (*value).to_owned()).collect()
    }

    #[test]
    fn allowed_by_role() {
        assert!(allowed(None, &[]));
        assert!(!allowed(Some(&roles(&["subscriber"])), &[]));
        assert!(allowed(Some(&roles(&["subscriber"])), &roles(&["subscriber"])));
        assert!(allowed(Some(&roles(&["subscriber"])), &roles(&["moderator"])));
        assert!(!allowed(Some(&roles(&["moderator"])), &roles(&["vip"])));
        assert!(allowed(Some(&roles(&["moderator"])), &roles(&["broadcaster"])));
    }

    fn good() -> Value {
        json!({ "name": "a", "when": { "type": "word", "match": "x" }, "do": [{ "type": "media", "image": "a.gif" }] })
    }

    fn with(changes: &Value) -> Value {
        let mut trigger = good();
        for (key, value) in changes.as_object().expect("object") {
            trigger[key] = value.clone();
        }
        trigger
    }

    #[test]
    fn reports_faulty_rules_and_keeps_valid_ones() {
        assert!(compile(&[good()]).errors.is_empty());
        let bad = compile(&[
            good(),
            good(),
            with(&json!({ "name": "b", "when": { "type": "regex", "match": "(" } })),
            with(&json!({ "name": "c", "do": [{ "type": "media" }] })),
            with(&json!({ "name": "d", "do": [] })),
            with(&json!({ "name": "e", "description": "x".repeat(201) })),
            with(&json!({ "name": "f", "who": "moderator" })),
            with(&json!({ "name": "g", "who": [1] })),
        ]);
        assert_eq!(bad.triggers.len(), 1);
        assert_eq!(bad.errors.len(), 7);
        assert_eq!(bad.errors[0], "Trigger \"a\": Name doppelt vergeben");
        assert_eq!(bad.errors[1], "Trigger \"b\": Muster ungültig");
        assert_eq!(bad.errors[2], "Trigger \"c\": Aktion 1: Bild, Video oder Sound fehlt");
    }

    #[test]
    fn public_and_description_are_allowed() {
        let compiled = compile(&[with(&json!({ "public": false, "description": "Lizard" }))]);
        assert!(compiled.errors.is_empty());
        assert_eq!(compiled.triggers[0].trigger.public, Some(false));
    }

    #[test]
    fn missing_name_type_text_and_action_type() {
        let compiled = compile(&[
            json!({ "when": { "type": "word", "match": "x" }, "do": [] }),
            with(&json!({ "name": "t", "when": { "type": "nothing", "match": "x" } })),
            with(&json!({ "name": "m", "when": { "type": "word", "match": "" } })),
            with(&json!({ "name": "k", "do": [{ "type": "sound" }] })),
            with(&json!({ "name": "x", "do": [{ "type": "text" }] })),
            with(&json!({ "name": "r", "when": { "type": "regex", "match": "(?<=a)b" } })),
        ]);
        assert_eq!(
            compiled.errors,
            [
                "Trigger \"?\": Name fehlt",
                "Trigger \"t\": when.type muss word, contains, exact, command, regex sein",
                "Trigger \"m\": Suchtext (when.match) fehlt",
                "Trigger \"k\": Aktion 1: type muss media oder text sein",
                "Trigger \"x\": Aktion 1: Text fehlt",
                "Trigger \"r\": Muster mit Rückverweis oder Lookaround nicht erlaubt",
            ]
        );
    }

    #[test]
    fn limits() {
        let compiled = compile(&[
            with(&json!({ "name": "long", "when": { "type": "contains", "match": "a".repeat(501) } })),
            with(&json!({ "name": "late", "do": [{ "type": "text", "text": "hi", "delay": 3601 }] })),
            with(&json!({ "name": "negative", "do": [{ "type": "text", "text": "hi", "duration": -1 }] })),
            with(&json!({ "name": "word", "do": [{ "type": "text", "text": "hi", "after": "soon" }] })),
            with(&json!({ "name": "ok", "do": [{ "type": "text", "text": "hi", "delay": 0, "duration": 3600 }] })),
        ]);
        assert_eq!(
            compiled.errors,
            [
                "Trigger \"long\": Suchtext länger als 500 Zeichen",
                "Trigger \"late\": Aktion 1: delay muss zwischen 0 und 3600 liegen",
                "Trigger \"negative\": Aktion 1: duration muss zwischen 0 und 3600 liegen",
                "Trigger \"word\": Aktion 1: after muss zwischen 0 und 3600 liegen",
            ]
        );
        assert_eq!(compiled.triggers.len(), 1);
    }

    #[test]
    fn compiled_triggers_match_chat_lines() {
        let compiled = compile(&[
            json!({ "name": "lizard", "when": { "type": "command", "match": "!lizard" }, "do": [{ "type": "text", "text": "hi" }] }),
        ]);
        let pattern = &compiled.triggers[0].pattern;
        assert!(pattern.matches("!lizard please"));
        assert!(!pattern.matches("say !lizard"));
    }
}
