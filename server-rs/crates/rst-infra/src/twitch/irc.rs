//! The Twitch chat over WebSocket (`wss://irc-ws.chat.twitch.tv:443`, in the contract tests the fake provider): text
//! frames in and out. Reconnecting is the job of the caller.

use futures_util::{SinkExt, StreamExt};
use rst_app::ports::chat::{IrcConnector, IrcSocket};
use rst_app::ports::twitch::ProviderError;
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream, connect_async};

#[derive(Debug, Clone, Copy, Default)]
pub struct WebSocketIrc;

pub struct WebSocketChat {
    stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
}

impl IrcSocket for WebSocketChat {
    async fn recv(&mut self) -> Option<String> {
        loop {
            match self.stream.next().await? {
                Ok(Message::Text(text)) => return Some(text.to_string()),
                // Pings of the WebSocket layer are answered by the library; binary frames are not IRC
                Ok(Message::Ping(_) | Message::Pong(_) | Message::Binary(_) | Message::Frame(_)) => {}
                Ok(Message::Close(_)) | Err(_) => return None,
            }
        }
    }

    async fn send(&mut self, line: &str) -> Result<(), ProviderError> {
        self.stream.send(Message::Text(line.into())).await.map_err(ProviderError::new)
    }
}

impl IrcConnector for WebSocketIrc {
    type Socket = WebSocketChat;

    async fn connect(&self, url: &str) -> Result<WebSocketChat, ProviderError> {
        let (stream, _) = connect_async(url).await.map_err(ProviderError::new)?;
        Ok(WebSocketChat { stream })
    }
}
