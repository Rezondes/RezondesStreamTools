//! Error of every value object: which kind of value was rejected. The rejected input itself is not kept, so it
//! can never end up in a log by accident.

use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidValue {
    kind: &'static str,
}

impl InvalidValue {
    #[must_use]
    pub const fn new(kind: &'static str) -> Self {
        Self { kind }
    }

    /// Name of the value kind, e.g. `login`
    #[must_use]
    pub const fn kind(&self) -> &'static str {
        self.kind
    }
}

impl fmt::Display for InvalidValue {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "invalid {}", self.kind)
    }
}

impl std::error::Error for InvalidValue {}
