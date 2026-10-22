//! Stream stats of a running streamer (plans/PLAN-STATS.md, RUST-PLAN.md package 52, pattern of `channel/minimes.rs`):
//! alerts and chat lines change the count, the overlays get it at most every [`SEND_DELAY`] and it is stored at most
//! every [`SAVE_DELAY`]; the runtime loads it on start, so it survives a restart. Only `reset` clears it.

use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use rst_domain::identity::values::StreamerId;
use rst_domain::stats::{StreamStats, StreamTally};
use rst_domain::twitch::alerts::Alert;
use tokio_util::sync::CancellationToken;

use crate::events::{Hubs, ServerMessage};
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::profile::Profile;
use crate::vault::VaultError;

/// Many events result in at most one save in this time
pub const SAVE_DELAY: Duration = Duration::from_secs(2);
/// fixed: protection of the SSE stream when the chat is full; the last change in this time is sent afterwards
pub const SEND_DELAY: Duration = Duration::from_secs(2);

struct Count {
    tally: StreamTally,
    save_scheduled: bool,
    send_scheduled: bool,
}

pub struct StatsRunner<S, K> {
    id: StreamerId,
    hubs: Arc<Hubs>,
    profile: Profile<S, K>,
    now: fn() -> i64,
    count: Mutex<Count>,
}

impl<S, K> StatsRunner<S, K>
where
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Reads the stored count
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn load(
        id: StreamerId,
        hubs: Arc<Hubs>,
        profile: Profile<S, K>,
        now: fn() -> i64,
    ) -> Result<Arc<Self>, VaultError> {
        let tally = profile.stats(&id).await?;
        Ok(Arc::new(Self {
            id,
            hubs,
            profile,
            now,
            count: Mutex::new(Count { tally, save_scheduled: false, send_scheduled: false }),
        }))
    }

    fn count(&self) -> MutexGuard<'_, Count> {
        self.count.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// The count for a newly connected overlay
    #[must_use]
    pub fn current(&self) -> StreamStats {
        self.count().tally.snapshot()
    }

    pub fn record_alert(self: &Arc<Self>, alert: &Alert) {
        self.change(|tally| tally.record_alert(alert));
    }

    pub fn record_chat(self: &Arc<Self>, login: &str) {
        self.change(|tally| tally.record_chat(login));
    }

    /// The stream went live: the duration starts
    pub fn online(self: &Arc<Self>) {
        let now = (self.now)();
        self.change(|tally| tally.online(now));
    }

    /// The stream ended: the duration stops
    pub fn offline(self: &Arc<Self>) {
        let now = (self.now)();
        self.change(|tally| tally.offline(now));
    }

    /// Live or ended by hand from the dashboard; returns whether the stream is live now
    pub fn toggle_live(self: &Arc<Self>) -> bool {
        let now = (self.now)();
        let mut live = false;
        self.change(|tally| live = tally.toggle_live(now));
        live
    }

    /// Clears the count, stores and sends it at once
    pub async fn reset(self: &Arc<Self>) {
        let now = (self.now)();
        self.count().tally.reset(now);
        self.save().await;
        self.hubs.emit(&self.id, &ServerMessage::Stats { stats: self.current() });
    }

    fn change(self: &Arc<Self>, apply: impl FnOnce(&mut StreamTally)) {
        let (save, send) = {
            let mut count = self.count();
            apply(&mut count.tally);
            let save = !count.save_scheduled;
            let send = !count.send_scheduled;
            count.save_scheduled = true;
            count.send_scheduled = true;
            (save, send)
        };
        if save {
            let runner = Arc::clone(self);
            tokio::spawn(async move {
                tokio::time::sleep(SAVE_DELAY).await;
                runner.save().await;
            });
        }
        if send {
            let runner = Arc::clone(self);
            tokio::spawn(async move {
                tokio::time::sleep(SEND_DELAY).await;
                runner.count().send_scheduled = false;
                runner.hubs.emit(&runner.id, &ServerMessage::Stats { stats: runner.current() });
            });
        }
    }

    /// Stores the count as it is now
    pub async fn save(&self) {
        let tally = {
            let mut count = self.count();
            count.save_scheduled = false;
            count.tally.clone()
        };
        if let Err(error) = self.profile.save_stats(&self.id, &tally, (self.now)()).await {
            eprintln!("Saving stream stats failed: {error}");
        }
    }

    /// Waits until `cancel`, then stores the count a last time
    pub async fn save_on_stop(self: Arc<Self>, cancel: CancellationToken) {
        cancel.cancelled().await;
        self.save().await;
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::twitch::alerts::AlertKind;

    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn clock() -> i64 {
        1000
    }

    async fn profile() -> Profile<MemoryRecords, MemoryKeys> {
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        Profile::new(Vault::new(MemoryRecords::default(), keys))
    }

    #[tokio::test(start_paused = true)]
    async fn throttled_send_and_save_then_reload_continues() {
        let (profile, hubs) = (profile().await, Arc::new(Hubs::default()));
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        let runner = StatsRunner::load(neo(), Arc::clone(&hubs), profile.clone(), clock).await.expect("runner");
        runner.record_alert(&Alert::new(AlertKind::Follow, "smith"));
        runner.record_chat("smith");
        runner.record_chat("trinity");
        // Nothing sent or stored before the delay; afterwards one message with the last state
        assert_eq!(profile.stats(&neo()).await.expect("stored").snapshot().follows, 0);
        tokio::time::sleep(SEND_DELAY + Duration::from_millis(10)).await;
        let sent = stream.next().await.expect("stats");
        assert!(
            sent.contains(r#""type":"stats""#) && sent.contains(r#""follows":1"#) && sent.contains(r#""chatters":2"#),
            "{sent}"
        );
        assert!(!sent.contains("smith"), "{sent}");
        assert_eq!(profile.stats(&neo()).await.expect("stored").snapshot().chat_messages, 2);
        // A restart loads the count and goes on, the same chatter does not count twice
        let again = StatsRunner::load(neo(), Arc::clone(&hubs), profile.clone(), clock).await.expect("again");
        again.record_chat("Smith");
        assert_eq!((again.current().chatters, again.current().chat_messages), (2, 3));
        // Reset clears, stores and sends at once
        assert!(again.toggle_live(), "marked live by hand");
        assert!(!again.toggle_live(), "and ended again");
        again.online();
        assert_eq!(again.current().started_at, Some(1000), "the stream started");
        again.reset().await;
        assert_eq!(again.current(), StreamStats { started_at: Some(1000), ..StreamStats::default() });
        assert_eq!(profile.stats(&neo()).await.expect("stored").snapshot().follows, 0);
        let mut found = false;
        while let Ok(Some(message)) = tokio::time::timeout(Duration::from_millis(1), stream.next()).await {
            found |= message.contains(r#""follows":0"#);
        }
        assert!(found, "reset is sent");
    }
}
