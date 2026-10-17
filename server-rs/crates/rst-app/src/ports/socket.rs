//! Port of the WebSocket connections to Twitch (chat and `EventSub`): sockets that carry text frames.

use std::future::Future;

use crate::ports::twitch::ProviderError;

pub trait TextSocket: Send {
    /// The next text frame; `None` when the connection broke or closed
    fn recv(&mut self) -> impl Future<Output = Option<String>> + Send;

    fn send(&mut self, line: &str) -> impl Future<Output = Result<(), ProviderError>> + Send;
}

pub trait SocketConnector: Send + Sync + 'static {
    type Socket: TextSocket;

    fn connect(&self, url: &str) -> impl Future<Output = Result<Self::Socket, ProviderError>> + Send;
}
