//! `EventSub` messages over the WebSocket (template: `parseMessage`, `dispatch`, `subscriptions` in
//! `server/twitch.ts`): what a message means for the connection. A message that is not JSON or has no metadata is an
//! error value, never a panic; the connection still counts it as a sign of life.

use serde_json::{Value, json};

use crate::twitch::alerts::{Alert, to_alert};

/// Without a value from the welcome Twitch expects a keepalive every 30 seconds
pub const DEFAULT_KEEPALIVE_SECONDS: u64 = 30;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EventSubMessage {
    /// Connection ready; subscriptions are requested for `session_id` (missing = none)
    Welcome {
        session_id: Option<String>,
        keepalive_seconds: u64,
    },
    Alert(Alert),
    /// The stream went live (stream stats start the duration)
    Online,
    /// The stream ended (e.g. clear minimes, stop the duration)
    Offline,
    /// Move to a new Twitch URL; the subscriptions stay
    Reconnect {
        url: String,
    },
    Revocation {
        subscription_type: String,
        status: String,
    },
    /// Keepalive, notifications without an alert and unknown types
    Ignored,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventSubError {
    NotJson,
    NoMetadata,
}

/// Only `wss://<host>.twitch.tv/...`: a reconnect never leads to a foreign server
#[must_use]
pub fn is_twitch_reconnect_url(url: &str) -> bool {
    url.strip_prefix("wss://").and_then(|rest| rest.split_once('/')).is_some_and(|(host, _)| {
        host.strip_suffix(".twitch.tv").is_some_and(|name| {
            !name.is_empty() && name.bytes().all(|byte| byte.is_ascii_alphanumeric() || b"_.-".contains(&byte))
        })
    })
}

fn text<'value>(value: &'value Value, path: &[&str]) -> Option<&'value str> {
    path.iter().try_fold(value, |current, key| current.get(key)).and_then(Value::as_str)
}

/// # Errors
/// `NotJson` for text that is not JSON, `NoMetadata` for JSON without a message type (including `null`).
pub fn parse_message(raw: &str) -> Result<EventSubMessage, EventSubError> {
    let message: Value = serde_json::from_str(raw).map_err(|_| EventSubError::NotJson)?;
    let kind = text(&message, &["metadata", "message_type"]).ok_or(EventSubError::NoMetadata)?;
    let payload = message.get("payload").unwrap_or(&Value::Null);
    let session = payload.get("session").unwrap_or(&Value::Null);
    Ok(match kind {
        "session_welcome" => EventSubMessage::Welcome {
            session_id: text(session, &["id"]).map(str::to_owned),
            keepalive_seconds: session
                .get("keepalive_timeout_seconds")
                .and_then(Value::as_u64)
                .unwrap_or(DEFAULT_KEEPALIVE_SECONDS),
        },
        "notification" => match text(&message, &["metadata", "subscription_type"]).unwrap_or_default() {
            "stream.online" => EventSubMessage::Online,
            "stream.offline" => EventSubMessage::Offline,
            subscription_type => to_alert(subscription_type, payload.get("event").unwrap_or(&Value::Null))
                .map_or(EventSubMessage::Ignored, EventSubMessage::Alert),
        },
        "session_reconnect" => match text(session, &["reconnect_url"]) {
            Some(url) if is_twitch_reconnect_url(url) => EventSubMessage::Reconnect { url: url.to_owned() },
            _ => EventSubMessage::Ignored,
        },
        "revocation" => EventSubMessage::Revocation {
            subscription_type: text(payload, &["subscription", "type"]).unwrap_or_default().to_owned(),
            status: text(payload, &["subscription", "status"]).unwrap_or_default().to_owned(),
        },
        _ => EventSubMessage::Ignored,
    })
}

/// Subscriptions of a channel (type, version and condition as Twitch requires them), without the transport
#[must_use]
pub fn subscriptions(user_id: &str) -> Vec<Value> {
    let broadcaster = json!({ "broadcaster_user_id": user_id });
    let entry = |kind: &str, version: &str, condition: &Value| json!({ "type": kind, "version": version, "condition": condition });
    vec![
        entry("channel.follow", "2", &json!({ "broadcaster_user_id": user_id, "moderator_user_id": user_id })),
        entry("channel.subscribe", "1", &broadcaster),
        entry("channel.subscription.message", "1", &broadcaster),
        entry("channel.subscription.gift", "1", &broadcaster),
        entry("channel.cheer", "1", &broadcaster),
        entry("channel.raid", "1", &json!({ "to_broadcaster_user_id": user_id })),
        entry("channel.channel_points_custom_reward_redemption.add", "1", &broadcaster),
        entry("channel.hype_train.begin", "2", &broadcaster),
        entry("channel.hype_train.end", "2", &broadcaster),
        // Stream started and ended, need no scope
        entry("stream.online", "1", &broadcaster),
        entry("stream.offline", "1", &broadcaster),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::twitch::alerts::AlertKind;

    fn parse(message: &Value) -> Result<EventSubMessage, EventSubError> {
        parse_message(&message.to_string())
    }

    #[test]
    fn welcome_with_session_and_keepalive() {
        let welcome = json!({ "metadata": { "message_type": "session_welcome" }, "payload": { "session": { "id": "session-1", "keepalive_timeout_seconds": 10 } } });
        assert_eq!(
            parse(&welcome),
            Ok(EventSubMessage::Welcome { session_id: Some("session-1".to_owned()), keepalive_seconds: 10 })
        );
        let bare = json!({ "metadata": { "message_type": "session_welcome" } });
        assert_eq!(parse(&bare), Ok(EventSubMessage::Welcome { session_id: None, keepalive_seconds: 30 }));
    }

    #[test]
    fn notifications_alerts_and_offline() {
        let follow = json!({ "metadata": { "message_type": "notification", "subscription_type": "channel.follow" }, "payload": { "event": { "user_name": "neo" } } });
        assert_eq!(parse(&follow), Ok(EventSubMessage::Alert(Alert::new(AlertKind::Follow, "neo"))));
        let offline = json!({ "metadata": { "message_type": "notification", "subscription_type": "stream.offline" }, "payload": { "event": {} } });
        assert_eq!(parse(&offline), Ok(EventSubMessage::Offline));
        let online = json!({ "metadata": { "message_type": "notification", "subscription_type": "stream.online" }, "payload": { "event": {} } });
        assert_eq!(parse(&online), Ok(EventSubMessage::Online));
        let unknown = json!({ "metadata": { "message_type": "notification", "subscription_type": "channel.unknown" } });
        assert_eq!(parse(&unknown), Ok(EventSubMessage::Ignored));
        let revoked = json!({ "metadata": { "message_type": "revocation" }, "payload": { "subscription": { "type": "channel.cheer", "status": "authorization_revoked" } } });
        assert_eq!(
            parse(&revoked),
            Ok(EventSubMessage::Revocation {
                subscription_type: "channel.cheer".to_owned(),
                status: "authorization_revoked".to_owned()
            })
        );
        assert_eq!(
            parse(&json!({ "metadata": { "message_type": "session_keepalive" } })),
            Ok(EventSubMessage::Ignored)
        );
    }

    #[test]
    fn reconnect_only_to_twitch() {
        let reconnect = |url: &str| json!({ "metadata": { "message_type": "session_reconnect" }, "payload": { "session": { "reconnect_url": url } } });
        assert_eq!(parse(&reconnect("wss://evil.example/ws")), Ok(EventSubMessage::Ignored));
        assert_eq!(
            parse(&reconnect("wss://eventsub.wss.twitch.tv/ws?id=2")),
            Ok(EventSubMessage::Reconnect { url: "wss://eventsub.wss.twitch.tv/ws?id=2".to_owned() })
        );
        for url in [
            "wss://twitch.tv/ws",
            "wss://a.twitch.tv.evil.example/ws",
            "ws://eventsub.twitch.tv/ws",
            "wss://a@b.twitch.tv/",
        ] {
            assert!(!is_twitch_reconnect_url(url), "{url}");
        }
    }

    #[test]
    fn null_and_garbage_are_errors() {
        assert_eq!(parse_message("not json"), Err(EventSubError::NotJson));
        assert_eq!(parse_message("null"), Err(EventSubError::NoMetadata));
        assert_eq!(parse_message("{}"), Err(EventSubError::NoMetadata));
        assert_eq!(parse_message("[1,2]"), Err(EventSubError::NoMetadata));
        assert_eq!(parse_message(r#"{"metadata":null}"#), Err(EventSubError::NoMetadata));
        assert_eq!(
            parse_message(r#"{"metadata":{"message_type":"notification"},"payload":null}"#),
            Ok(EventSubMessage::Ignored)
        );
    }

    #[test]
    fn eleven_subscriptions_with_stream_online_and_offline() {
        let all = subscriptions("42");
        assert_eq!(all.len(), 11);
        assert_eq!(all[0]["condition"], json!({ "broadcaster_user_id": "42", "moderator_user_id": "42" }));
        assert!(all.iter().any(|entry| entry["type"] == "stream.offline"));
        assert!(all.iter().any(|entry| entry["type"] == "stream.online"));
    }
}
