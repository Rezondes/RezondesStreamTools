//! What an IRC line means for the overlays (template: `src/core/ircEvents.ts`): chat, alerts (subs, gifts, raids,
//! bits), moderation deletions, the room ID (for 7TV, BTTV and FFZ) and ping.

use std::collections::HashMap;
use std::hash::BuildHasher;
use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::chat::irc::{IrcMessage, Part, split_emotes, split_words};
use crate::twitch::alerts::{Alert, AlertKind, without_cheermotes};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct ChatMessage {
    pub id: String,
    pub login: String,
    pub user: String,
    /// `HOST`, `MOD`, `VIP`, `SUB` in the order of the tags
    pub badges: Vec<String>,
    pub parts: Vec<Part>,
    /// A `/me` message
    pub action: bool,
}

/// One message (`id`), all of a chatter (`login`) or the whole chat (neither)
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize, TS)]
pub struct ChatRemoval {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub login: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IrcEvent {
    Chat(ChatMessage),
    Alert(Alert),
    Remove(ChatRemoval),
    Room(String),
    Ping(String),
}

const ACTION_START: &str = "\u{1}ACTION ";
const ACTION_END: char = '\u{1}';

static CHAT_CHEERMOTE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\b\w+\d+\b").expect("valid pattern"));

fn badge(name: &str) -> Option<&'static str> {
    match name {
        "broadcaster" => Some("HOST"),
        "moderator" => Some("MOD"),
        "vip" => Some("VIP"),
        "subscriber" => Some("SUB"),
        _ => None,
    }
}

fn amount(message: &IrcMessage, tag: &str) -> Option<u32> {
    message.tag(tag).parse().ok()
}

fn tag_or(message: &IrcMessage, tag: &str, fallback: &str) -> String {
    match message.tag(tag) {
        "" => fallback.to_owned(),
        value => value.to_owned(),
    }
}

/// `with_alerts`: false when alerts come from the server (otherwise subs would appear twice). `new_id`: for messages
/// without an id.
#[must_use]
pub fn to_irc_events<S: BuildHasher>(
    message: &IrcMessage,
    emotes: &HashMap<String, String, S>,
    with_alerts: bool,
    new_id: impl FnOnce() -> String,
) -> Vec<IrcEvent> {
    let user = tag_or(message, "display-name", message.login());
    match message.command.as_str() {
        "PING" => vec![IrcEvent::Ping(message.param(0).unwrap_or_default().to_owned())],
        "PRIVMSG" => chat_events(message, emotes, with_alerts, new_id),
        "USERNOTICE" if with_alerts => notice_alert(message, &user).map(IrcEvent::Alert).into_iter().collect(),
        "CLEARMSG" => {
            vec![IrcEvent::Remove(ChatRemoval { id: message.tags.get("target-msg-id").cloned(), login: None })]
        }
        "CLEARCHAT" => vec![IrcEvent::Remove(ChatRemoval { id: None, login: message.param(1).map(str::to_owned) })],
        "ROOMSTATE" => match message.tag("room-id") {
            "" => Vec::new(),
            room => vec![IrcEvent::Room(room.to_owned())],
        },
        _ => Vec::new(),
    }
}

fn chat_events<S: BuildHasher>(
    message: &IrcMessage,
    emotes: &HashMap<String, String, S>,
    with_alerts: bool,
    new_id: impl FnOnce() -> String,
) -> Vec<IrcEvent> {
    let login = message.login().to_owned();
    let user = tag_or(message, "display-name", &login);
    let raw = message.param(1).unwrap_or_default();
    // /me messages come as ACTION between two control characters
    let acted = raw.strip_prefix(ACTION_START).and_then(|rest| rest.strip_suffix(ACTION_END));
    let text = acted.unwrap_or(raw);
    let chat = ChatMessage {
        id: message.tags.get("id").cloned().unwrap_or_else(new_id),
        login,
        user: user.clone(),
        badges: message
            .tag("badges")
            .split(',')
            .filter_map(|entry| badge(entry.split('/').next().unwrap_or_default()))
            .map(str::to_owned)
            .collect(),
        parts: split_words(split_emotes(text, message.tag("emotes")), emotes),
        action: acted.is_some(),
    };
    let bits = message.tag("bits");
    if !with_alerts || bits.is_empty() {
        return vec![IrcEvent::Chat(chat)];
    }
    let cheer = Alert::new(AlertKind::Cheer, &user)
        .amount(bits.parse().ok())
        .text(Some(without_cheermotes(text, &CHAT_CHEERMOTE)));
    vec![IrcEvent::Chat(chat), IrcEvent::Alert(cheer)]
}

fn notice_alert(message: &IrcMessage, user: &str) -> Option<Alert> {
    let text = message.param(1).map(str::to_owned);
    Some(match message.tag("msg-id") {
        "sub" => Alert::new(AlertKind::Sub, user).text(text),
        "resub" => Alert::new(AlertKind::Resub, user).amount(amount(message, "msg-param-cumulative-months")).text(text),
        // Single gifts of a mass gifting carry community-gift-id, submysterygift already counts them
        "subgift" if !message.tag("msg-param-community-gift-id").is_empty() => return None,
        "subgift" => Alert::new(AlertKind::Gift, user)
            .amount(Some(1))
            .text(message.tags.get("msg-param-recipient-display-name").cloned()),
        "submysterygift" => Alert::new(AlertKind::Gift, user).amount(amount(message, "msg-param-mass-gift-count")),
        "raid" => Alert::new(AlertKind::Raid, &tag_or(message, "msg-param-displayName", user))
            .amount(amount(message, "msg-param-viewerCount")),
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use serde_json::{Value, json};

    use super::*;
    use crate::chat::irc::parse_irc;

    fn events(line: &str, with_alerts: bool, emotes: &HashMap<String, String>) -> Vec<IrcEvent> {
        to_irc_events(&parse_irc(line), emotes, with_alerts, || "generated".to_owned())
    }

    fn plain(line: &str) -> Vec<IrcEvent> {
        events(line, true, &HashMap::new())
    }

    fn alert(value: Value) -> IrcEvent {
        IrcEvent::Alert(serde_json::from_value(value).expect("alert"))
    }

    #[test]
    fn chat_with_badges_and_emotes() {
        let extra = HashMap::from([("catJAM".to_owned(), "u".to_owned())]);
        let chat = events(
            "@badges=moderator/1,subscriber/12;display-name=Neo;emotes=25:0-4;id=abc :neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :Kappa catJAM",
            true,
            &extra,
        );
        let message: ChatMessage = serde_json::from_value(json!({
            "id": "abc", "login": "neo", "user": "Neo", "badges": ["MOD", "SUB"], "action": false,
            "parts": [{ "name": "Kappa", "url": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" }, " ", { "name": "catJAM", "url": "u" }]
        }))
        .expect("message");
        assert_eq!(chat, [IrcEvent::Chat(message)]);
    }

    #[test]
    fn me_message_without_id_and_display_name() {
        let action = plain(":neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :\u{1}ACTION dances\u{1}");
        let expected = ChatMessage {
            id: "generated".to_owned(),
            login: "neo".to_owned(),
            user: "neo".to_owned(),
            badges: Vec::new(),
            parts: vec![Part::Text("dances".to_owned())],
            action: true,
        };
        assert_eq!(action, [IrcEvent::Chat(expected)]);
    }

    #[test]
    fn bits_add_a_cheer_alert() {
        let line = "@bits=100;display-name=Tank :tank!tank@tank.tmi.twitch.tv PRIVMSG #rezondes :Cheer100 take that";
        assert_eq!(
            plain(line)[1],
            alert(json!({ "kind": "cheer", "user": "Tank", "amount": 100, "text": "take that" }))
        );
        assert_eq!(events(line, false, &HashMap::new()).len(), 1);
    }

    #[test]
    fn sub_notices() {
        let notice = |tags: &str, text: &str| {
            let trailing = if text.is_empty() { String::new() } else { format!(" :{text}") };
            plain(&format!("@display-name=Trinity;{tags} :tmi.twitch.tv USERNOTICE #rezondes{trailing}"))
        };
        assert_eq!(
            notice("msg-id=sub", "finally"),
            [alert(json!({ "kind": "sub", "user": "Trinity", "text": "finally" }))]
        );
        assert_eq!(
            notice("msg-id=resub;msg-param-cumulative-months=12", ""),
            [alert(json!({ "kind": "resub", "user": "Trinity", "amount": 12 }))]
        );
        assert_eq!(
            notice("msg-id=subgift;msg-param-recipient-display-name=Neo", ""),
            [alert(json!({ "kind": "gift", "user": "Trinity", "amount": 1, "text": "Neo" }))]
        );
        assert!(notice("msg-id=subgift;msg-param-community-gift-id=7", "").is_empty());
        assert_eq!(
            notice("msg-id=submysterygift;msg-param-mass-gift-count=5", ""),
            [alert(json!({ "kind": "gift", "user": "Trinity", "amount": 5 }))]
        );
        assert_eq!(
            notice("msg-id=raid;msg-param-displayName=Smith;msg-param-viewerCount=42", ""),
            [alert(json!({ "kind": "raid", "user": "Smith", "amount": 42 }))]
        );
        assert!(notice("msg-id=announcement", "").is_empty());
        assert!(
            events("@msg-id=sub;display-name=T :tmi.twitch.tv USERNOTICE #rezondes", false, &HashMap::new()).is_empty()
        );
    }

    #[test]
    fn moderation_room_and_ping() {
        let remove = |id: Option<&str>, login: Option<&str>| {
            IrcEvent::Remove(ChatRemoval { id: id.map(str::to_owned), login: login.map(str::to_owned) })
        };
        assert_eq!(plain("@target-msg-id=abc :tmi.twitch.tv CLEARMSG #rezondes :text"), [remove(Some("abc"), None)]);
        assert_eq!(plain(":tmi.twitch.tv CLEARCHAT #rezondes :neo"), [remove(None, Some("neo"))]);
        assert_eq!(plain(":tmi.twitch.tv CLEARCHAT #rezondes"), [remove(None, None)]);
        assert_eq!(plain("@room-id=123 :tmi.twitch.tv ROOMSTATE #rezondes"), [IrcEvent::Room("123".to_owned())]);
        assert!(plain(":tmi.twitch.tv ROOMSTATE #rezondes").is_empty());
        assert_eq!(plain("PING :tmi.twitch.tv"), [IrcEvent::Ping("tmi.twitch.tv".to_owned())]);
        assert_eq!(serde_json::to_value(ChatRemoval::default()).expect("json"), json!({}));
    }
}
