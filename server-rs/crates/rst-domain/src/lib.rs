//! Pure rules of RST (domain layer): no IO, no tokio, no sqlx. One module per bounded context.

pub mod access;
pub mod chat;
pub mod commands;
pub mod error;
pub mod identity;
pub mod media;
pub mod minimes;
pub mod paths;
pub mod render;
pub mod settings;
pub mod spotify;
pub mod stats;
pub mod themes;
pub mod triggers;
pub mod twitch;
