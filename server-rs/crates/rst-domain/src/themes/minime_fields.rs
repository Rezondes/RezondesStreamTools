//! Settings of the minimes that are the same for every theme with minimes: commands, rules of the list and movement
//! (template: `src/core/minimeFields.ts`). Color themes take [`minime_fields`], variant themes the base fields and
//! [`minime_variant_fields`] of their variants. Reading the values into rules follows with the minimes context.

use crate::settings::field::{SettingField, Unit, choice, flag, number, text};
use crate::themes::schema::MinimeVariantSet;

pub const MINIME_COMMANDS: &str = "Minimes: Befehle";
pub const MINIME_RULES: &str = "Minimes: Regeln";
pub const MINIME_MOTION: &str = "Minimes: Bewegung";
pub const MINIME_VARIANTS: &str = "Minimes: Typen";

/// Minimum role: whoever has it or one above may (order = rank)
pub const ROLES: [&str; 5] = ["everyone", "subscriber", "vip", "moderator", "broadcaster"];
const WHEN_FULL: [&str; 2] = ["replace", "reject"];

/// For all themes with minimes: commands to join and leave, roles, rules of the list, movement
#[must_use]
#[expect(clippy::too_many_lines, reason = "one line per field of the schema")]
pub fn minime_base_fields() -> Vec<SettingField> {
    let ms = Some(Unit::Ms);
    vec![
        text(
            "minimeJoinCommand",
            "Befehl: einklinken (optional mit Farbe oder Typ)",
            MINIME_COMMANDS,
            "!join",
            Some(25),
        ),
        text(
            "minimeLeaveCommand",
            "Befehl: verlassen (Mods: mit @name rauswerfen)",
            MINIME_COMMANDS,
            "!leave",
            Some(25),
        ),
        choice(
            "minimeJoinRole",
            "Einklinken ab Rolle",
            MINIME_COMMANDS,
            "everyone",
            &ROLES,
        ),
        choice(
            "minimeKickRole",
            "Fremde rauswerfen ab Rolle",
            MINIME_COMMANDS,
            "moderator",
            &ROLES,
        ),
        flag(
            "minimeColorJoins",
            "Befehl für Farbe oder Typ klinkt auch ein",
            MINIME_COMMANDS,
            true,
        ),
        number(
            "minimeMax",
            "Höchstzahl gleichzeitig",
            MINIME_RULES,
            30.0,
            1.0,
            100.0,
            None,
            None,
        ),
        choice(
            "minimeWhenFull",
            "Wenn voll: Inaktivsten ersetzen (replace) oder Neue abweisen (reject)",
            MINIME_RULES,
            "replace",
            &WHEN_FULL,
        ),
        number(
            "minimeIdleMinutes",
            "Verschwindet nach Minuten ohne Nachricht (0 = nie)",
            MINIME_RULES,
            20.0,
            0.0,
            240.0,
            None,
            None,
        ),
        number(
            "minimeColorCooldown",
            "Abklingzeit Farb- oder Typwechsel",
            MINIME_RULES,
            10.0,
            0.0,
            300.0,
            Some(Unit::S),
            None,
        ),
        flag(
            "minimeChatKeepsAlive",
            "Chatnachrichten halten das Minime im Bild",
            MINIME_RULES,
            true,
        ),
        flag(
            "minimeReactToChat",
            "Minime reagiert auf Chatnachrichten",
            MINIME_RULES,
            true,
        ),
        flag(
            "minimeClearOffline",
            "Alle entfernen, wenn der Stream endet",
            MINIME_RULES,
            true,
        ),
        flag(
            "minimeRemoveOnBan",
            "Bei Ban oder Timeout entfernen",
            MINIME_RULES,
            true,
        ),
        number(
            "minimeSpeed",
            "Laufgeschwindigkeit (px pro Sekunde)",
            MINIME_MOTION,
            60.0,
            5.0,
            600.0,
            None,
            None,
        ),
        number(
            "minimeMargin",
            "Abstand zum Rand",
            MINIME_MOTION,
            60.0,
            0.0,
            600.0,
            Some(Unit::Px),
            None,
        ),
        number(
            "minimeWalkMin",
            "Kürzeste Laufstrecke",
            MINIME_MOTION,
            100.0,
            10.0,
            1920.0,
            Some(Unit::Px),
            None,
        ),
        number(
            "minimeWalkMax",
            "Längste Laufstrecke",
            MINIME_MOTION,
            600.0,
            10.0,
            1920.0,
            Some(Unit::Px),
            None,
        ),
        number(
            "minimeWalkWeight",
            "Häufigkeit: wandern",
            MINIME_MOTION,
            40.0,
            0.0,
            100.0,
            None,
            None,
        ),
        number(
            "minimeIdleWeight",
            "Häufigkeit: auf der Stelle schweben",
            MINIME_MOTION,
            40.0,
            0.0,
            100.0,
            None,
            None,
        ),
        number(
            "minimeIdleMinMs",
            "Schweben mindestens",
            MINIME_MOTION,
            2000.0,
            200.0,
            60_000.0,
            ms,
            None,
        ),
        number(
            "minimeIdleMaxMs",
            "Schweben höchstens",
            MINIME_MOTION,
            6000.0,
            200.0,
            60_000.0,
            ms,
            None,
        ),
        number(
            "minimeEnterMs",
            "Dauer: erscheinen",
            MINIME_MOTION,
            1200.0,
            0.0,
            10_000.0,
            ms,
            None,
        ),
        number(
            "minimeExitMs",
            "Dauer: verschwinden",
            MINIME_MOTION,
            900.0,
            0.0,
            10_000.0,
            ms,
            None,
        ),
    ]
}

/// Only for color themes: command to change color, minimum brightness, Twitch name color
fn minime_color_fields() -> Vec<SettingField> {
    vec![
        text(
            "minimeColorCommand",
            "Befehl: Farbe ändern",
            MINIME_COMMANDS,
            "!color",
            Some(25),
        ),
        number(
            "minimeMinBrightness",
            "Mindesthelligkeit der Farbe (0 bis 255)",
            MINIME_RULES,
            80.0,
            0.0,
            255.0,
            None,
            None,
        ),
        flag(
            "minimeUseTwitchColor",
            "Ohne eigene Farbe die Twitch-Namensfarbe nehmen",
            MINIME_RULES,
            true,
        ),
    ]
}

/// All fields of a color theme
#[must_use]
pub fn minime_fields() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend(minime_color_fields());
    fields
}

/// Key of the names of a variant in chat
#[must_use]
pub fn minime_names_key(id: &str) -> String {
    format!("minimeNames_{id}")
}

/// Fields of a variant theme: command to choose (the theme's default word) and per variant the names in chat,
/// comma-separated; an empty list switches the variant off
#[must_use]
pub fn minime_variant_fields(set: &MinimeVariantSet) -> Vec<SettingField> {
    let command = text(
        "minimeVariantCommand",
        &format!("Befehl: {} wählen", set.label),
        MINIME_VARIANTS,
        &set.command,
        Some(25),
    );
    let names = set.variants.iter().map(|variant| {
        let label = format!("{}: Namen im Chat (leer = aus)", variant.label);
        text(
            &minime_names_key(&variant.id),
            &label,
            MINIME_VARIANTS,
            &variant.names.join(", "),
            Some(200),
        )
    });
    std::iter::once(command).chain(names).collect()
}

/// Does this schema have minimes? (does it include the shared fields)
#[must_use]
pub fn has_minimes(fields: &[SettingField]) -> bool {
    fields.iter().any(|field| field.key == "minimeJoinCommand")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::settings::field::SettingValue;
    use crate::themes::schema::MinimeVariantInfo;

    #[test]
    fn color_themes_get_base_and_color_fields() {
        let keys: Vec<String> = minime_fields().into_iter().map(|field| field.key).collect();
        assert_eq!(keys.len(), 26);
        assert_eq!(keys.first().map(String::as_str), Some("minimeJoinCommand"));
        assert!(keys.contains(&"minimeColorCommand".to_owned()));
        assert!(has_minimes(&minime_fields()));
        assert!(!has_minimes(&[]));
    }

    #[test]
    fn variant_fields_with_command_and_names_per_variant() {
        let mango = MinimeVariantInfo {
            id: "mango".to_owned(),
            label: "Mango".to_owned(),
            names: vec!["mango".to_owned(), "mangos".to_owned()],
        };
        let set = MinimeVariantSet {
            command: "!fruit".to_owned(),
            label: "Frucht".to_owned(),
            variants: vec![mango],
        };
        let fields = minime_variant_fields(&set);
        assert_eq!(fields.len(), 2);
        assert_eq!(fields[0].key, "minimeVariantCommand");
        assert_eq!(fields[1].key, "minimeNames_mango");
        assert_eq!(
            fields[1].default_value(),
            SettingValue::Text("mango, mangos".to_owned())
        );
        assert_eq!(fields[1].group, MINIME_VARIANTS);
    }
}
