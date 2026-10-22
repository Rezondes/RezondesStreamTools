//! Live messages to the overlays (template: `server/streamHub.ts` and `ServerMessage` in `src/core/types.ts`): one
//! broadcast channel per streamer. A client that does not read falls behind the channel and is dropped instead of
//! the server buffering for it; at most [`MAX_STREAMS`] streams per streamer. Overlays and dashboard logs
//! (watchers) get the same messages, only overlays count as someone watching.
//!
//! Besides that every streamer has a channel of [`DashboardChange`]s that outlives the runtime: an open dashboard
//! loads a part again when the server says it changed, instead of asking every few seconds.

use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use rst_domain::chat::events::{ChatMessage, ChatRemoval};
use rst_domain::identity::values::StreamerId;
use rst_domain::minimes::roster::Minime;
use rst_domain::settings::file::PublicSettings;
use rst_domain::spotify::Track;
use rst_domain::stats::StreamStats;
use rst_domain::triggers::FxEvent;
use rst_domain::twitch::alerts::Alert;
use serde::Serialize;
use tokio::sync::broadcast;
use ts_rs::TS;

/// Server protection limit against connection floods
pub const MAX_STREAMS: usize = 50;
/// Messages a client may fall behind before it is dropped
const CAPACITY: usize = 256;

/// A message to the overlays (SSE). `minimes`: the whole current list; `minimeChat`: this chatter wrote.
#[derive(Debug, Clone, PartialEq, Serialize, TS)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "alert")]
    Alert { alert: Alert },
    #[serde(rename = "music")]
    Music { track: Option<Track> },
    #[serde(rename = "fx")]
    Fx { event: FxEvent },
    #[serde(rename = "settings")]
    Settings { settings: PublicSettings },
    #[serde(rename = "minimes")]
    Minimes { minimes: Vec<Minime> },
    #[serde(rename = "minimeChat")]
    MinimeChat { login: String },
    #[serde(rename = "chat")]
    Chat { message: ChatMessage },
    #[serde(rename = "remove")]
    Remove { removal: ChatRemoval },
    #[serde(rename = "stats")]
    Stats { stats: StreamStats },
}

/// What changed for the dashboard of a streamer; the dashboard loads that part again
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum DashboardChange {
    /// `/api/me`: `EventSub`, runtime, Spotify connection, theme, preferences, overlay key, features
    Account,
    /// `/api/spotify`: track, account, whether it is asked (an overlay is open)
    Spotify,
    /// The server-wide backups (admins only)
    Backups,
}

/// Changes a dashboard may fall behind before it misses some (it then loads everything again on reconnect)
const DASHBOARD_CAPACITY: usize = 16;

#[derive(Debug)]
struct Channel {
    sender: broadcast::Sender<Arc<str>>,
    overlays: Arc<AtomicUsize>,
    watchers: Arc<AtomicUsize>,
}

impl Channel {
    fn new() -> Self {
        Self { sender: broadcast::channel(CAPACITY).0, overlays: Arc::default(), watchers: Arc::default() }
    }

    fn streams(&self) -> usize {
        self.overlays.load(Ordering::SeqCst) + self.watchers.load(Ordering::SeqCst)
    }
}

/// One open stream; dropping it frees its place. An overlay that closes tells the dashboard (`dashboard`), Spotify
/// is asked only while one is open.
#[derive(Debug)]
pub struct Subscription {
    receiver: broadcast::Receiver<Arc<str>>,
    counter: Arc<AtomicUsize>,
    dashboard: Option<broadcast::Sender<DashboardChange>>,
}

impl Subscription {
    /// The next message as JSON; `None` when the client fell behind or the channel closed: end the stream
    pub async fn next(&mut self) -> Option<Arc<str>> {
        // Lagged (fell behind) and Closed both end the stream
        self.receiver.recv().await.ok()
    }
}

impl Drop for Subscription {
    fn drop(&mut self) {
        self.counter.fetch_sub(1, Ordering::SeqCst);
        if let Some(dashboard) = &self.dashboard {
            // An error only means no dashboard is open
            let _ = dashboard.send(DashboardChange::Spotify);
        }
    }
}

#[derive(Debug, Default)]
pub struct Hubs {
    channels: Mutex<HashMap<StreamerId, Channel>>,
    dashboards: Mutex<HashMap<StreamerId, broadcast::Sender<DashboardChange>>>,
}

impl Hubs {
    fn channels(&self) -> MutexGuard<'_, HashMap<StreamerId, Channel>> {
        self.channels.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn dashboards(&self) -> MutexGuard<'_, HashMap<StreamerId, broadcast::Sender<DashboardChange>>> {
        self.dashboards.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn dashboard(&self, id: &StreamerId) -> broadcast::Sender<DashboardChange> {
        self.dashboards().entry(id.clone()).or_insert_with(|| broadcast::channel(DASHBOARD_CAPACITY).0).clone()
    }

    /// Tells the open dashboards of the streamer what changed; without one nothing happens
    pub fn changed(&self, id: &StreamerId, change: DashboardChange) {
        if let Some(sender) = self.dashboards().get(id) {
            // An error only means no dashboard is open
            let _ = sender.send(change);
        }
    }

    /// Tells every open dashboard (access or feature levels changed for everyone)
    pub fn changed_everywhere(&self, change: DashboardChange) {
        for sender in self.dashboards().values() {
            let _ = sender.send(change);
        }
    }

    /// The changes for a newly opened dashboard; `None` when the streamer already has [`MAX_STREAMS`] of them
    pub fn watch_dashboard(&self, id: &StreamerId) -> Option<broadcast::Receiver<DashboardChange>> {
        let sender = self.dashboard(id);
        (sender.receiver_count() < MAX_STREAMS).then(|| sender.subscribe())
    }

    /// Sends to every open stream of the streamer; without streams the message is dropped
    pub fn emit(&self, id: &StreamerId, message: &ServerMessage) {
        let Ok(json) = serde_json::to_string(message) else { return };
        if let Some(channel) = self.channels().get(id) {
            // An error only means nobody listens
            let _ = channel.sender.send(Arc::from(json));
        }
    }

    /// A new stream; `None` when the streamer already has [`MAX_STREAMS`]
    pub fn subscribe(&self, id: &StreamerId, watcher: bool) -> Option<Subscription> {
        let mut channels = self.channels();
        let channel = channels.entry(id.clone()).or_insert_with(Channel::new);
        if channel.streams() >= MAX_STREAMS {
            return None;
        }
        let counter = Arc::clone(if watcher { &channel.watchers } else { &channel.overlays });
        counter.fetch_add(1, Ordering::SeqCst);
        let receiver = channel.sender.subscribe();
        drop(channels);
        // A new overlay may start the asking of Spotify, its end may stop it
        let dashboard = (!watcher).then(|| self.dashboard(id));
        if let Some(dashboard) = &dashboard {
            let _ = dashboard.send(DashboardChange::Spotify);
        }
        Some(Subscription { receiver, counter, dashboard })
    }

    /// Open overlays (without dashboard logs): someone is watching
    pub fn overlay_count(&self, id: &StreamerId) -> usize {
        self.channels().get(id).map_or(0, |channel| channel.overlays.load(Ordering::SeqCst))
    }

    /// Ends every stream of the streamer (runtime stopped, access revoked)
    pub fn close(&self, id: &StreamerId) {
        self.channels().remove(id);
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::twitch::alerts::{AlertKind, sample_alert};

    use super::*;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn alert() -> ServerMessage {
        ServerMessage::Alert { alert: sample_alert(AlertKind::Follow) }
    }

    #[tokio::test]
    async fn messages_reach_every_stream_of_the_streamer() {
        let hubs = Hubs::default();
        let mut overlay = hubs.subscribe(&neo(), false).expect("overlay");
        let mut log = hubs.subscribe(&neo(), true).expect("log");
        let mut other = hubs.subscribe(&StreamerId::from_bytes([2; 16]), false).expect("other");
        hubs.emit(&neo(), &alert());
        let expected = r#"{"type":"alert","alert":{"kind":"follow","user":"neo_42"}}"#;
        assert_eq!(overlay.next().await.as_deref(), Some(expected));
        assert_eq!(log.next().await.as_deref(), Some(expected));
        assert_eq!(hubs.overlay_count(&neo()), 1);
        hubs.close(&neo());
        assert_eq!(overlay.next().await, None);
        hubs.emit(&StreamerId::from_bytes([2; 16]), &ServerMessage::MinimeChat { login: "neo".to_owned() });
        assert!(other.next().await.is_some());
    }

    #[tokio::test]
    async fn slow_client_dropped() {
        let hubs = Hubs::default();
        let mut slow = hubs.subscribe(&neo(), false).expect("slow");
        let mut reader = hubs.subscribe(&neo(), false).expect("reader");
        for _ in 0..CAPACITY + 10 {
            hubs.emit(&neo(), &alert());
            assert!(reader.next().await.is_some());
        }
        assert_eq!(slow.next().await, None);
        hubs.emit(&neo(), &alert());
        assert!(reader.next().await.is_some());
    }

    #[tokio::test]
    async fn dashboards_hear_changes_and_open_or_closed_overlays() {
        let hubs = Hubs::default();
        hubs.changed(&neo(), DashboardChange::Account);
        let mut dashboard = hubs.watch_dashboard(&neo()).expect("dashboard");
        let mut other = hubs.watch_dashboard(&StreamerId::from_bytes([2; 16])).expect("other");
        hubs.changed(&neo(), DashboardChange::Account);
        assert_eq!(dashboard.recv().await, Ok(DashboardChange::Account));
        let overlay = hubs.subscribe(&neo(), false).expect("overlay");
        assert_eq!(dashboard.recv().await, Ok(DashboardChange::Spotify), "an overlay opened");
        drop(overlay);
        assert_eq!(dashboard.recv().await, Ok(DashboardChange::Spotify), "and closed again");
        let log = hubs.subscribe(&neo(), true).expect("log");
        drop(log);
        hubs.close(&neo());
        hubs.changed_everywhere(DashboardChange::Account);
        assert_eq!(dashboard.recv().await, Ok(DashboardChange::Account), "a log is no overlay, closing keeps it");
        assert_eq!(other.recv().await, Ok(DashboardChange::Account));
        assert_eq!(serde_json::to_string(&DashboardChange::Backups).expect("json"), r#""backups""#);
    }

    #[test]
    fn at_most_fifty_dashboards() {
        let hubs = Hubs::default();
        let open: Vec<_> = (0..MAX_STREAMS).map(|_| hubs.watch_dashboard(&neo()).expect("dashboard")).collect();
        assert!(hubs.watch_dashboard(&neo()).is_none());
        drop(open);
        assert!(hubs.watch_dashboard(&neo()).is_some());
    }

    #[test]
    fn at_most_fifty_streams_and_places_come_back() {
        let hubs = Hubs::default();
        let mut open: Vec<Subscription> =
            (0..MAX_STREAMS).map(|index| hubs.subscribe(&neo(), index % 2 == 0).expect("stream")).collect();
        assert!(hubs.subscribe(&neo(), false).is_none());
        open.pop();
        assert!(hubs.subscribe(&neo(), true).is_some());
        assert_eq!(hubs.overlay_count(&neo()), MAX_STREAMS / 2 - 1);
    }
}
