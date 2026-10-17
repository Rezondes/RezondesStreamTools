//! Context commands: the public list of chat commands of a streamer (help command, minime commands, public
//! triggers) and the reply to the help command (templates: `src/core/commands.ts`, `server/commands.ts`,
//! `server/help.ts`). Only data; every page builds its visible texts itself.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;

use crate::minimes::rules::{MinimeRules, MinimeVariantRule};
use crate::triggers::Trigger;

/// Twitch accepts at most 500 characters per chat message
pub const MAX_CHAT: usize = 500;
/// Longest reply template
const MAX_REPLY: usize = 400;
/// Longest help cooldown in seconds
const MAX_COOLDOWN: u32 = 3600;

/// Help command of the streamer (`commands.json` in the profile); `reply`: template with `{commands}` and `{link}`
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct HelpConfig {
    pub enabled: bool,
    pub command: String,
    pub reply: String,
    /// Seconds, for everyone
    pub cooldown: u32,
}

/// Without a saved setting (German default for the chat, like today)
#[must_use]
pub fn default_help() -> HelpConfig {
    HelpConfig {
        enabled: true,
        command: "!befehle".to_owned(),
        reply: "Befehle: {commands} | Alles erklärt: {link}".to_owned(),
        cooldown: 30,
    }
}

/// `^![a-z0-9_]{1,24}$`
fn is_command(text: &str) -> bool {
    text.strip_prefix('!').is_some_and(|word| {
        (1..=24).contains(&word.len())
            && word.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
    })
}

/// Valid setting or `None`; the command is case-insensitive and stored in lower case
#[must_use]
pub fn to_help_config(value: &Value) -> Option<HelpConfig> {
    let object = value.as_object()?;
    let enabled = object.get("enabled")?.as_bool()?;
    let command = object.get("command")?.as_str()?.to_lowercase();
    let reply = object.get("reply")?.as_str()?;
    let cooldown = u32::try_from(object.get("cooldown")?.as_u64()?).ok()?;
    let valid = is_command(&command) && reply.encode_utf16().count() <= MAX_REPLY && cooldown <= MAX_COOLDOWN;
    valid.then(|| HelpConfig { enabled, command, reply: reply.to_owned(), cooldown })
}

/// One entry of the commands list. `variants`: allowed variants with their names, `None` = the theme uses colors.
/// `match` of a trigger is `None` for regex triggers (only the description is readable for humans).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum CommandItem {
    Help {
        command: String,
        cooldown: u32,
    },
    Join {
        command: String,
        who: Vec<String>,
        variants: Option<Vec<MinimeVariantRule>>,
    },
    Look {
        command: String,
        who: Vec<String>,
        variants: Option<Vec<MinimeVariantRule>>,
    },
    Leave {
        command: String,
        #[serde(rename = "kickWho")]
        kick_who: Vec<String>,
    },
    Trigger {
        name: String,
        when: String,
        #[serde(rename = "match")]
        text: Option<String>,
        description: String,
        who: Vec<String>,
        cooldown: f64,
        #[serde(rename = "userCooldown")]
        user_cooldown: f64,
    },
}

/// Answer of `/s/<login>/commands`
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct CommandList {
    pub channel: String,
    pub items: Vec<CommandItem>,
}

fn minime_items(rules: &MinimeRules) -> [CommandItem; 3] {
    [
        CommandItem::Join {
            command: rules.commands.join.clone(),
            who: rules.join_roles.clone(),
            variants: rules.variants.clone(),
        },
        CommandItem::Look {
            command: rules.commands.look.clone(),
            who: rules.join_roles.clone(),
            variants: rules.variants.clone(),
        },
        CommandItem::Leave { command: rules.commands.leave.clone(), kick_who: rules.kick_roles.clone() },
    ]
}

fn trigger_item(trigger: &Trigger) -> CommandItem {
    CommandItem::Trigger {
        name: trigger.name.clone(),
        when: trigger.when.kind.clone(),
        text: (trigger.when.kind != "regex").then(|| trigger.when.text.clone()),
        description: trigger.description.clone().unwrap_or_default(),
        who: trigger.who.clone().unwrap_or_else(|| vec!["everyone".to_owned()]),
        cooldown: trigger.cooldown.unwrap_or(0.0),
        user_cooldown: trigger.user_cooldown.unwrap_or(0.0),
    }
}

/// The list: help (if on), minime commands (`None` = feature off or theme without minimes), active public triggers
#[must_use]
pub fn command_list(
    channel: &str,
    help: Option<&HelpConfig>,
    minimes: Option<&MinimeRules>,
    triggers: &[Trigger],
) -> CommandList {
    let help = help
        .filter(|help| help.enabled)
        .map(|help| CommandItem::Help { command: help.command.clone(), cooldown: help.cooldown });
    let minimes = minimes.map(minime_items).into_iter().flatten();
    let public = triggers
        .iter()
        .filter(|trigger| trigger.enabled != Some(false) && trigger.public != Some(false))
        .map(trigger_item);
    CommandList { channel: channel.to_owned(), items: help.into_iter().chain(minimes).chain(public).collect() }
}

/// At most `limit` UTF-16 code units, never cutting a character
fn truncate_utf16(text: &str, limit: usize) -> String {
    let mut length = 0;
    text.chars()
        .take_while(|character| {
            length += character.len_utf16();
            length <= limit
        })
        .collect()
}

/// Reply to the help command: `{commands}` = all commands one can type (not the help command itself; of triggers
/// only commands, whole messages and words), `{link}` = the commands page; shortened to [`MAX_CHAT`]
#[must_use]
pub fn help_reply(template: &str, list: &CommandList, link: &str) -> String {
    let mut typed: Vec<&str> = Vec::new();
    for item in &list.items {
        let command = match item {
            CommandItem::Help { .. } => None,
            CommandItem::Join { command, .. }
            | CommandItem::Look { command, .. }
            | CommandItem::Leave { command, .. } => Some(command.as_str()),
            CommandItem::Trigger { when, text, .. } => text.as_deref().filter(|_| when != "contains"),
        };
        if let Some(command) = command
            && !typed.contains(&command)
        {
            typed.push(command);
        }
    }
    let text = template.replace("{commands}", &typed.join(", ")).replace("{link}", link);
    truncate_utf16(&text, MAX_CHAT)
}

/// When the help command answers: once per cooldown for everyone, and never to its own echo in chat
#[derive(Debug, Default)]
pub struct HelpGate {
    last_reply: Option<i64>,
    last_sent: String,
}

impl HelpGate {
    /// Whether this chat line asks for help now; if so, the cooldown starts
    pub fn wants_reply(&mut self, help: &HelpConfig, text: &str, now: i64) -> bool {
        let first = text.split_whitespace().next().unwrap_or_default().to_lowercase();
        if !help.enabled || first != help.command {
            return false;
        }
        if self.last_reply.is_some_and(|last| now - last < i64::from(help.cooldown) * 1000) {
            return false;
        }
        self.last_reply = Some(now);
        true
    }

    /// Remembers the sent reply for the echo check
    pub fn sent(&mut self, message: &str) {
        message.clone_into(&mut self.last_sent);
    }

    /// Our own reply as it comes back in chat; triggers and minimes must not see it
    #[must_use]
    pub fn is_echo(&self, streamer: &str, login: &str, text: &str) -> bool {
        login == streamer && !self.last_sent.is_empty() && text == self.last_sent
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::minimes::rules::minime_rules;
    use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet};
    use crate::triggers::When;

    fn help() -> HelpConfig {
        HelpConfig { enabled: true, command: "!befehle".to_owned(), reply: "x".to_owned(), cooldown: 30 }
    }

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| (*value).to_owned()).collect()
    }

    fn trigger(name: &str, kind: &str, text: &str) -> Trigger {
        Trigger {
            name: name.to_owned(),
            enabled: None,
            public: None,
            description: None,
            when: When { kind: kind.to_owned(), text: text.to_owned(), case_sensitive: None },
            who: None,
            cooldown: None,
            user_cooldown: None,
            actions: Vec::new(),
        }
    }

    fn triggers() -> Vec<Trigger> {
        vec![
            Trigger {
                who: Some(strings(&["vip"])),
                cooldown: Some(5.0),
                user_cooldown: Some(60.0),
                description: Some("Lizard".to_owned()),
                ..trigger("lizard", "command", "!lizard")
            },
            Trigger { enabled: Some(false), ..trigger("off", "word", "off") },
            Trigger { public: Some(false), ..trigger("secret", "word", "secret") },
            trigger("pattern", "regex", "^a+$"),
        ]
    }

    #[test]
    fn everything_on_with_colors_and_only_active_public_triggers() {
        let colors = minime_rules(&json!({ "minimeJoinRole": "subscriber" }), None);
        let list = command_list("rezondes", Some(&help()), Some(&colors), &triggers());
        let subs = strings(&["subscriber", "vip", "moderator", "broadcaster"]);
        let expected = vec![
            CommandItem::Help { command: "!befehle".to_owned(), cooldown: 30 },
            CommandItem::Join { command: "!join".to_owned(), who: subs.clone(), variants: None },
            CommandItem::Look { command: "!color".to_owned(), who: subs, variants: None },
            CommandItem::Leave { command: "!leave".to_owned(), kick_who: strings(&["moderator", "broadcaster"]) },
            CommandItem::Trigger {
                name: "lizard".to_owned(),
                when: "command".to_owned(),
                text: Some("!lizard".to_owned()),
                description: "Lizard".to_owned(),
                who: strings(&["vip"]),
                cooldown: 5.0,
                user_cooldown: 60.0,
            },
            CommandItem::Trigger {
                name: "pattern".to_owned(),
                when: "regex".to_owned(),
                text: None,
                description: String::new(),
                who: strings(&["everyone"]),
                cooldown: 0.0,
                user_cooldown: 0.0,
            },
        ];
        assert_eq!(list, CommandList { channel: "rezondes".to_owned(), items: expected });
    }

    #[test]
    fn variants_instead_of_colors_and_empty_list() {
        let mango = MinimeVariantInfo { id: "mango".to_owned(), label: "Mango".to_owned(), names: strings(&["mango"]) };
        let set = MinimeVariantSet { command: "!frucht".to_owned(), label: "Frucht".to_owned(), variants: vec![mango] };
        let fruits = minime_rules(&json!({}), Some(&set));
        let items = command_list("rezondes", None, Some(&fruits), &[]).items;
        let variants = Some(vec![MinimeVariantRule { id: "mango".to_owned(), names: strings(&["mango"]) }]);
        let look = CommandItem::Look {
            command: "!frucht".to_owned(),
            who: strings(&["everyone"]),
            variants: variants.clone(),
        };
        assert!(items.contains(&look));
        assert!(items.contains(&CommandItem::Join {
            command: "!join".to_owned(),
            who: strings(&["everyone"]),
            variants
        }));
        let off = HelpConfig { enabled: false, ..help() };
        assert!(command_list("rezondes", Some(&off), None, &[]).items.is_empty());
    }

    #[test]
    fn list_serializes_like_the_typescript_union() {
        let list = command_list("rezondes", Some(&help()), None, &[trigger("pattern", "regex", "^a+$")]);
        let json = serde_json::to_value(&list).expect("serialize");
        assert_eq!(json["items"][0], json!({ "kind": "help", "command": "!befehle", "cooldown": 30 }));
        assert_eq!(json["items"][1]["match"], Value::Null);
        assert_eq!(json["items"][1]["userCooldown"], json!(0.0));
    }

    #[test]
    fn help_reply_lists_typed_commands_once_and_fits_twitch() {
        let colors = minime_rules(&json!({ "minimeJoinRole": "subscriber" }), None);
        let mut all = triggers();
        all.push(trigger("two", "word", "!lizard"));
        all.push(trigger("part", "contains", "lol"));
        let list = command_list("rezondes", Some(&help()), Some(&colors), &all);
        let reply = help_reply("Befehle: {commands} | {link}", &list, "https://x/s/rezondes/");
        assert_eq!(reply, "Befehle: !join, !color, !leave, !lizard | https://x/s/rezondes/");
        let empty = command_list("rezondes", None, None, &[]);
        assert_eq!(help_reply("{link}", &empty, "L"), "L");
        assert_eq!(help_reply("{commands}", &empty, "L"), "");
        assert_eq!(help_reply(&"x".repeat(600), &list, "L").len(), MAX_CHAT);
        assert_eq!(help_reply(&"😀".repeat(300), &list, "L").encode_utf16().count(), MAX_CHAT);
    }

    #[test]
    fn help_config_is_checked() {
        let valid =
            json!({ "enabled": false, "command": "!Help", "reply": "Commands: {commands} {link}", "cooldown": 10 });
        let config = to_help_config(&valid).expect("valid");
        assert_eq!(config.command, "!help");
        let with = |key: &str, value: Value| {
            let mut changed = valid.clone();
            changed[key] = value;
            to_help_config(&changed)
        };
        assert_eq!(with("command", json!("help")), None);
        assert_eq!(with("command", json!("!two words")), None);
        assert_eq!(with("reply", json!("x".repeat(401))), None);
        assert_eq!(with("cooldown", json!(-1)), None);
        assert_eq!(with("cooldown", json!(3601)), None);
        assert_eq!(with("cooldown", json!(1.5)), None);
        assert_eq!(with("enabled", json!("yes")), None);
        assert_eq!(to_help_config(&Value::Null), None);
        assert_eq!(default_help().command, "!befehle");
    }

    #[test]
    fn help_gate_cooldown_echo_and_settings() {
        let mut gate = HelpGate::default();
        let help = HelpConfig { reply: "Befehle: {commands} | {link}".to_owned(), ..help() };
        assert!(!gate.wants_reply(&help, "hello !befehle", 0));
        assert!(gate.wants_reply(&help, "!BEFEHLE please", 0));
        gate.sent("Befehle: !lizard | https://x/s/rezondes/");
        assert!(gate.is_echo("rezondes", "rezondes", "Befehle: !lizard | https://x/s/rezondes/"));
        assert!(!gate.is_echo("rezondes", "neo", "Befehle: !lizard | https://x/s/rezondes/"));
        assert!(!gate.wants_reply(&help, "!befehle", 29_000));
        assert!(gate.wants_reply(&help, "!befehle", 30_000));
        let other = HelpConfig { command: "!hilfe".to_owned(), cooldown: 0, ..help.clone() };
        assert!(!gate.wants_reply(&other, "!befehle", 30_000));
        assert!(gate.wants_reply(&other, "!hilfe", 30_000));
        let off = HelpConfig { enabled: false, ..help };
        assert!(!gate.wants_reply(&off, "!befehle", 100_000));
    }
}
