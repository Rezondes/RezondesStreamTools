//! Port of the Twitch chat connection: a socket that carries IRC text frames (one frame may hold several lines).

use std::future::Future;

use crate::ports::twitch::ProviderError;

pub trait IrcSocket: Send {
    /// The next text frame; `None` when the connection broke or closed
    fn recv(&mut self) -> impl Future<Output = Option<String>> + Send;

    fn send(&mut self, line: &str) -> impl Future<Output = Result<(), ProviderError>> + Send;
}

pub trait IrcConnector: Send + Sync + 'static {
    type Socket: IrcSocket;

    fn connect(&self, url: &str) -> impl Future<Output = Result<Self::Socket, ProviderError>> + Send;
}
