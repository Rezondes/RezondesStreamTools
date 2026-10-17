//! Pure rules of RST (domain layer): no IO, no tokio, no sqlx. One module per bounded context.

pub mod access;
pub mod commands;
pub mod error;
pub mod identity;
pub mod media;
pub mod minimes;
pub mod paths;
pub mod render;
pub mod settings;
pub mod themes;
pub mod triggers;
