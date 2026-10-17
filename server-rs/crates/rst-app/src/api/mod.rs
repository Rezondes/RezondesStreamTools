//! Typen, die über HTTP und SSE gehen. Jeder Wurzeltyp steht in [`export_all`]; der Test `export_types` schreibt sie
//! samt ihrer Abhängigkeiten als TypeScript nach `src/generated/` und bricht ab, wenn die Dateien veraltet sind.

use serde::{Deserialize, Serialize};
use ts_rs::{Config, ExportError, TS};

/// Beispieltyp für die Export-Kette, wird durch die echten Nachrichten ersetzt (RUST-PLAN.md, Package 31).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Ping {
    pub at: u32,
}

/// Einstellungen des Exports: Importe mit `.ts`-Endung (wie im Frontend), grosse Zahlen als `number` (JSON).
#[must_use]
pub fn export_config(dir: &std::path::Path) -> Config {
    Config::new()
        .with_out_dir(dir)
        .with_import_extension(Some("ts"))
        .with_large_int("number")
}

/// Schreibt alle exportierten Typen samt Abhängigkeiten in das Verzeichnis aus `cfg`.
///
/// # Errors
/// Wenn `ts-rs` einen Typ nicht schreiben kann.
pub fn export_all(cfg: &Config) -> Result<(), ExportError> {
    Ping::export_all(cfg)?;
    Ok(())
}
