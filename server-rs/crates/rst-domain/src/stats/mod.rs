//! Stream stats (plans/PLAN-STATS.md, RUST-PLAN.md package 52): what happened since the streamer last reset the count.
//! Alerts and chat lines are counted; only `reset` clears the count, neither stream start nor stream end nor a restart.
//! The logins of the chatters stay inside the stored tally for the number of different chatters and are never sent out;
//! the overlays get only [`StreamStats`].

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::twitch::alerts::{Alert, AlertKind};

/// The numbers the overlays show
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct StreamStats {
    pub follows: u32,
    /// New subs and resubs
    pub subs: u32,
    /// Sum of gifted subs
    pub gifted_subs: u32,
    pub raids: u32,
    /// Sum of the viewers that came with raids
    pub raiders: u32,
    pub bits: u32,
    pub redeems: u32,
    /// Highest level a hype train reached
    pub hype_level: u32,
    pub chat_messages: u32,
    /// Different chatters
    pub chatters: u32,
    /// Start of the count in ms: the last reset, before the first reset the first counted event
    #[ts(type = "number | null")]
    pub started_at: Option<i64>,
}

/// The stored count with the chatters (encrypted in the profile)
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamTally {
    pub stats: StreamStats,
    #[serde(default)]
    chatters: BTreeSet<String>,
}

impl StreamTally {
    fn start(&mut self, now: i64) {
        self.stats.started_at.get_or_insert(now);
    }

    /// Counts an alert; the end of a hype train keeps the highest level
    pub fn record_alert(&mut self, alert: &Alert, now: i64) {
        self.start(now);
        let amount = alert.amount.unwrap_or(0);
        let stats = &mut self.stats;
        match alert.kind {
            AlertKind::Follow => stats.follows = stats.follows.saturating_add(1),
            AlertKind::Sub | AlertKind::Resub => stats.subs = stats.subs.saturating_add(1),
            AlertKind::Gift => stats.gifted_subs = stats.gifted_subs.saturating_add(amount.max(1)),
            AlertKind::Raid => {
                stats.raids = stats.raids.saturating_add(1);
                stats.raiders = stats.raiders.saturating_add(amount);
            }
            AlertKind::Cheer => stats.bits = stats.bits.saturating_add(amount),
            AlertKind::Redeem => stats.redeems = stats.redeems.saturating_add(1),
            AlertKind::Hype if alert.detail.as_deref() == Some("end") => {
                stats.hype_level = stats.hype_level.max(amount);
            }
            AlertKind::Hype => {}
        }
    }

    /// Counts a chat line of `login` (case does not matter)
    pub fn record_chat(&mut self, login: &str, now: i64) {
        self.start(now);
        self.stats.chat_messages = self.stats.chat_messages.saturating_add(1);
        if self.chatters.insert(login.to_lowercase()) {
            self.stats.chatters = u32::try_from(self.chatters.len()).unwrap_or(u32::MAX);
        }
    }

    /// Clears the count; the new count starts now
    pub fn reset(&mut self, now: i64) {
        *self =
            Self { stats: StreamStats { started_at: Some(now), ..StreamStats::default() }, chatters: BTreeSet::new() };
    }

    /// What the overlays get, without logins
    #[must_use]
    pub fn snapshot(&self) -> StreamStats {
        self.stats.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn alert(kind: AlertKind, amount: Option<u32>, detail: Option<&str>) -> Alert {
        Alert { detail: detail.map(str::to_owned), ..Alert::new(kind, "neo").amount(amount) }
    }

    #[test]
    fn alerts_count_by_kind() {
        let mut tally = StreamTally::default();
        for event in [
            alert(AlertKind::Follow, None, None),
            alert(AlertKind::Follow, None, None),
            alert(AlertKind::Sub, None, Some("1000")),
            alert(AlertKind::Resub, Some(12), Some("1000")),
            alert(AlertKind::Gift, Some(5), None),
            alert(AlertKind::Gift, None, None),
            alert(AlertKind::Raid, Some(40), None),
            alert(AlertKind::Cheer, Some(500), None),
            alert(AlertKind::Redeem, None, Some("Hydrate")),
            alert(AlertKind::Hype, Some(1), Some("begin")),
            alert(AlertKind::Hype, Some(3), Some("end")),
            alert(AlertKind::Hype, Some(2), Some("end")),
        ] {
            tally.record_alert(&event, 1000);
        }
        let stats = tally.snapshot();
        assert_eq!(
            stats,
            StreamStats {
                follows: 2,
                subs: 2,
                gifted_subs: 6,
                raids: 1,
                raiders: 40,
                bits: 500,
                redeems: 1,
                hype_level: 3,
                chat_messages: 0,
                chatters: 0,
                started_at: Some(1000),
            }
        );
    }

    #[test]
    fn chatters_are_unique_and_never_exposed() {
        let mut tally = StreamTally::default();
        tally.record_chat("Smith", 5);
        tally.record_chat("smith", 6);
        tally.record_chat("trinity", 7);
        assert_eq!((tally.snapshot().chat_messages, tally.snapshot().chatters), (3, 2));
        assert_eq!(tally.snapshot().started_at, Some(5));
        let sent = serde_json::to_string(&tally.snapshot()).expect("json");
        assert!(!sent.contains("smith") && !sent.contains("trinity"), "{sent}");
        assert!(sent.contains(r#""chatMessages":3"#) && sent.contains(r#""startedAt":5"#), "{sent}");
    }

    #[test]
    fn only_reset_clears() {
        let mut tally = StreamTally::default();
        tally.record_chat("neo", 1);
        tally.record_alert(&alert(AlertKind::Follow, None, None), 2);
        // Stored and read again (a restart): the count goes on, also the different chatters
        let mut restored: StreamTally =
            serde_json::from_str(&serde_json::to_string(&tally).expect("json")).expect("read");
        restored.record_chat("NEO", 3);
        assert_eq!(
            (restored.snapshot().follows, restored.snapshot().chatters, restored.snapshot().chat_messages),
            (1, 1, 2)
        );
        restored.reset(10);
        assert_eq!(restored.snapshot(), StreamStats { started_at: Some(10), ..StreamStats::default() });
        restored.record_chat("neo", 11);
        assert_eq!((restored.snapshot().chatters, restored.snapshot().started_at), (1, Some(10)));
    }
}
