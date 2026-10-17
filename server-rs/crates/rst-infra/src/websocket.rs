//! WebSocket connections (Twitch chat and `EventSub`, in the contract tests the fake provider): text frames in and
//! out. Reconnecting is the job of the caller.

use futures_util::{SinkExt, StreamExt};
use rst_app::ports::socket::{SocketConnector, TextSocket};
use rst_app::ports::twitch::ProviderError;
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream, connect_async};

#[derive(Debug, Clone, Copy, Default)]
pub struct WebSockets;

pub struct WebSocketText {
    stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
}

impl TextSocket for WebSocketText {
    async fn recv(&mut self) -> Option<String> {
        loop {
            match self.stream.next().await? {
                Ok(Message::Text(text)) => return Some(text.to_string()),
                // Pings of the WebSocket layer are answered by the library; binary frames carry nothing
                Ok(Message::Ping(_) | Message::Pong(_) | Message::Binary(_) | Message::Frame(_)) => {}
                Ok(Message::Close(_)) | Err(_) => return None,
            }
        }
    }

    async fn send(&mut self, line: &str) -> Result<(), ProviderError> {
        self.stream.send(Message::Text(line.into())).await.map_err(ProviderError::new)
    }
}

impl SocketConnector for WebSockets {
    type Socket = WebSocketText;

    async fn connect(&self, url: &str) -> Result<WebSocketText, ProviderError> {
        let (stream, _) = connect_async(url).await.map_err(ProviderError::new)?;
        Ok(WebSocketText { stream })
    }
}
