//! Search patterns of chat triggers (template: `toRegex` in `server/triggers.ts`). The `regex` crate matches in
//! linear time, so a catastrophic pattern cannot block the server and the worker of `server/regexMatch.ts` is not
//! needed. It has no lookaround: `word` and `command` check the neighbour characters themselves, and `regex`
//! triggers with backreferences or lookaround are rejected.

use regex::{Regex, RegexBuilder};

/// Longest search text or pattern of a trigger
pub const MAX_PATTERN: usize = 500;
/// Memory limit for a compiled pattern, against huge repetitions like `a{1000}{1000}`
const SIZE_LIMIT: usize = 1 << 20;

/// How a trigger matches a chat message
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WhenKind {
    /// Whole word anywhere: no letter, digit or `_` directly before or after
    Word,
    /// Substring
    Contains,
    /// The whole message (spaces around allowed)
    Exact,
    /// The message starts with this word
    Command,
    /// Regular expression of the streamer
    Regex,
}

impl WhenKind {
    pub const NAMES: [&'static str; 5] = ["word", "contains", "exact", "command", "regex"];

    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "word" => Some(Self::Word),
            "contains" => Some(Self::Contains),
            "exact" => Some(Self::Exact),
            "command" => Some(Self::Command),
            "regex" => Some(Self::Regex),
            _ => None,
        }
    }
}

/// A compiled search pattern
#[derive(Debug, Clone)]
pub struct Pattern {
    kind: WhenKind,
    regex: Regex,
}

/// Why a pattern cannot be used; the texts are shown in the trigger editor (German UI)
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PatternError {
    TooLong,
    Unsupported,
    Invalid,
}

impl PatternError {
    #[must_use]
    pub const fn message(&self) -> &'static str {
        match self {
            Self::TooLong => "Suchtext länger als 500 Zeichen",
            Self::Unsupported => "Muster mit Rückverweis oder Lookaround nicht erlaubt",
            Self::Invalid => "Muster ungültig",
        }
    }
}

fn is_word_character(character: char) -> bool {
    character.is_alphanumeric() || character == '_'
}

impl Pattern {
    /// # Errors
    /// When the text is too long, a regex has backreferences or lookaround, or it is not a valid pattern.
    pub fn compile(kind: WhenKind, text: &str, case_sensitive: bool) -> Result<Self, PatternError> {
        if text.chars().count() > MAX_PATTERN {
            return Err(PatternError::TooLong);
        }
        let source = match kind {
            WhenKind::Word | WhenKind::Contains | WhenKind::Command => regex::escape(text),
            WhenKind::Exact => format!(r"^\s*{}\s*$", regex::escape(text)),
            WhenKind::Regex => text.to_owned(),
        };
        let regex =
            RegexBuilder::new(&source).case_insensitive(!case_sensitive).size_limit(SIZE_LIMIT).build().map_err(
                |error| {
                    let message = error.to_string();
                    if message.contains("look-around") || message.contains("backreference") {
                        PatternError::Unsupported
                    } else {
                        PatternError::Invalid
                    }
                },
            )?;
        Ok(Self { kind, regex })
    }

    #[must_use]
    pub fn matches(&self, message: &str) -> bool {
        match self.kind {
            WhenKind::Word => self.regex.find_iter(message).any(|found| {
                let before = message[..found.start()].chars().next_back();
                let after = message[found.end()..].chars().next();
                !before.is_some_and(is_word_character) && !after.is_some_and(is_word_character)
            }),
            WhenKind::Command => self.regex.find(message).is_some_and(|found| {
                found.start() == 0 && message[found.end()..].chars().next().is_none_or(char::is_whitespace)
            }),
            WhenKind::Contains | WhenKind::Exact | WhenKind::Regex => self.regex.is_match(message),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::time::Instant;

    use super::*;

    fn pattern(kind: WhenKind, text: &str) -> Pattern {
        Pattern::compile(kind, text, false).expect("valid pattern")
    }

    #[test]
    fn word_needs_boundaries_without_letters_digits_or_underscore() {
        let word = pattern(WhenKind::Word, "LIZARD");
        assert!(word.matches("LIZARD"));
        assert!(word.matches("lol lizard!"));
        assert!(word.matches("🦎LIZARD🦎"));
        assert!(!word.matches("LIZARDS"));
        assert!(!word.matches("bigLIZARD"));
        assert!(!word.matches("lizard_"));
        assert!(word.matches("bigLIZARD and lizard"));
        assert!(!Pattern::compile(WhenKind::Word, "LIZARD", true).expect("valid").matches("lizard"));
    }

    #[test]
    fn command_exact_contains_and_regex() {
        assert!(pattern(WhenKind::Command, "!lizard").matches("!lizard please"));
        assert!(pattern(WhenKind::Command, "!lizard").matches("!lizard"));
        assert!(!pattern(WhenKind::Command, "!lizard").matches("say !lizard"));
        assert!(!pattern(WhenKind::Command, "!lizard").matches("!lizards"));
        assert!(pattern(WhenKind::Exact, "gg").matches(" GG "));
        assert!(!pattern(WhenKind::Exact, "gg").matches("gg wp"));
        assert!(pattern(WhenKind::Contains, "a+b").matches("xa+by"));
        assert!(pattern(WhenKind::Regex, "^l+i+z+").matches("llllizzz"));
    }

    #[test]
    fn linear() {
        let evil = pattern(WhenKind::Regex, "^(a+)+$");
        let text = format!("{}!", "a".repeat(10_000));
        let started = Instant::now();
        assert!(!evil.matches(&text));
        assert!(started.elapsed().as_millis() < 50, "took {:?}", started.elapsed());
    }

    #[test]
    fn rejects_backrefs_and_lookaround() {
        for source in [r"(a)\1", "(?<=a)b", "a(?=b)", "a(?!b)"] {
            assert_eq!(
                Pattern::compile(WhenKind::Regex, source, false).map(|_| ()),
                Err(PatternError::Unsupported),
                "{source}"
            );
        }
        assert_eq!(PatternError::Unsupported.message(), "Muster mit Rückverweis oder Lookaround nicht erlaubt");
        assert_eq!(Pattern::compile(WhenKind::Regex, "(", false).map(|_| ()), Err(PatternError::Invalid));
    }

    #[test]
    fn long_patterns_are_rejected() {
        let long = "a".repeat(501);
        assert_eq!(Pattern::compile(WhenKind::Contains, &long, false).map(|_| ()), Err(PatternError::TooLong));
        assert!(Pattern::compile(WhenKind::Contains, &"a".repeat(500), false).is_ok());
        assert_eq!(Pattern::compile(WhenKind::Regex, "a{1000}{1000}", false).map(|_| ()), Err(PatternError::Invalid));
    }
}
