//! The current time for the use cases, which take it as a parameter so their tests stay deterministic.

use std::time::{SystemTime, UNIX_EPOCH};

/// Milliseconds since the epoch
#[must_use]
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| i64::try_from(elapsed.as_millis()).unwrap_or(i64::MAX))
}
