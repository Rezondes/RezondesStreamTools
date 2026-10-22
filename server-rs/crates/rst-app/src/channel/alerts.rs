//! The `EventSub` connection of a streamer (template: `eventSub` in `server/twitch.ts`): after `session_welcome` the
//! subscriptions are requested, notifications go to `handle`. `session_reconnect` moves to the new Twitch URL and
//! keeps the subscriptions; the domain only lets `wss://*.twitch.tv` through. Without a sign of life within the
//! keepalive (plus five seconds) or after a broken connection it starts again from the configured URL after a pause.

use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use rst_domain::twitch::eventsub::{DEFAULT_KEEPALIVE_SECONDS, EventSubMessage, parse_message};
use tokio_util::sync::CancellationToken;

use crate::ports::socket::{SocketConnector, TextSocket};

/// Pause before a new connection
pub const RETRY: Duration = Duration::from_secs(5);
/// Grace on top of the keepalive from the welcome
const KEEPALIVE_GRACE: u64 = 5;

/// Whether `EventSub` is subscribed right now; every change is reported (the dashboard shows it)
pub struct LiveFlag {
    live: AtomicBool,
    changed: Box<dyn Fn() + Send + Sync>,
}

impl LiveFlag {
    pub fn new(changed: impl Fn() + Send + Sync + 'static) -> Self {
        Self { live: AtomicBool::new(false), changed: Box::new(changed) }
    }

    #[must_use]
    pub fn get(&self) -> bool {
        self.live.load(Ordering::Relaxed)
    }

    fn set(&self, live: bool) {
        if self.live.swap(live, Ordering::Relaxed) != live {
            (self.changed)();
        }
    }
}

/// Listens until `cancel`; `subscribe` gets the session id of the first welcome of every connection. `live` is true
/// while a connection is subscribed and false from the moment it breaks or ends.
pub async fn listen<C, F, Fut>(
    connector: &C,
    url: &str,
    cancel: &CancellationToken,
    live: &LiveFlag,
    subscribe: F,
    mut handle: impl FnMut(EventSubMessage) + Send,
) where
    C: SocketConnector,
    F: Fn(String) -> Fut + Send + Sync,
    Fut: Future<Output = ()> + Send,
{
    loop {
        match connector.connect(url).await {
            Ok(socket) => {
                let cancelled = session(connector, socket, cancel, live, &subscribe, &mut handle).await;
                live.set(false);
                if cancelled {
                    return;
                }
            }
            Err(error) => eprintln!("EventSub unreachable: {error}"),
        }
        tokio::select! {
            () = cancel.cancelled() => return,
            () = tokio::time::sleep(RETRY) => {}
        }
    }
}

/// One connection with its reconnects; `true` when cancelled, `false` when it broke
async fn session<C, F, Fut>(
    connector: &C,
    mut socket: C::Socket,
    cancel: &CancellationToken,
    live: &LiveFlag,
    subscribe: &F,
    handle: &mut (impl FnMut(EventSubMessage) + Send),
) -> bool
where
    C: SocketConnector,
    F: Fn(String) -> Fut + Send + Sync,
    Fut: Future<Output = ()> + Send,
{
    let mut silence = Duration::from_secs(DEFAULT_KEEPALIVE_SECONDS + KEEPALIVE_GRACE);
    let mut subscribed = false;
    loop {
        let frame = tokio::select! {
            () = cancel.cancelled() => return true,
            frame = tokio::time::timeout(silence, socket.recv()) => frame,
        };
        let Ok(Some(frame)) = frame else { return false };
        match parse_message(&frame) {
            Ok(EventSubMessage::Welcome { session_id, keepalive_seconds }) => {
                silence = Duration::from_secs(keepalive_seconds + KEEPALIVE_GRACE);
                if let Some(session_id) = session_id.filter(|_| !subscribed) {
                    subscribed = true;
                    subscribe(session_id).await;
                    live.set(true);
                }
            }
            Ok(EventSubMessage::Reconnect { url }) => match connector.connect(&url).await {
                Ok(moved) => socket = moved,
                Err(error) => eprintln!("EventSub reconnect failed: {error}"),
            },
            Ok(EventSubMessage::Revocation { subscription_type, status }) => {
                eprintln!("EventSub subscription revoked: {subscription_type} ({status})");
            }
            // Keepalives and messages that are not readable: only a sign of life
            Ok(EventSubMessage::Ignored) | Err(_) => {}
            Ok(message) => handle(message),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::AtomicUsize;
    use std::sync::{Arc, Mutex};

    use rst_domain::twitch::alerts::{Alert, AlertKind};
    use serde_json::json;

    use super::*;
    use crate::testing::MemorySockets;

    fn frame(value: &serde_json::Value) -> String {
        value.to_string()
    }

    fn welcome(id: &str) -> String {
        frame(
            &json!({ "metadata": { "message_type": "session_welcome" }, "payload": { "session": { "id": id, "keepalive_timeout_seconds": 10 } } }),
        )
    }

    fn follow(name: &str) -> String {
        frame(
            &json!({ "metadata": { "message_type": "notification", "subscription_type": "channel.follow" }, "payload": { "event": { "user_name": name } } }),
        )
    }

    #[tokio::test(start_paused = true)]
    async fn subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() {
        let sockets = MemorySockets::default();
        let reconnect = frame(
            &json!({ "metadata": { "message_type": "session_reconnect" }, "payload": { "session": { "reconnect_url": "wss://eventsub.wss.twitch.tv/ws?id=2" } } }),
        );
        let evil = frame(
            &json!({ "metadata": { "message_type": "session_reconnect" }, "payload": { "session": { "reconnect_url": "wss://evil.example/ws" } } }),
        );
        // The foreign reconnect is ignored; the moved connection gets its own welcome but subscribes nothing
        sockets.script(vec![welcome("one"), follow("neo"), "not json".to_owned(), evil, reconnect]);
        sockets.script(vec![welcome("two"), follow("trinity")]);
        let sessions = Arc::new(Mutex::new(Vec::new()));
        let alerts = Arc::new(Mutex::new(Vec::new()));
        let cancel = CancellationToken::new();
        let task = tokio::spawn({
            let (sockets, sessions, alerts, cancel) =
                (sockets.clone(), Arc::clone(&sessions), Arc::clone(&alerts), cancel.clone());
            async move {
                let subscribe = |id: String| {
                    let sessions = Arc::clone(&sessions);
                    async move { sessions.lock().expect("sessions").push(id) }
                };
                listen(&sockets, "wss://eventsub", &cancel, &LiveFlag::new(|| {}), subscribe, |message| {
                    alerts.lock().expect("alerts").push(message);
                })
                .await;
            }
        });
        tokio::time::sleep(Duration::from_millis(10)).await;
        assert_eq!(*sessions.lock().expect("sessions"), ["one"]);
        assert_eq!(
            *alerts.lock().expect("alerts"),
            [
                EventSubMessage::Alert(Alert::new(AlertKind::Follow, "neo")),
                EventSubMessage::Alert(Alert::new(AlertKind::Follow, "trinity"))
            ]
        );
        cancel.cancel();
        task.await.expect("listener ends");
    }

    #[tokio::test(start_paused = true)]
    async fn silence_beyond_the_keepalive_starts_again_and_subscribes_anew() {
        let sockets = MemorySockets::default();
        // The first connection says hello and then stays silent forever
        sockets.script_then_silence(vec![welcome("one")]);
        sockets.script_then_silence(vec![welcome("two")]);
        let sessions = Arc::new(Mutex::new(Vec::new()));
        let changes = Arc::new(AtomicUsize::new(0));
        let counted = Arc::clone(&changes);
        let live = Arc::new(LiveFlag::new(move || {
            counted.fetch_add(1, Ordering::Relaxed);
        }));
        let cancel = CancellationToken::new();
        let task = tokio::spawn({
            let (sockets, sessions, live, cancel) =
                (sockets.clone(), Arc::clone(&sessions), Arc::clone(&live), cancel.clone());
            async move {
                let subscribe = |id: String| {
                    let sessions = Arc::clone(&sessions);
                    async move { sessions.lock().expect("sessions").push(id) }
                };
                listen(&sockets, "wss://eventsub", &cancel, &live, subscribe, |_| {}).await;
            }
        });
        tokio::time::sleep(Duration::from_secs(1)).await;
        assert_eq!(*sessions.lock().expect("sessions"), ["one"]);
        assert!(live.get(), "subscribed");
        // The silence breaks the connection: not live during the pause before the next one
        tokio::time::sleep(Duration::from_secs(10 + KEEPALIVE_GRACE)).await;
        assert!(!live.get(), "broken");
        tokio::time::sleep(RETRY).await;
        assert_eq!(*sessions.lock().expect("sessions"), ["one", "two"]);
        assert!(live.get(), "subscribed again");
        cancel.cancel();
        task.await.expect("listener ends");
        assert!(!live.get(), "ended");
        assert_eq!(changes.load(Ordering::Relaxed), 4, "every change reported once");
    }
}
