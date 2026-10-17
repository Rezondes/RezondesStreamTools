//! Pure rules of RST (domain layer): no IO, no tokio, no sqlx. One module per bounded context.

pub mod access;
pub mod error;
pub mod identity;
pub mod media;
pub mod paths;
pub mod settings;
pub mod themes;
pub mod triggers;
