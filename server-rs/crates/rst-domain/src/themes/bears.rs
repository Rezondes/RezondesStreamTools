//! Settings schema of the Bärenbande theme: three bear brothers (Eisbär, Grizzly, Panda) as cartoons with a clear outline
//! in front of a watercolor world, one bear (or the tower of all three) per scene (template:
//! `src/themes/bears/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal to the TypeScript
//! schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, number, text,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

const GENERAL: &str = "Allgemein";
const BEARS: &str = "Bären";
const WORLD: &str = "Welt";
const SCREENS: &str = "Starting, BRB, Ending";

fn fields() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanal-Name", GENERAL, "Bärenbande", Some(40)),
        font("font", "Schrift", GENERAL, "Nunito", &["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]),
        font("titleFont", "Titelschrift", GENERAL, "Sniglet", &["Sniglet", "Fredoka", "Baloo 2", "Nunito"]),
        number("fontSize", "Schriftgrösse", GENERAL, 24.0, 10.0, 60.0, PX, None),
        color("outline", "Kontur", GENERAL, "#1c1a19"),
        number("outlineWidth", "Kontur: Stärke", GENERAL, 4.5, 0.0, 20.0, None, Some(0.5)),
        color("textColor", "Text hell", GENERAL, "#ffffff"),
        color("textDark", "Text auf Papier", GENERAL, "#2b2522"),
        color("textDim", "Text gedämpft", GENERAL, "#6b5d55"),
        color("paper", "Papier (Karten, Schilder)", GENERAL, "#fbf3e0"),
        color("paperShade", "Papier: Schattenton", GENERAL, "#e9dcc0"),
        color("accent", "Akzent (Ziegelrot)", GENERAL, "#e2573f"),
        color("accentText", "Akzent für Text", GENERAL, "#b83c28"),
        color("accent2", "Akzent 2 (Himmelblau)", GENERAL, "#4d9de0"),
        number("radius", "Eckenradius", GENERAL, 22.0, 0.0, 60.0, PX, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500.0, 0.0, 3000.0, MS, None),
        choice(
            "locale",
            "Uhrzeit-Format",
            GENERAL,
            "de-DE",
            &["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"],
        ),
        choice("facing", "Blickrichtung der Bären", GENERAL, "links", &["links", "rechts"]),
        color("iceFur", "Eisbär: Fell", BEARS, "#ffffff"),
        color("iceShade", "Eisbär: Schattenton", BEARS, "#d5dcda"),
        color("grizzlyFur", "Grizzly: Fell", BEARS, "#96693f"),
        color("grizzlyShade", "Grizzly: Schattenton", BEARS, "#7d5533"),
        color("pandaFur", "Panda: weisses Fell", BEARS, "#f3eeeb"),
        color("pandaShade", "Panda: Schattenton auf Weiss", BEARS, "#d9d2ce"),
        color("pandaPatch", "Panda: schwarzes Fell", BEARS, "#64615c"),
        color("pandaPatchShade", "Panda: Schattenton auf Schwarz", BEARS, "#4e4b47"),
        color("bearEye", "Augen", BEARS, "#111111"),
        color("bearNose", "Nase", BEARS, "#111111"),
        color("grizzlyMouth", "Grizzly: Mund innen", BEARS, "#6b3833"),
        color("grizzlyTongue", "Grizzly: Zunge", BEARS, "#e0868a"),
        color("bearTeeth", "Zähne", BEARS, "#ffffff"),
        color("phoneCase", "Handy: Hülle", BEARS, "#f4a493"),
        color("phoneScreen", "Handy: Bildschirm", BEARS, "#2d2926"),
        color("prop", "Pfanne und Geräte", BEARS, "#4a4542"),
        color("food", "Essen in der Pfanne", BEARS, "#f6c945"),
        number("blinkEvery", "Blinzeln alle (0 = nie)", BEARS, 5000.0, 0.0, 30000.0, MS, None),
        flag("breathe", "Atmen", BEARS, true),
        number("breatheMs", "Atmen: Dauer eines Atemzugs", BEARS, 3600.0, 1000.0, 10000.0, MS, None),
        number("towerSway", "Bärenturm: Wanken (Grad)", BEARS, 2.0, 0.0, 10.0, None, None),
        number("towerSwayMs", "Bärenturm: Wanken (Dauer)", BEARS, 2400.0, 500.0, 10000.0, MS, None),
        in_scene(
            SceneName::Starting,
            choice("timeStarting", "Tageszeit Starting", WORLD, "morgen", &["morgen", "mittag", "abend", "nacht"]),
        ),
        in_scene(
            SceneName::Brb,
            choice("timeBrb", "Tageszeit BRB", WORLD, "mittag", &["morgen", "mittag", "abend", "nacht"]),
        ),
        in_scene(
            SceneName::Ending,
            choice("timeEnding", "Tageszeit Ending", WORLD, "abend", &["morgen", "mittag", "abend", "nacht"]),
        ),
        color("skyMorningTop", "Himmel Morgen oben", WORLD, "#f6b38a"),
        color("skyMorningBottom", "Himmel Morgen unten", WORLD, "#fde4c6"),
        color("skyDayTop", "Himmel Mittag oben", WORLD, "#7fc3e8"),
        color("skyDayBottom", "Himmel Mittag unten", WORLD, "#cfe9f5"),
        color("skyEveningTop", "Himmel Abend oben", WORLD, "#e8846a"),
        color("skyEveningBottom", "Himmel Abend unten", WORLD, "#f7c99a"),
        color("skyNightTop", "Himmel Nacht oben", WORLD, "#1f2d4f"),
        color("skyNightBottom", "Himmel Nacht unten", WORLD, "#4a5a7c"),
        color("sun", "Sonne", WORLD, "#fff1b8"),
        color("moon", "Mond", WORLD, "#f4f0dc"),
        color("cloud", "Wolken", WORLD, "#ffffff"),
        number("cloudCount", "Anzahl Wolken", WORLD, 4.0, 0.0, 8.0, None, None),
        number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", WORLD, 140.0, 10.0, 600.0, S, None),
        color("meadow", "Wiese", WORLD, "#b9cf63"),
        color("meadowDark", "Wiese dunkel", WORLD, "#8fb24a"),
        color("fir", "Tannen", WORLD, "#5e8f6a"),
        color("firDark", "Tannen dunkel", WORLD, "#3f6b52"),
        color("treeLeaf", "Laubbäume", WORLD, "#7fae5a"),
        color("hills", "Hügel in der Ferne", WORLD, "#a9c7b9"),
        color("city", "Stadt", WORLD, "#d8dde3"),
        color("cityWindow", "Stadt: Fenster", WORLD, "#9fb0c0"),
        color("bridge", "Brücke", WORLD, "#d9573b"),
        color("water", "Wasser", WORLD, "#9cc9d9"),
        color("road", "Weg", WORLD, "#a3a5a6"),
        color("cave", "Höhlenhügel", WORLD, "#8b6352"),
        color("caveDark", "Höhleneingang", WORLD, "#4a3128"),
        color("wood", "Holz", WORLD, "#9a6a44"),
        color("flower", "Blumen", WORLD, "#fff7e8"),
        flag("flowers", "Blumen und Gras", WORLD, true),
        flag("showCity", "Stadt in der Ferne", WORLD, true),
        flag("showBridge", "Brücke in der Ferne", WORLD, true),
        flag("showCave", "Höhle", WORLD, true),
        number("paperGrain", "Aquarell: Papierstruktur", WORLD, 0.5, 0.0, 1.0, None, Some(0.05)),
        number("sketchLines", "Aquarell: Skizzenlinien", WORLD, 0.5, 0.0, 1.0, None, Some(0.05)),
        in_scene(
            SceneName::Starting,
            choice("bearStarting", "Starting: Bär", SCREENS, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        in_scene(
            SceneName::Brb,
            choice("bearBrb", "BRB: Bär", SCREENS, "eisbaer", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        in_scene(
            SceneName::Ending,
            choice("bearEnding", "Ending: Bär", SCREENS, "panda", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        number("bearSize", "Bär: Grösse (Höhe)", SCREENS, 520.0, 100.0, 1000.0, PX, None),
        choice("bearSide", "Bär: Seite", SCREENS, "links", &["links", "rechts"]),
        in_scene(
            SceneName::Starting,
            text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los", None),
        ),
        in_scene(SceneName::Starting, text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None)),
        in_scene(
            SceneName::Starting,
            text("startingNote", "Starting: Untertitel", SCREENS, "Die Bande sammelt sich noch.", None),
        ),
        in_scene(SceneName::Brb, text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
        in_scene(SceneName::Brb, text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        in_scene(SceneName::Brb, text("brbNote", "BRB: Untertitel", SCREENS, "Hier wird gerade gekocht.", None)),
        in_scene(SceneName::Brb, text("brbSign", "BRB: Schild des Grizzly", SCREENS, "Gleich zurück!", Some(24))),
        in_scene(SceneName::Ending, text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None)),
        in_scene(SceneName::Ending, text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
        in_scene(SceneName::Ending, text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Mal!", None)),
        number("signWidth", "Schild: Breite", SCREENS, 1000.0, 400.0, 1800.0, PX, None),
        number("titleSize", "Titelgrösse", SCREENS, 104.0, 30.0, 240.0, PX, None),
        in_scene(SceneName::Starting, number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        in_scene(SceneName::Starting, text("countdownPrefix", "Countdown-Präfix", SCREENS, "", None)),
        in_scene(SceneName::Starting, text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!", None)),
        in_scene(
            SceneName::Starting,
            choice("progressStyle", "Fortschritt", SCREENS, "weg", &["weg", "balken", "aus"]),
        ),
        in_scene(SceneName::Brb, text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ", None)),
        in_scene(
            SceneName::Ending,
            text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream", None),
        ),
        in_scene(SceneName::Ending, text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        in_scene(
            SceneName::Starting,
            lines(
                "startingLines",
                "Sprüche Starting",
                SCREENS,
                &[
                    "Snacks werden verteilt ...",
                    "Das Handy wird aufgeladen ...",
                    "Die Höhle wird aufgeräumt ...",
                    "Die Begrüssung wird geübt ...",
                ],
                None,
            ),
        ),
        in_scene(
            SceneName::Brb,
            lines(
                "brbLines",
                "Sprüche BRB",
                SCREENS,
                &["Es wird etwas Feines gekocht ...", "Kurz die Höhle fegen ...", "Nachrichten werden gecheckt ..."],
                None,
            ),
        ),
        in_scene(
            SceneName::Ending,
            lines(
                "endingLines",
                "Sprüche Ending",
                SCREENS,
                &["Die Bande winkt zum Abschied ...", "Zeit für ein Nickerchen in der Höhle ...", "Bis bald!"],
                None,
            ),
        ),
        number("linesEvery", "Sprüche wechseln alle", SCREENS, 6.0, 2.0, 120.0, S, None),
        text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(300)),
        number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30.0, 5.0, 300.0, S, None),
        choice("powerOn", "Einschalten", SCREENS, "aquarell", &["aquarell", "blenden", "keins"]),
        number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1600.0, 0.0, 10000.0, MS, None),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    let screens = vec![SceneName::Starting, SceneName::Brb, SceneName::Ending];
    [(BEARS, screens.clone()), (WORLD, screens.clone()), (SCREENS, screens)]
        .into_iter()
        .map(|(group, scenes)| (group.to_owned(), scenes))
        .collect()
}

/// `neo_42` -> `Neo_42`
fn capital(login: &str) -> String {
    let mut chars = login.chars();
    chars.next().map(|first| first.to_uppercase().chain(chars).collect()).unwrap_or_default()
}

/// On first login: channel name from the Twitch login (first letter upper case)
fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([("channelName".to_owned(), SettingValue::Text(capital(login.as_str())))])
}

#[must_use]
pub fn bears() -> Theme {
    let schema = ThemeSchema {
        id: "bears".to_owned(),
        name: "Bärenbande".to_owned(),
        fields: fields(),
        group_scenes: group_scenes(),
        minime_variants: None,
        minime_teams: None,
    };
    Theme { schema, personalize }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::themes::fixture::assert_same_as_fixture;

    #[test]
    fn same_as_typescript() {
        assert_same_as_fixture(&bears(), include_str!("../../tests/fixtures/bears.json"));
    }

    #[test]
    fn personalize_sets_channel() {
        let values = personalize(&Login::parse("neo_42").expect("valid login"));
        assert_eq!(values.get("channelName"), Some(&SettingValue::Text("Neo_42".to_owned())));
    }
}
