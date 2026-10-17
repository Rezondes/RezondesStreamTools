//! Value objects of the identity context: a Twitch login and a Twitch user ID. Both are checked on creation and on
//! deserialization, so a value of these types is always valid (template: `src/core/streamerPath.ts`, `isLogin`).

use std::fmt;

use serde::{Deserialize, Serialize};

use crate::error::InvalidValue;

/// Twitch logins: lower case letters, digits and underscore, 1 to 25 characters
const LOGIN_MAX: usize = 25;
/// Twitch user IDs: digits only, at most 20 (`toTokens` in `server/twitch.ts`)
const USER_ID_MAX: usize = 20;

/// A valid Twitch login, always lower case.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Login(String);

impl Login {
    /// Normalizes to lower case and checks the Twitch rules.
    ///
    /// # Errors
    /// When the value is empty, longer than 25 characters or contains other characters than `a-z`, `0-9` and `_`.
    pub fn parse(value: &str) -> Result<Self, InvalidValue> {
        let lower = value.to_ascii_lowercase();
        let valid = !lower.is_empty()
            && lower.len() <= LOGIN_MAX
            && lower
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_');
        if valid {
            Ok(Self(lower))
        } else {
            Err(InvalidValue::new("login"))
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// A Twitch user ID: digits only, at most 20.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct TwitchUserId(String);

impl TwitchUserId {
    /// # Errors
    /// When the value is empty, longer than 20 characters or contains anything but digits.
    pub fn parse(value: &str) -> Result<Self, InvalidValue> {
        let valid = !value.is_empty()
            && value.len() <= USER_ID_MAX
            && value.bytes().all(|byte| byte.is_ascii_digit());
        if valid {
            Ok(Self(value.to_owned()))
        } else {
            Err(InvalidValue::new("twitch user id"))
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

macro_rules! string_value {
    ($name:ident) => {
        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str(&self.0)
            }
        }

        impl TryFrom<String> for $name {
            type Error = InvalidValue;

            fn try_from(value: String) -> Result<Self, Self::Error> {
                Self::parse(&value)
            }
        }

        impl From<$name> for String {
            fn from(value: $name) -> Self {
                value.0
            }
        }
    };
}

pub(crate) use string_value;

string_value!(Login);
string_value!(TwitchUserId);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn login_accepts_twitch_characters() {
        assert_eq!(
            Login::parse("rezondes_42").map(|login| login.to_string()),
            Ok("rezondes_42".to_owned())
        );
        assert!(Login::parse("_neo").is_ok());
        assert!(Login::parse(&"a".repeat(25)).is_ok());
    }

    #[test]
    fn login_normalizes_to_lower_case() {
        assert_eq!(
            Login::parse("Rezondes").map(|login| login.as_str().to_owned()),
            Ok("rezondes".to_owned())
        );
    }

    #[test]
    fn login_rejects_invalid_values() {
        for value in ["", "a b", "neo!", "../neo", &"a".repeat(26)] {
            assert_eq!(
                Login::parse(value),
                Err(InvalidValue::new("login")),
                "{value}"
            );
        }
    }

    #[test]
    fn user_id_only_digits() {
        assert!(TwitchUserId::parse("42").is_ok());
        assert!(TwitchUserId::parse(&"9".repeat(20)).is_ok());
        for value in ["", "4a", "-1", " 42", &"9".repeat(21)] {
            assert!(TwitchUserId::parse(value).is_err(), "{value}");
        }
    }

    #[test]
    fn deserialize_rejects_invalid() {
        assert!(serde_json::from_str::<Login>("\"A B\"").is_err());
        assert!(serde_json::from_str::<TwitchUserId>("\"x\"").is_err());
        let login: Login = serde_json::from_str("\"Neo\"").expect("valid login");
        assert_eq!(serde_json::to_string(&login).expect("serialize"), "\"neo\"");
    }
}
