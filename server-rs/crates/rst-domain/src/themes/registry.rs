//! List of the built-in themes (template: `src/themes/registry.ts`); the first one is the default.

use std::sync::LazyLock;

use crate::identity::values::Login;
use crate::settings::field::SettingValues;
use crate::themes::matrix::matrix;
use crate::themes::schema::ThemeSchema;
use crate::themes::standard::standard;

/// A built-in theme: its schema and the values it fills from the Twitch login on first login
#[derive(Debug, Clone)]
pub struct Theme {
    pub schema: ThemeSchema,
    pub personalize: fn(&Login) -> SettingValues,
}

pub const DEFAULT_THEME: &str = "standard";

static THEMES: LazyLock<Vec<Theme>> = LazyLock::new(|| vec![standard(), matrix()]);

#[must_use]
pub fn themes() -> &'static [Theme] {
    &THEMES
}

#[must_use]
pub fn find(id: &str) -> Option<&'static Theme> {
    themes().iter().find(|theme| theme.schema.id == id)
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;

    use super::*;

    #[test]
    fn ids_unique_default_present_unknown_none() {
        let ids: BTreeSet<&str> = themes()
            .iter()
            .map(|theme| theme.schema.id.as_str())
            .collect();
        assert_eq!(ids.len(), themes().len());
        assert_eq!(
            themes().first().map(|theme| theme.schema.id.as_str()),
            Some(DEFAULT_THEME)
        );
        assert!(find(DEFAULT_THEME).is_some());
        assert!(find("does-not-exist").is_none());
    }

    #[test]
    fn every_theme_enters_the_channel_name_on_first_login() {
        let neo = Login::parse("neo").expect("valid login");
        for theme in themes() {
            assert!(
                (theme.personalize)(&neo).contains_key("channelName"),
                "{}",
                theme.schema.id
            );
        }
    }
}
