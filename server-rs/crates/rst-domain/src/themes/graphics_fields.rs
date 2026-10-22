//! Shared field of themes with 3D or 2D WebGL: the performance level (template: `qualityField` in
//! `src/core/graphicsFields.ts`). Labels are the German UI texts.

use crate::settings::field::{SettingField, choice};

/// Levels of the 3D stage (`QUALITIES` in `src/core/three/quality.ts`)
const QUALITIES: [&str; 3] = ["hoch", "mittel", "niedrig"];

/// The performance level as a choice, default the middle level
#[must_use]
pub fn quality_field(group: &str) -> SettingField {
    choice("quality", "Leistungsstufe Grafik", group, "mittel", &QUALITIES)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::settings::field::FieldKind;

    #[test]
    fn quality_choices() {
        let field = quality_field("Allgemein");
        assert_eq!((field.key.as_str(), field.group.as_str()), ("quality", "Allgemein"));
        let FieldKind::Select { default, options } = field.kind else { panic!("select field") };
        assert_eq!(default, "mittel");
        assert_eq!(options, ["hoch", "mittel", "niedrig"]);
    }
}
