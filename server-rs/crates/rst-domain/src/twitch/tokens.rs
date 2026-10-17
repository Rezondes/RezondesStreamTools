//! Twitch tokens of a streamer (template: `toTokens` and the scopes in `server/twitch.ts`): only complete tokens with
//! a valid login and a numeric user ID count.

use std::fmt;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::identity::values::{Login, TwitchUserId};

/// Reply to the help command as the streamer in their own chat
pub const CHAT_SCOPE: &str = "user:write:chat";
pub const SCOPES: [&str; 6] = [
    "moderator:read:followers",
    "channel:read:subscriptions",
    "bits:read",
    "channel:read:redemptions",
    "channel:read:hype_train",
    CHAT_SCOPE,
];

/// Secrets are never shown in `Debug`
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TwitchTokens {
    pub access: String,
    pub refresh: String,
    #[serde(rename = "userId")]
    pub user_id: TwitchUserId,
    pub login: Login,
}

impl fmt::Debug for TwitchTokens {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("TwitchTokens")
            .field("user_id", &self.user_id)
            .field("login", &self.login)
            .finish_non_exhaustive()
    }
}

/// Only known fields with valid values, otherwise `None`; for the stored tokens and answers from Twitch
#[must_use]
pub fn to_tokens(value: &Value) -> Option<TwitchTokens> {
    let text = |key: &str| value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty());
    Some(TwitchTokens {
        access: text("access")?.to_owned(),
        refresh: text("refresh")?.to_owned(),
        user_id: TwitchUserId::parse(text("userId")?).ok()?,
        login: Login::parse(text("login")?).ok()?,
    })
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn tokens() -> Value {
        json!({ "access": "access-1", "refresh": "refresh-1", "userId": "42", "login": "rezondes" })
    }

    #[test]
    fn only_complete_tokens() {
        let mut extra = tokens();
        extra["extra"] = json!("gone");
        let parsed = to_tokens(&extra).expect("tokens");
        assert_eq!(serde_json::to_value(&parsed).expect("json"), tokens());
        assert_eq!(to_tokens(&Value::Null), None);
        assert_eq!(to_tokens(&json!("text")), None);
        for (key, bad) in
            [("access", json!("")), ("refresh", json!(1)), ("userId", json!("abc")), ("login", json!("Not A Login"))]
        {
            let mut broken = tokens();
            broken[key] = bad;
            assert_eq!(to_tokens(&broken), None, "{key}");
        }
    }

    #[test]
    fn debug_hides_the_secrets() {
        let debug = format!("{:?}", to_tokens(&tokens()).expect("tokens"));
        assert!(!debug.contains("access-1") && !debug.contains("refresh-1"));
        assert!(debug.contains("rezondes"));
    }

    #[test]
    fn scopes_include_writing_to_chat() {
        assert!(SCOPES.contains(&"channel:read:subscriptions"));
        assert!(SCOPES.contains(&CHAT_SCOPE));
    }
}
