//! The server reads the chat of a streamer anonymously (template: `server/chat.ts`), so chat overlays, triggers,
//! minimes and the help command work without an open browser. Chat lines and moderation go to the overlays as
//! events; a broken connection is rebuilt after three seconds.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use rst_domain::chat::events::{IrcEvent, to_irc_events};
use rst_domain::chat::irc::{IrcMessage, anonymous_login, parse_irc};
use rst_domain::identity::values::StreamerId;
use tokio_util::sync::CancellationToken;

use crate::crypto::cipher::random_bytes;
use crate::events::{Hubs, ServerMessage};
use crate::ports::chat::{IrcConnector, IrcSocket};

pub const RECONNECT: Duration = Duration::from_secs(3);

/// Listens until `cancel`; every IRC line goes to `handle`, PING is answered here
pub async fn listen<C: IrcConnector>(
    connector: &C,
    url: &str,
    channel: &str,
    cancel: &CancellationToken,
    mut handle: impl FnMut(&IrcMessage) + Send,
) {
    loop {
        match connector.connect(url).await {
            Ok(mut socket) => {
                if session(&mut socket, channel, cancel, &mut handle).await {
                    return;
                }
            }
            Err(error) => eprintln!("Chat of #{channel} unreachable: {error}"),
        }
        tokio::select! {
            () = cancel.cancelled() => return,
            () = tokio::time::sleep(RECONNECT) => {}
        }
    }
}

/// One connection; `true` when cancelled, `false` when it broke
async fn session<S: IrcSocket>(
    socket: &mut S,
    channel: &str,
    cancel: &CancellationToken,
    handle: &mut (impl FnMut(&IrcMessage) + Send),
) -> bool {
    let guest = random_bytes::<4>().map_or(0, u32::from_le_bytes);
    for line in anonymous_login(channel, guest) {
        if socket.send(&line).await.is_err() {
            return false;
        }
    }
    loop {
        let frame = tokio::select! {
            () = cancel.cancelled() => return true,
            frame = socket.recv() => frame,
        };
        let Some(frame) = frame else { return false };
        for raw in frame.split("\r\n").filter(|raw| !raw.is_empty()) {
            let message = parse_irc(raw);
            if message.command == "PING" {
                let pong = format!("PONG :{}", message.param(0).unwrap_or_default());
                if socket.send(&pong).await.is_err() {
                    return false;
                }
            }
            handle(&message);
        }
    }
}

/// Numbers for chat messages without an ID
static NEXT_ID: AtomicU64 = AtomicU64::new(1);

/// Chat lines (only with the feature chat) and moderation (always, chat overlays must drop deleted lines) as events
pub fn relay(message: &IrcMessage, hubs: &Hubs, id: &StreamerId, chat_on: bool) {
    // Alerts come from EventSub, not from the chat
    let new_id = || format!("local-{}", NEXT_ID.fetch_add(1, Ordering::SeqCst));
    for event in to_irc_events(message, &HashMap::<String, String>::new(), false, new_id) {
        match event {
            IrcEvent::Chat(message) if chat_on => hubs.emit(id, &ServerMessage::Chat { message }),
            IrcEvent::Remove(removal) => hubs.emit(id, &ServerMessage::Remove { removal }),
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;
    use crate::testing::MemoryIrc;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    #[tokio::test(start_paused = true)]
    async fn lines_become_events_ping_is_answered_and_the_chat_reconnects() {
        let irc = MemoryIrc::default();
        irc.script(vec![
            "PING :tmi.twitch.tv\r\n".to_owned(),
            "@color=#FF0000;display-name=Neo;emotes=25:0-4 :neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :Kappa hi\r\n:tmi.twitch.tv CLEARCHAT #neo :smith".to_owned(),
        ]);
        irc.script(vec![]);
        let hubs = Arc::new(Hubs::default());
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        let cancel = CancellationToken::new();
        let task = tokio::spawn({
            let (irc, hubs, cancel) = (irc.clone(), Arc::clone(&hubs), cancel.clone());
            async move { listen(&irc, "wss://irc", "neo", &cancel, |message| relay(message, &hubs, &neo(), true)).await }
        });
        let chat = stream.next().await.expect("chat");
        assert!(chat.contains(r#""type":"chat""#) && chat.contains("Kappa") && chat.contains(r#""user":"Neo""#));
        assert_eq!(stream.next().await.as_deref(), Some(r#"{"type":"remove","removal":{"login":"smith"}}"#));
        // The first connection ends with the script: three seconds later the second one logs in again
        tokio::time::sleep(RECONNECT + Duration::from_millis(10)).await;
        let sent = irc.sent();
        assert_eq!(sent.iter().filter(|line| *line == "JOIN #neo").count(), 2);
        assert!(sent.iter().any(|line| line == "PONG :tmi.twitch.tv"));
        assert!(sent.iter().any(|line| line.starts_with("NICK justinfan")));
        cancel.cancel();
        task.await.expect("listener ends");
    }

    #[tokio::test]
    async fn chat_lines_only_with_the_feature_moderation_always() {
        let hubs = Hubs::default();
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        relay(&parse_irc(":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hi"), &hubs, &neo(), false);
        relay(&parse_irc("@target-msg-id=abc :tmi.twitch.tv CLEARMSG #neo :hi"), &hubs, &neo(), false);
        assert_eq!(stream.next().await.as_deref(), Some(r#"{"type":"remove","removal":{"id":"abc"}}"#));
    }
}
