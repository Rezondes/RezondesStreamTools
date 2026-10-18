//! Parsers for Twitch IRC (template: `src/core/irc.ts`): a raw line, Twitch emotes from the tag `emotes` and words
//! that are emotes of 7TV, BTTV or FFZ.

use std::collections::{BTreeMap, HashMap};
use std::hash::BuildHasher;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// URL of the Twitch chat
pub const IRC_URL: &str = "wss://irc-ws.chat.twitch.tv:443";

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct IrcMessage {
    pub tags: BTreeMap<String, String>,
    pub prefix: String,
    pub command: String,
    pub params: Vec<String>,
}

impl IrcMessage {
    /// Tag value, empty if missing
    #[must_use]
    pub fn tag(&self, name: &str) -> &str {
        self.tags.get(name).map_or("", String::as_str)
    }

    /// Login from the prefix `login!login@login.tmi.twitch.tv`
    #[must_use]
    pub fn login(&self) -> &str {
        self.prefix.split('!').next().unwrap_or_default()
    }

    #[must_use]
    pub fn param(&self, index: usize) -> Option<&str> {
        self.params.get(index).map(String::as_str)
    }

    /// Channel login of a channel message (`PRIVMSG #neo :hi` -> `neo`), `None` for messages without a channel
    #[must_use]
    pub fn channel(&self) -> Option<&str> {
        self.param(0).and_then(|target| target.strip_prefix('#'))
    }
}

/// A piece of a chat message: text or an emote with its image
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(untagged)]
pub enum Part {
    Text(String),
    Emote { name: String, url: String },
}

fn unescape_tag(value: &str) -> String {
    let mut result = String::with_capacity(value.len());
    let mut chars = value.chars();
    while let Some(character) = chars.next() {
        if character != '\\' {
            result.push(character);
            continue;
        }
        match chars.next() {
            Some('s') => result.push(' '),
            Some(':') => result.push(';'),
            Some('r') => result.push('\r'),
            Some('n') => result.push('\n'),
            Some(other) => result.push(other),
            None => result.push('\\'),
        }
    }
    result
}

/// Splits off the word up to the first space; without a space everything is the word
fn split_word(text: &str) -> (&str, &str) {
    text.split_once(' ').unwrap_or((text, ""))
}

/// Format: `[@tags ][:prefix ]COMMAND [params...] [:trailing]`
#[must_use]
pub fn parse_irc(line: &str) -> IrcMessage {
    let mut tags = BTreeMap::new();
    let mut rest = line;
    if let Some(tagged) = rest.strip_prefix('@') {
        let (raw, after) = split_word(tagged);
        for pair in raw.split(';') {
            match pair.split_once('=') {
                Some((name, value)) => tags.insert(name.to_owned(), unescape_tag(value)),
                None => tags.insert(pair.to_owned(), String::new()),
            };
        }
        rest = after;
    }
    let mut prefix = String::new();
    if let Some(prefixed) = rest.strip_prefix(':') {
        let (raw, after) = split_word(prefixed);
        raw.clone_into(&mut prefix);
        rest = after;
    }
    let (middle, trailing) = match rest.split_once(" :") {
        Some((middle, trailing)) => (middle, Some(trailing)),
        None => (rest, None),
    };
    let mut words = middle.split(' ').filter(|word| !word.is_empty()).map(str::to_owned);
    let command = words.next().unwrap_or_default();
    let mut params: Vec<String> = words.collect();
    params.extend(trailing.map(str::to_owned));
    IrcMessage { tags, prefix, command, params }
}

/// One emote in a message: Twitch emote ID and the positions in code points (inclusive)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmoteRange {
    pub id: String,
    pub from: usize,
    pub to: usize,
}

/// The tag `emotes` looks like `25:0-4,12-16/1902:6-10`; malformed entries are left out. Sorted by position.
#[must_use]
pub fn emote_ranges(emotes: &str) -> Vec<EmoteRange> {
    let mut ranges: Vec<EmoteRange> = emotes
        .split('/')
        .filter_map(|entry| entry.split_once(':'))
        .flat_map(|(id, positions)| {
            positions.split(',').filter_map(move |position| {
                let (from, to) = position.split_once('-')?;
                let (from, to) = (from.parse().ok()?, to.parse().ok()?);
                (from <= to).then(|| EmoteRange { id: id.to_owned(), from, to })
            })
        })
        .collect();
    ranges.sort_by_key(|range| range.from);
    ranges
}

fn emote_url(id: &str) -> String {
    format!("https://static-cdn.jtvnw.net/emoticons/v2/{id}/default/dark/2.0")
}

/// Text with Twitch emotes as parts; positions count code points, not UTF-16
#[must_use]
pub fn split_emotes(text: &str, emotes: &str) -> Vec<Part> {
    let chars: Vec<char> = text.chars().collect();
    let piece = |from: usize, to: usize| chars[from.min(chars.len())..to.min(chars.len())].iter().collect::<String>();
    let mut parts = Vec::new();
    let mut next = 0;
    for range in emote_ranges(emotes) {
        if range.from >= chars.len() {
            break;
        }
        if range.from > next {
            parts.push(Part::Text(piece(next, range.from)));
        }
        parts.push(Part::Emote { name: piece(range.from, range.to + 1), url: emote_url(&range.id) });
        next = range.to + 1;
    }
    if next < chars.len() {
        parts.push(Part::Text(piece(next, chars.len())));
    }
    parts
}

/// Splits text into words and runs of whitespace, both kept
fn words_and_spaces(text: &str) -> Vec<&str> {
    let mut pieces = Vec::new();
    let mut start = 0;
    let mut in_space = None;
    for (index, character) in text.char_indices() {
        let space = character.is_whitespace();
        if in_space.is_some_and(|was| was != space) {
            pieces.push(&text[start..index]);
            start = index;
        }
        in_space = Some(space);
    }
    if start < text.len() {
        pieces.push(&text[start..]);
    }
    pieces
}

/// Emotes from 7TV, BTTV and FFZ are not in the tags, they are whole words in the text (name to image URL)
#[must_use]
pub fn split_words<S: BuildHasher>(parts: Vec<Part>, emotes: &HashMap<String, String, S>) -> Vec<Part> {
    if emotes.is_empty() {
        return parts;
    }
    parts
        .into_iter()
        .flat_map(|part| match part {
            Part::Text(text) => words_and_spaces(&text)
                .into_iter()
                .map(|word| match emotes.get(word) {
                    Some(url) => Part::Emote { name: word.to_owned(), url: url.clone() },
                    None => Part::Text(word.to_owned()),
                })
                .collect(),
            emote @ Part::Emote { .. } => vec![emote],
        })
        .collect()
}

/// Lines for an anonymous login (read only) in `channel`; `guest` (0 to 79 999, random) numbers the guest name
#[must_use]
pub fn anonymous_login(channel: &str, guest: u32) -> [String; 4] {
    [
        "CAP REQ :twitch.tv/tags twitch.tv/commands".to_owned(),
        "PASS SCHMOOPIIE".to_owned(),
        format!("NICK justinfan{}", 10_000 + guest % 80_000),
        format!("JOIN #{channel}"),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(value: &str) -> Part {
        Part::Text(value.to_owned())
    }

    fn kappa() -> Part {
        Part::Emote { name: "Kappa".to_owned(), url: emote_url("25") }
    }

    #[test]
    fn channel_of_channel_messages_only() {
        assert_eq!(parse_irc(":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hi").channel(), Some("neo"));
        assert_eq!(parse_irc("CLEARCHAT #trinity :smith").channel(), Some("trinity"));
        assert_eq!(parse_irc("PING :tmi.twitch.tv").channel(), None);
    }

    #[test]
    fn parses_tags_prefix_command_and_trailing() {
        let message = parse_irc(
            "@badges=moderator/1;display-name=Rez\\sOndes;emotes=25:0-4 :rez!rez@rez.tmi.twitch.tv PRIVMSG #rezondes :Kappa hello : world",
        );
        assert_eq!(message.command, "PRIVMSG");
        assert_eq!(message.params, ["#rezondes", "Kappa hello : world"]);
        assert_eq!(message.tag("display-name"), "Rez Ondes");
        assert_eq!(message.prefix, "rez!rez@rez.tmi.twitch.tv");
        assert_eq!(message.login(), "rez");
        let ping = parse_irc("PING :tmi.twitch.tv");
        assert_eq!(
            ping,
            IrcMessage { command: "PING".to_owned(), params: vec!["tmi.twitch.tv".to_owned()], ..Default::default() }
        );
        assert_eq!(parse_irc(":tmi.twitch.tv CLEARCHAT #rezondes").params, ["#rezondes"]);
        assert_eq!(parse_irc("@flag :x CMD").tags.get("flag").map(String::as_str), Some(""));
    }

    #[test]
    fn garbage_never_panics() {
        for line in ["", "@", ":", "@a=b", ":prefix", " :", "@a=\\", "PRIVMSG"] {
            let _ = parse_irc(line);
        }
        assert_eq!(parse_irc("@a=x\\").tag("a"), "x\\");
    }

    #[test]
    fn twitch_emotes_by_code_points() {
        assert_eq!(split_emotes("Kappa hello Kappa", "25:0-4,12-16"), [kappa(), text(" hello "), kappa()]);
        assert_eq!(split_emotes("😀 Kappa", "25:2-6"), [text("😀 "), kappa()]);
        assert_eq!(split_emotes("just text", ""), [text("just text")]);
        assert_eq!(
            split_emotes("short", "25:3-99,1:50-60,x"),
            [text("sho"), Part::Emote { name: "rt".to_owned(), url: emote_url("25") }]
        );
    }

    #[test]
    fn emote_positions() {
        let ranges = emote_ranges("25:12-16,0-4");
        let range = |from, to| EmoteRange { id: "25".to_owned(), from, to };
        assert_eq!(ranges, [range(0, 4), range(12, 16)]);
        assert!(emote_ranges("25:a-b,4-1/").is_empty());
    }

    #[test]
    fn third_party_emotes_only_as_whole_words() {
        let extra = HashMap::from([("catJAM".to_owned(), "https://cdn.7tv.app/emote/x/2x.webp".to_owned())]);
        let cat = Part::Emote { name: "catJAM".to_owned(), url: "https://cdn.7tv.app/emote/x/2x.webp".to_owned() };
        assert_eq!(
            split_words(vec![kappa(), text(" catJAM vibes catJAMs")], &extra),
            [kappa(), text(" "), cat.clone(), text(" "), text("vibes"), text(" "), text("catJAMs")]
        );
        assert_eq!(split_words(vec![text("catJAM")], &extra), [cat]);
        assert_eq!(split_words(vec![text("hello")], &HashMap::new()), [text("hello")]);
    }

    #[test]
    fn anonymous_login_lines() {
        assert_eq!(
            anonymous_login("rezondes", 40_000),
            ["CAP REQ :twitch.tv/tags twitch.tv/commands", "PASS SCHMOOPIIE", "NICK justinfan50000", "JOIN #rezondes"]
        );
    }
}
