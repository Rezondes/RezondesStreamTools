//! Types sent over HTTP and SSE. Every root type is listed in [`export_all`]; the test `export_types` writes them with
//! their dependencies as TypeScript to `src/generated/` and fails when the files are stale.

use rst_domain::settings::field::SettingValue;
use rst_domain::settings::validate::SettingError;
use rst_domain::themes::schema::ThemeSchema;
use serde::{Deserialize, Serialize};
use ts_rs::{Config, ExportError, TS};

/// Sample type for the export chain, replaced by the real messages (RUST-PLAN.md, package 31).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Ping {
    pub at: u32,
}

/// Export settings: imports with a `.ts` extension (like the frontend), large integers as `number` (JSON).
#[must_use]
pub fn export_config(dir: &std::path::Path) -> Config {
    Config::new()
        .with_out_dir(dir)
        .with_import_extension(Some("ts"))
        .with_large_int("number")
}

/// Writes all exported types with their dependencies to the directory from `cfg`.
///
/// # Errors
/// When `ts-rs` cannot write a type.
pub fn export_all(cfg: &Config) -> Result<(), ExportError> {
    Ping::export_all(cfg)?;
    ThemeSchema::export_all(cfg)?;
    SettingError::export_all(cfg)?;
    SettingValue::export_all(cfg)?;
    Ok(())
}
