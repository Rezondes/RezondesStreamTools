//! Types sent over HTTP and SSE. Every root type is listed in [`export_all`]; the test `export_types` writes them with
//! their dependencies as TypeScript to `src/generated/` and fails when the files are stale. Plus one values type per
//! built-in theme in `src/generated/themes/<id>.ts`.

pub mod theme_values;

use std::path::Path;

use rst_domain::settings::field::SettingValue;
use rst_domain::settings::validate::SettingError;
use rst_domain::spotify::SpotifyDetails;
use rst_domain::themes::registry::themes;
use rst_domain::themes::schema::ThemeSchema;
use ts_rs::{Config, ExportError, TS};

use crate::events::ServerMessage;

/// Export settings: imports with a `.ts` extension (like the frontend), large integers as `number` (JSON).
fn export_config(dir: &Path) -> Config {
    Config::new().with_out_dir(dir).with_import_extension(Some("ts")).with_large_int("number")
}

/// Writes all exported types with their dependencies and the values type of every theme into `dir`.
///
/// # Errors
/// When `ts-rs` cannot write a type or a theme file cannot be written.
pub fn export_all(dir: &Path) -> Result<(), ExportError> {
    let cfg = export_config(dir);
    ServerMessage::export_all(&cfg)?;
    ThemeSchema::export_all(&cfg)?;
    SettingError::export_all(&cfg)?;
    SettingValue::export_all(&cfg)?;
    SpotifyDetails::export_all(&cfg)?;
    let folder = dir.join("themes");
    std::fs::create_dir_all(&folder)?;
    for theme in themes() {
        std::fs::write(folder.join(format!("{}.ts", theme.schema.id)), theme_values::values_type(&theme.schema))?;
    }
    Ok(())
}
