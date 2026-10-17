//! Alerts for the overlays (template: `toAlert`, `SAMPLE_ALERTS` in `server/twitch.ts`, `Alert` in
//! `src/core/types.ts`): `EventSub` events become alerts; one sample per kind for the test buttons. The names
//! "Anonym" and the sample texts are UI copy and stay German.

use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum AlertKind {
    Follow,
    Sub,
    Resub,
    Gift,
    Raid,
    Cheer,
    Redeem,
    Hype,
}

impl AlertKind {
    pub const ALL: [Self; 8] =
        [Self::Follow, Self::Sub, Self::Resub, Self::Gift, Self::Raid, Self::Cheer, Self::Redeem, Self::Hype];

    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL
            .into_iter()
            .find(|kind| serde_json::to_value(kind).ok().as_ref().and_then(Value::as_str) == Some(value))
    }
}

/// `detail`: sub tier (sub, resub), name of the reward (redeem), `begin` or `end` (hype)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Alert {
    pub kind: AlertKind,
    pub user: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub amount: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub detail: Option<String>,
}

impl Alert {
    #[must_use]
    pub fn new(kind: AlertKind, user: &str) -> Self {
        Self { kind, user: user.to_owned(), amount: None, text: None, detail: None }
    }

    #[must_use]
    pub const fn amount(mut self, amount: Option<u32>) -> Self {
        self.amount = amount;
        self
    }

    #[must_use]
    pub fn text(mut self, text: Option<String>) -> Self {
        self.text = text.filter(|text| !text.is_empty());
        self
    }

    #[must_use]
    pub fn detail(mut self, detail: Option<String>) -> Self {
        self.detail = detail;
        self
    }
}

static EVENT_CHEERMOTE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\b[a-zA-Z]+\d+\b").expect("valid pattern"));

/// Cheermotes like `Cheer100` do not belong in the alert text
#[must_use]
pub fn without_cheermotes(text: &str, cheermote: &Regex) -> String {
    cheermote.replace_all(text, "").trim().to_owned()
}

fn string(event: &Value, key: &str) -> Option<String> {
    event.get(key).and_then(Value::as_str).map(str::to_owned)
}

fn number(event: &Value, key: &str) -> Option<u32> {
    event.get(key).and_then(Value::as_u64).and_then(|value| u32::try_from(value).ok())
}

fn tier(event: &Value) -> Option<String> {
    match event.get("tier").and_then(Value::as_str) {
        Some("2000") => Some("Tier 2".to_owned()),
        Some("3000") => Some("Tier 3".to_owned()),
        _ => None,
    }
}

/// `message` is a text or `{ text }` depending on the event
fn message_text(event: &Value) -> String {
    match event.get("message") {
        Some(Value::String(text)) => text.clone(),
        Some(message) => string(message, "text").unwrap_or_default(),
        None => String::new(),
    }
}

/// `EventSub` event to an alert; `None` = no alert
#[must_use]
pub fn to_alert(subscription_type: &str, event: &Value) -> Option<Alert> {
    let user = string(event, "user_name").unwrap_or_default();
    // Gifts and bits may be anonymous
    let anonymous = event.get("is_anonymous").and_then(Value::as_bool) == Some(true) || user.is_empty();
    let giver = if anonymous { "Anonym" } else { &user };
    let hype = |detail: &str| {
        Alert::new(AlertKind::Hype, "HYPE TRAIN").amount(number(event, "level")).detail(Some(detail.to_owned()))
    };
    Some(match subscription_type {
        "channel.follow" => Alert::new(AlertKind::Follow, &user),
        // channel.subscription.gift already reports gifted subs, otherwise there would be one alert per recipient
        "channel.subscribe" if event.get("is_gift").and_then(Value::as_bool) == Some(true) => return None,
        "channel.subscribe" => Alert::new(AlertKind::Sub, &user).detail(tier(event)),
        "channel.subscription.message" => Alert::new(AlertKind::Resub, &user)
            .amount(number(event, "cumulative_months"))
            .text(Some(message_text(event)))
            .detail(tier(event)),
        "channel.subscription.gift" => Alert::new(AlertKind::Gift, giver).amount(number(event, "total")),
        "channel.cheer" => Alert::new(AlertKind::Cheer, giver)
            .amount(number(event, "bits"))
            .text(Some(without_cheermotes(&message_text(event), &EVENT_CHEERMOTE))),
        "channel.raid" => Alert::new(AlertKind::Raid, &string(event, "from_broadcaster_user_name").unwrap_or_default())
            .amount(number(event, "viewers")),
        "channel.channel_points_custom_reward_redemption.add" => {
            let reward = event.get("reward").unwrap_or(&Value::Null);
            Alert::new(AlertKind::Redeem, &user)
                .amount(number(reward, "cost"))
                .detail(string(reward, "title"))
                .text(string(event, "user_input"))
        }
        "channel.hype_train.begin" => hype("begin"),
        "channel.hype_train.end" => hype("end"),
        _ => return None,
    })
}

/// One sample per kind for the test buttons in the dashboard
#[must_use]
pub fn sample_alert(kind: AlertKind) -> Alert {
    let text = |value: &str| Some(value.to_owned());
    match kind {
        AlertKind::Follow => Alert::new(kind, "neo_42"),
        AlertKind::Sub => Alert::new(kind, "Trinity").text(text("Endlich abonniert!")),
        AlertKind::Resub => {
            Alert::new(kind, "MorpheusTV").amount(Some(12)).text(text("Ein Jahr schon!")).detail(text("Tier 2"))
        }
        AlertKind::Gift => Alert::new(kind, "Oracle").amount(Some(5)),
        AlertKind::Cheer => Alert::new(kind, "Tank").amount(Some(500)).text(text("Nimm das!")),
        AlertKind::Raid => Alert::new(kind, "agent_smith").amount(Some(42)),
        AlertKind::Redeem => {
            Alert::new(kind, "Dozer").amount(Some(500)).detail(text("Hydrieren!")).text(text("Trink was!"))
        }
        AlertKind::Hype => Alert::new(kind, "HYPE TRAIN").amount(Some(3)).detail(text("end")),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn alert(value: Value) -> Alert {
        serde_json::from_value(value).expect("alert")
    }

    #[test]
    fn subscriptions_become_alerts() {
        assert_eq!(
            to_alert("channel.follow", &json!({ "user_name": "neo" })),
            Some(alert(json!({ "kind": "follow", "user": "neo" })))
        );
        assert_eq!(
            to_alert("channel.subscribe", &json!({ "user_name": "neo", "tier": "2000" })),
            Some(alert(json!({ "kind": "sub", "user": "neo", "detail": "Tier 2" })))
        );
        assert_eq!(
            to_alert("channel.subscribe", &json!({ "user_name": "neo", "tier": "1000" })),
            Some(alert(json!({ "kind": "sub", "user": "neo" })))
        );
        assert_eq!(to_alert("channel.subscribe", &json!({ "user_name": "neo", "is_gift": true })), None);
        assert_eq!(
            to_alert(
                "channel.subscription.message",
                &json!({ "user_name": "neo", "cumulative_months": 12, "message": { "text": "hi" }, "tier": "3000" })
            ),
            Some(alert(json!({ "kind": "resub", "user": "neo", "amount": 12, "text": "hi", "detail": "Tier 3" })))
        );
        assert_eq!(
            to_alert("channel.subscription.gift", &json!({ "user_name": null, "is_anonymous": true, "total": 5 })),
            Some(alert(json!({ "kind": "gift", "user": "Anonym", "amount": 5 })))
        );
    }

    #[test]
    fn cheers_raids_redeems_and_hype() {
        assert_eq!(
            to_alert("channel.cheer", &json!({ "user_name": "tank", "bits": 100, "message": "Cheer100 take that" })),
            Some(alert(json!({ "kind": "cheer", "user": "tank", "amount": 100, "text": "take that" })))
        );
        assert_eq!(
            to_alert("channel.cheer", &json!({ "user_name": "tank", "bits": 1, "message": "Cheer1" })),
            Some(alert(json!({ "kind": "cheer", "user": "tank", "amount": 1 })))
        );
        assert_eq!(
            to_alert("channel.raid", &json!({ "from_broadcaster_user_name": "smith", "viewers": 42 })),
            Some(alert(json!({ "kind": "raid", "user": "smith", "amount": 42 })))
        );
        assert_eq!(
            to_alert(
                "channel.channel_points_custom_reward_redemption.add",
                &json!({ "user_name": "dozer", "reward": { "cost": 500, "title": "Trinken" }, "user_input": "" })
            ),
            Some(alert(json!({ "kind": "redeem", "user": "dozer", "amount": 500, "detail": "Trinken" })))
        );
        assert_eq!(
            to_alert("channel.hype_train.begin", &json!({ "level": 2 })),
            Some(alert(json!({ "kind": "hype", "user": "HYPE TRAIN", "amount": 2, "detail": "begin" })))
        );
        assert_eq!(
            to_alert("channel.hype_train.end", &json!({ "level": 3 })),
            Some(alert(json!({ "kind": "hype", "user": "HYPE TRAIN", "amount": 3, "detail": "end" })))
        );
        assert_eq!(to_alert("channel.unknown", &json!({})), None);
        assert_eq!(to_alert("channel.follow", &Value::Null), Some(Alert::new(AlertKind::Follow, "")));
    }

    #[test]
    fn one_sample_per_kind_and_known_kinds_only() {
        for kind in AlertKind::ALL {
            assert_eq!(sample_alert(kind).kind, kind);
        }
        assert_eq!(AlertKind::parse("raid"), Some(AlertKind::Raid));
        assert_eq!(AlertKind::parse("constructor"), None);
        assert_eq!(
            serde_json::to_value(sample_alert(AlertKind::Gift)).expect("json"),
            json!({ "kind": "gift", "user": "Oracle", "amount": 5 })
        );
    }
}
