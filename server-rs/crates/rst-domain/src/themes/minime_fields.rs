//! Settings of the minimes that are the same for every theme with minimes: commands, rules of the list and movement
//! (template: `src/core/minimeFields.ts`). Color themes take [`minime_fields`], variant themes the base fields and
//! [`minime_variant_fields`] of their variants. Reading the values into rules follows with the minimes context.

use crate::settings::field::{SettingField, Unit, choice, color, flag, number, sound, text};
use crate::themes::info_fields::INFO_GROUP;
use crate::themes::schema::MinimeVariantSet;

pub const MINIME_COMMANDS: &str = "Minimes: Befehle";
pub const MINIME_RULES: &str = "Minimes: Regeln";
pub const MINIME_MOTION: &str = "Minimes: Bewegung";
pub const MINIME_VARIANTS: &str = "Minimes: Typen";
pub const MINIME_TEAMS: &str = "Minimes: Fraktionen";
pub const MINIME_HOP: &str = "Minimes: Hüpfen";
pub const MINIME_COMBAT: &str = "Minimes: Gefechte";

/// Minimum role: whoever has it or one above may (order = rank)
pub const ROLES: [&str; 5] = ["everyone", "subscriber", "vip", "moderator", "broadcaster"];
const WHEN_FULL: [&str; 2] = ["replace", "reject"];
/// Where new minimes appear: anywhere or on evenly spread places
const PLACEMENTS: [&str; 2] = ["random", "slots"];
/// The role that revives in fights; it never shoots, so it has no aim and fire durations
pub const MEDIC: &str = "medic";
/// Sounds of a fight: key and label
const COMBAT_SOUNDS: [(&str, &str); 4] = [
    ("minimeSoundShot", "Ton: Schuss"),
    ("minimeSoundExplosion", "Ton: Explosion"),
    ("minimeSoundHit", "Ton: Treffer"),
    ("minimeSoundRevive", "Ton: Wiederbeleben"),
];

/// For all themes with minimes: commands to join and leave, roles, rules of the list, movement
#[must_use]
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
        choice("minimeJoinRole", "Einklinken ab Rolle", MINIME_COMMANDS, "everyone", &ROLES),
        choice("minimeKickRole", "Fremde rauswerfen ab Rolle", MINIME_COMMANDS, "moderator", &ROLES),
        flag("minimeColorJoins", "Befehl für Farbe oder Typ klinkt auch ein", MINIME_COMMANDS, true),
        number("minimeMax", "Höchstzahl gleichzeitig", MINIME_RULES, 30.0, 1.0, 100.0, None, None),
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
        flag("minimeChatKeepsAlive", "Chatnachrichten halten das Minime im Bild", MINIME_RULES, true),
        flag("minimeReactToChat", "Minime reagiert auf Chatnachrichten", MINIME_RULES, true),
        flag("minimeClearOffline", "Alle entfernen, wenn der Stream endet", MINIME_RULES, true),
        flag("minimeRemoveOnBan", "Bei Ban oder Timeout entfernen", MINIME_RULES, true),
        number("minimeSpeed", "Laufgeschwindigkeit (px pro Sekunde)", MINIME_MOTION, 60.0, 5.0, 600.0, None, None),
        number("minimeMargin", "Abstand zum Rand", MINIME_MOTION, 60.0, 0.0, 600.0, Some(Unit::Px), None),
        number("minimeWalkMin", "Kürzeste Laufstrecke", MINIME_MOTION, 100.0, 10.0, 1920.0, Some(Unit::Px), None),
        number("minimeWalkMax", "Längste Laufstrecke", MINIME_MOTION, 600.0, 10.0, 1920.0, Some(Unit::Px), None),
        number("minimeWalkWeight", "Häufigkeit: wandern", MINIME_MOTION, 40.0, 0.0, 100.0, None, None),
        number("minimeIdleWeight", "Häufigkeit: auf der Stelle schweben", MINIME_MOTION, 40.0, 0.0, 100.0, None, None),
        number("minimeIdleMinMs", "Schweben mindestens", MINIME_MOTION, 2000.0, 200.0, 60_000.0, ms, None),
        number("minimeIdleMaxMs", "Schweben höchstens", MINIME_MOTION, 6000.0, 200.0, 60_000.0, ms, None),
        number("minimeEnterMs", "Dauer: erscheinen", MINIME_MOTION, 1200.0, 0.0, 10_000.0, ms, None),
        number("minimeExitMs", "Dauer: verschwinden", MINIME_MOTION, 900.0, 0.0, 10_000.0, ms, None),
        choice(
            "minimePlacement",
            "Plätze: frei verteilt (random) oder feste Plätze (slots)",
            MINIME_MOTION,
            "random",
            &PLACEMENTS,
        ),
    ]
}

/// Hopping while moving (opt-in): height, duration of one hop, squash on landing
#[must_use]
pub fn minime_hop_fields() -> Vec<SettingField> {
    vec![
        number("hopHeight", "Sprunghöhe", MINIME_HOP, 26.0, 0.0, 200.0, Some(Unit::Px), None),
        number("hopMs", "Dauer eines Sprungs", MINIME_HOP, 420.0, 150.0, 3000.0, Some(Unit::Ms), None),
        number("hopSquash", "Stauchen beim Aufkommen", MINIME_HOP, 0.2, 0.0, 0.6, None, Some(0.05)),
    ]
}

/// Key of the aim duration of a role in fights
#[must_use]
pub fn minime_aim_key(id: &str) -> String {
    format!("minimeAimMs_{id}")
}

/// Key of the fire duration of a role in fights
#[must_use]
pub fn minime_fire_key(id: &str) -> String {
    format!("minimeFireMs_{id}")
}

/// Fights of the minimes (opt-in, the variants are the roles): switch, pace, hit chance, lying time, reviving,
/// sounds and per role except the medic the durations of aiming and firing
#[must_use]
pub fn minime_combat_fields(set: &MinimeVariantSet) -> Vec<SettingField> {
    let (ms, s) = (Some(Unit::Ms), Some(Unit::S));
    let mut fields = vec![
        flag("minimeCombat", "Gefechte an", MINIME_COMBAT, true),
        number("minimeCombatMinS", "Abstand zwischen Gefechten: mindestens", MINIME_COMBAT, 20.0, 5.0, 600.0, s, None),
        number("minimeCombatMaxS", "Abstand zwischen Gefechten: höchstens", MINIME_COMBAT, 60.0, 5.0, 600.0, s, None),
        number("minimeCombatMax", "Gleichzeitige Gefechte", MINIME_COMBAT, 2.0, 1.0, 10.0, None, None),
        number("minimeHitChance", "Trefferchance", MINIME_COMBAT, 70.0, 0.0, 100.0, Some(Unit::Percent), None),
        number(
            "minimeDownMs",
            "Liegezeit bis zum Selbst-Aufstehen",
            MINIME_COMBAT,
            12_000.0,
            1000.0,
            120_000.0,
            ms,
            None,
        ),
        number("minimeReviveMs", "Wiederbeleben: Dauer", MINIME_COMBAT, 2500.0, 200.0, 20_000.0, ms, None),
        number("minimeMedicSpeed", "Medic: Tempo (px pro Sekunde)", MINIME_COMBAT, 140.0, 5.0, 600.0, None, None),
        flag("minimeCombatSounds", "Gefechtstöne", MINIME_COMBAT, false),
    ];
    fields.extend(COMBAT_SOUNDS.iter().map(|(key, label)| sound(key, label, MINIME_COMBAT)));
    for role in set.variants.iter().filter(|role| role.id != MEDIC) {
        let aim = format!("{}: Zielen", role.label);
        let fire = format!("{}: Schuss", role.label);
        fields.push(number(&minime_aim_key(&role.id), &aim, MINIME_COMBAT, 800.0, 100.0, 10_000.0, ms, None));
        fields.push(number(&minime_fire_key(&role.id), &fire, MINIME_COMBAT, 600.0, 100.0, 10_000.0, ms, None));
    }
    fields
}

/// Only for color themes: command to change color, minimum brightness, Twitch name color
fn minime_color_fields() -> Vec<SettingField> {
    vec![
        text("minimeColorCommand", "Befehl: Farbe ändern", MINIME_COMMANDS, "!color", Some(25)),
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
        flag("minimeUseTwitchColor", "Ohne eigene Farbe die Twitch-Namensfarbe nehmen", MINIME_RULES, true),
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
    let command =
        text("minimeVariantCommand", &format!("Befehl: {} wählen", set.label), MINIME_VARIANTS, &set.command, Some(25));
    let names = set.variants.iter().map(|variant| {
        let label = format!("{}: Namen im Chat (leer = aus)", variant.label);
        text(&minime_names_key(&variant.id), &label, MINIME_VARIANTS, &variant.names.join(", "), Some(200))
    });
    std::iter::once(command).chain(names).collect()
}

/// Key of the names of a faction in chat
#[must_use]
pub fn minime_team_names_key(id: &str) -> String {
    format!("minimeTeamNames_{id}")
}

/// Key of the shown name of a faction
#[must_use]
pub fn minime_team_label_key(id: &str) -> String {
    format!("minimeTeamLabel_{id}")
}

/// Key of the color of a faction
#[must_use]
pub fn minime_team_color_key(id: &str) -> String {
    format!("minimeTeamColor_{id}")
}

/// Fields of a theme with factions: command to choose, its texts on the commands page and per faction the names in
/// chat (empty = off), the shown name and the color
#[must_use]
pub fn minime_team_fields(set: &MinimeVariantSet) -> Vec<SettingField> {
    let mut fields = vec![
        text("minimeTeamCommand", &format!("Befehl: {} wählen", set.label), MINIME_TEAMS, &set.command, Some(25)),
        text(
            "infoTeamText",
            &format!("{} wählen: Erklärung ({{command}})", set.label),
            INFO_GROUP,
            &format!("{} wählen: {{command}} <Name>", set.label),
            None,
        ),
        text("infoTeams", "Liste der Fraktionen ({names})", INFO_GROUP, "Zur Wahl: {names}", None),
    ];
    for team in &set.variants {
        let names = format!("{}: Namen im Chat (leer = aus)", team.label);
        fields.push(text(&minime_team_names_key(&team.id), &names, MINIME_TEAMS, &team.names.join(", "), Some(200)));
        fields.push(text(
            &minime_team_label_key(&team.id),
            &format!("{}: Anzeigename", team.label),
            MINIME_TEAMS,
            &team.label,
            Some(40),
        ));
        let default = team.color.as_deref().unwrap_or("#ffffff");
        fields.push(color(&minime_team_color_key(&team.id), &format!("{}: Farbe", team.label), MINIME_TEAMS, default));
    }
    fields
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
        assert_eq!(keys.len(), 27);
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
            color: None,
        };
        let set = MinimeVariantSet { command: "!fruit".to_owned(), label: "Frucht".to_owned(), variants: vec![mango] };
        let fields = minime_variant_fields(&set);
        assert_eq!(fields.len(), 2);
        assert_eq!(fields[0].key, "minimeVariantCommand");
        assert_eq!(fields[1].key, "minimeNames_mango");
        assert_eq!(fields[1].default_value(), SettingValue::Text("mango, mangos".to_owned()));
        assert_eq!(fields[1].group, MINIME_VARIANTS);
    }

    #[test]
    fn team_fields_with_command_texts_and_per_team_names_label_color() {
        let blau = MinimeVariantInfo {
            id: "blau".to_owned(),
            label: "BLUFOR".to_owned(),
            names: vec!["blau".to_owned(), "blue".to_owned()],
            color: Some("#3366ff".to_owned()),
        };
        let set = MinimeVariantSet { command: "!team".to_owned(), label: "Fraktion".to_owned(), variants: vec![blau] };
        let keys: Vec<String> = minime_team_fields(&set).into_iter().map(|field| field.key).collect();
        assert_eq!(
            keys,
            [
                "minimeTeamCommand",
                "infoTeamText",
                "infoTeams",
                "minimeTeamNames_blau",
                "minimeTeamLabel_blau",
                "minimeTeamColor_blau"
            ]
        );
        let fields = minime_team_fields(&set);
        assert_eq!(fields[3].default_value(), SettingValue::Text("blau, blue".to_owned()));
        assert_eq!(fields[5].default_value(), SettingValue::Text("#3366ff".to_owned()));
        assert_eq!(fields[1].group, INFO_GROUP);
    }

    #[test]
    fn feature_fields_match_the_typescript_fixture() {
        let fixture: serde_json::Value =
            serde_json::from_str(include_str!("../../tests/fixtures/minime-features.json")).expect("fixture is JSON");
        let teams: MinimeVariantSet = serde_json::from_value(fixture["teams"]["set"].clone()).expect("sample set");
        crate::themes::fixture::assert_same_fields(&minime_team_fields(&teams), &fixture["teams"]["fields"]);
        crate::themes::fixture::assert_same_fields(&minime_hop_fields(), &fixture["hop"]["fields"]);
        let roles: MinimeVariantSet = serde_json::from_value(fixture["combat"]["set"].clone()).expect("sample roles");
        crate::themes::fixture::assert_same_fields(&minime_combat_fields(&roles), &fixture["combat"]["fields"]);
    }

    #[test]
    fn combat_fields_are_opt_in_without_medic_durations() {
        let role = |id: &str| MinimeVariantInfo { id: id.to_owned(), label: id.to_owned(), names: vec![], color: None };
        let set = MinimeVariantSet {
            command: "!rolle".to_owned(),
            label: "Rolle".to_owned(),
            variants: vec![role(MEDIC), role("mg")],
        };
        let keys: Vec<String> = minime_combat_fields(&set).into_iter().map(|field| field.key).collect();
        assert!(keys.contains(&minime_aim_key("mg")) && keys.contains(&minime_fire_key("mg")));
        assert!(!keys.contains(&minime_aim_key(MEDIC)) && !keys.contains(&minime_fire_key(MEDIC)));
        assert!(keys.contains(&"minimeCombatMax".to_owned()) && keys.contains(&"minimeSoundRevive".to_owned()));
        // Not part of the shared fields: only themes that include them have fights
        assert!(!minime_fields().iter().any(|field| field.group == MINIME_COMBAT || field.group == MINIME_HOP));
    }

    #[test]
    fn placement_defaults_to_random_and_a_theme_sets_core_defaults() {
        let placement = |fields: &[SettingField]| {
            fields.iter().find(|field| field.key == "minimePlacement").map(SettingField::default_value)
        };
        assert_eq!(placement(&minime_fields()), Some(SettingValue::Text("random".to_owned())));
        let own = crate::settings::field::with_defaults(
            minime_base_fields(),
            &[
                ("minimePlacement", SettingValue::Text("slots".to_owned())),
                ("minimeWalkWeight", SettingValue::Number(0.0)),
            ],
        );
        assert_eq!(placement(&own), Some(SettingValue::Text("slots".to_owned())));
        let walk = own.iter().find(|field| field.key == "minimeWalkWeight").map(SettingField::default_value);
        assert_eq!(walk, Some(SettingValue::Number(0.0)));
        // A value of the wrong type changes nothing
        let wrong = crate::settings::field::with_defaults(
            minime_base_fields(),
            &[("minimeWalkWeight", SettingValue::Flag(true))],
        );
        assert_eq!(wrong, minime_base_fields());
    }
}
