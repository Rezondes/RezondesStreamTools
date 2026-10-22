//! Preferences of a streamer for the dashboard itself (account page): how it looks and its language. Stored in the
//! profile; unknown values are refused, missing ones take the default.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// How the dashboard looks: the plain standard skin or the skin of the active theme
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum DashboardLook {
    #[default]
    Standard,
    Theme,
}

/// Language of the dashboard; only German exists so far, English follows
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    De,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase", default)]
pub struct DashboardPrefs {
    pub look: DashboardLook,
    pub language: Language,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_and_known_values_only() {
        assert_eq!(DashboardPrefs::default(), DashboardPrefs { look: DashboardLook::Standard, language: Language::De });
        let theme: DashboardPrefs = serde_json::from_str(r#"{"look":"theme"}"#).expect("theme look");
        assert_eq!(theme, DashboardPrefs { look: DashboardLook::Theme, language: Language::De });
        assert!(serde_json::from_str::<DashboardPrefs>(r#"{"language":"en"}"#).is_err(), "English is not there yet");
        assert!(serde_json::from_str::<DashboardPrefs>(r#"{"look":"neon"}"#).is_err());
        assert_eq!(serde_json::to_string(&theme).expect("json"), r#"{"look":"theme","language":"de"}"#);
    }
}
