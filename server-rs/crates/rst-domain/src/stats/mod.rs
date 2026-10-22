//! Stream stats (plans/PLAN-STATS.md, RUST-PLAN.md package 52): what happened since the streamer last reset the count.
//! Alerts and chat lines are counted; only `reset` clears the count, neither stream start nor stream end nor a restart.
//! The duration runs only while the stream is live: from `stream.online` to `stream.offline`.
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
    /// Start of the stream in ms (`stream.online`); null when no stream started since the last reset
    #[ts(type = "number | null")]
    pub started_at: Option<i64>,
    /// End of the stream in ms (`stream.offline`); null while the stream is live
    #[ts(type = "number | null")]
    pub ended_at: Option<i64>,
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
    /// Counts an alert; the end of a hype train keeps the highest level
    pub fn record_alert(&mut self, alert: &Alert) {
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
    pub fn record_chat(&mut self, login: &str) {
        self.stats.chat_messages = self.stats.chat_messages.saturating_add(1);
        if self.chatters.insert(login.to_lowercase()) {
            self.stats.chatters = u32::try_from(self.chatters.len()).unwrap_or(u32::MAX);
        }
    }

    /// The stream went live: the duration starts now
    pub fn online(&mut self, now: i64) {
        self.stats.started_at = Some(now);
        self.stats.ended_at = None;
    }

    /// The stream ended: the duration stops now (no effect without a start)
    pub fn offline(&mut self, now: i64) {
        if self.live() {
            self.stats.ended_at = Some(now);
        }
    }

    fn live(&self) -> bool {
        self.stats.started_at.is_some() && self.stats.ended_at.is_none()
    }

    /// Clears the count; during a live stream the duration starts again now, otherwise with the next stream
    pub fn reset(&mut self, now: i64) {
        let started_at = self.live().then_some(now);
        *self = Self { stats: StreamStats { started_at, ..StreamStats::default() }, chatters: BTreeSet::new() };
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
            tally.record_alert(&event);
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
                ..StreamStats::default()
            }
        );
    }

    #[test]
    fn chatters_are_unique_and_never_exposed() {
        let mut tally = StreamTally::default();
        tally.record_chat("Smith");
        tally.record_chat("smith");
        tally.record_chat("trinity");
        assert_eq!((tally.snapshot().chat_messages, tally.snapshot().chatters), (3, 2));
        assert_eq!(tally.snapshot().started_at, None, "chat alone starts no duration");
        let sent = serde_json::to_string(&tally.snapshot()).expect("json");
        assert!(!sent.contains("smith") && !sent.contains("trinity"), "{sent}");
        assert!(sent.contains(r#""chatMessages":3"#) && sent.contains(r#""startedAt":null"#), "{sent}");
    }

    #[test]
    fn only_reset_clears() {
        let mut tally = StreamTally::default();
        tally.record_chat("neo");
        tally.record_alert(&alert(AlertKind::Follow, None, None));
        // Stored and read again (a restart): the count goes on, also the different chatters
        let mut restored: StreamTally =
            serde_json::from_str(&serde_json::to_string(&tally).expect("json")).expect("read");
        restored.record_chat("NEO");
        assert_eq!(
            (restored.snapshot().follows, restored.snapshot().chatters, restored.snapshot().chat_messages),
            (1, 1, 2)
        );
        restored.reset(10);
        assert_eq!(restored.snapshot(), StreamStats::default(), "offline: the duration waits for the next stream");
        restored.record_chat("neo");
        assert_eq!((restored.snapshot().chatters, restored.snapshot().started_at), (1, None));
    }

    #[test]
    fn duration_runs_only_while_live() {
        let mut tally = StreamTally::default();
        tally.offline(5);
        assert_eq!((tally.snapshot().started_at, tally.snapshot().ended_at), (None, None), "no end without a start");
        tally.online(100);
        assert_eq!((tally.snapshot().started_at, tally.snapshot().ended_at), (Some(100), None));
        tally.offline(400);
        tally.offline(900);
        assert_eq!(
            (tally.snapshot().started_at, tally.snapshot().ended_at),
            (Some(100), Some(400)),
            "the first end counts"
        );
        tally.online(1000);
        assert_eq!(
            (tally.snapshot().started_at, tally.snapshot().ended_at),
            (Some(1000), None),
            "a new stream starts again"
        );
        tally.reset(1200);
        assert_eq!(tally.snapshot().started_at, Some(1200), "reset while live starts the duration now");
    }
}
