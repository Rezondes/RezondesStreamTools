//! Theme interface, data side: the scenes, their recommended sizes and the schema a theme describes its settings
//! with (template: `src/core/theme.ts`). Exported to TypeScript via ts-rs.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::settings::field::SettingField;

/// Scenes of the overlays; `info` is the public commands page for viewers, not a source for OBS
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum SceneName {
    Starting,
    Brb,
    Ending,
    Alerts,
    Chat,
    Cam,
    Music,
    Fx,
    Minimes,
    Info,
}

/// Recommended size of the browser source in OBS
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SceneSize {
    pub width: u32,
    pub height: u32,
}

impl SceneName {
    pub const ALL: [Self; 10] = [
        Self::Starting,
        Self::Brb,
        Self::Ending,
        Self::Alerts,
        Self::Chat,
        Self::Cam,
        Self::Music,
        Self::Fx,
        Self::Minimes,
        Self::Info,
    ];

    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Starting => "starting",
            Self::Brb => "brb",
            Self::Ending => "ending",
            Self::Alerts => "alerts",
            Self::Chat => "chat",
            Self::Cam => "cam",
            Self::Music => "music",
            Self::Fx => "fx",
            Self::Minimes => "minimes",
            Self::Info => "info",
        }
    }

    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|scene| scene.name() == value)
    }

    /// Themes design their scenes for these sizes
    #[must_use]
    pub const fn size(self) -> SceneSize {
        let (width, height) = match self {
            Self::Starting | Self::Brb | Self::Ending | Self::Alerts | Self::Fx => (1920, 1080),
            Self::Chat => (500, 900),
            Self::Cam => (640, 360),
            Self::Music => (900, 240),
            Self::Minimes => (1920, 360),
            Self::Info => (1280, 900),
        };
        SceneSize { width, height }
    }
}

/// One minime variant (e.g. a fruit): id (lower case letters and digits), label and default names in chat
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct MinimeVariantInfo {
    pub id: String,
    pub label: String,
    pub names: Vec<String>,
}

/// Minime variants of a theme instead of colors: command to choose (default word), label in the dashboard, variants
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct MinimeVariantSet {
    pub command: String,
    pub label: String,
    pub variants: Vec<MinimeVariantInfo>,
}

/// The settings schema of a theme. `group_scenes`: in which scenes a group has an effect; a missing group applies
/// everywhere, an empty list in no scene (render section).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
pub struct ThemeSchema {
    pub id: String,
    pub name: String,
    pub fields: Vec<SettingField>,
    #[serde(
        rename = "groupScenes",
        default,
        skip_serializing_if = "BTreeMap::is_empty"
    )]
    #[ts(optional, as = "Option<BTreeMap<String, Vec<SceneName>>>")]
    pub group_scenes: BTreeMap<String, Vec<SceneName>>,
    #[serde(
        rename = "minimeVariants",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    #[ts(optional)]
    pub minime_variants: Option<MinimeVariantSet>,
}

impl ThemeSchema {
    /// Field of this schema by key
    #[must_use]
    pub fn field(&self, key: &str) -> Option<&SettingField> {
        self.fields.iter().find(|field| field.key == key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_scene_has_exactly_one_size() {
        assert_eq!(SceneName::ALL.len(), 10);
        assert_eq!(
            SceneName::Chat.size(),
            SceneSize {
                width: 500,
                height: 900
            }
        );
        assert_eq!(
            SceneName::Info.size(),
            SceneSize {
                width: 1280,
                height: 900
            }
        );
        for scene in SceneName::ALL {
            assert_eq!(SceneName::parse(scene.name()), Some(scene));
        }
        assert_eq!(SceneName::parse("index"), None);
    }

    #[test]
    fn scene_names_serialize_lower_case() {
        assert_eq!(
            serde_json::to_string(&SceneName::Brb).expect("serialize"),
            "\"brb\""
        );
    }
}
