//! Settings schema of the Chaos theme: neon graffiti at night, magenta and cyan scribble, spray and glow on almost black
//! (template: `src/themes/chaos/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal to the
//! TypeScript schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, mark_basic, number,
    text,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};

const FONTS: [&str; 4] = ["Space Grotesk", "Inter", "Manrope", "DM Sans"];
const TITLE_FONTS: [&str; 4] = ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"];
const GESTURES: [&str; 4] = ["zweix", "x", "strich", "keine"];
const GESTURE_COLORS: [&str; 2] = ["cyan", "magenta"];

const GENERAL: &str = "Allgemein";
const SCRIBBLES: &str = "Kritzeleien";
const SCREENS: &str = "Starting, BRB, Ending";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);
const STEP: Option<f64> = Some(0.05);

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanal-Name", GENERAL, "CHAOS", Some(40)),
        font("font", "Schrift", GENERAL, "Space Grotesk", &FONTS),
        font("titleFont", "Titelschrift", GENERAL, "Permanent Marker", &TITLE_FONTS),
        number("fontSize", "Schriftgrösse", GENERAL, 30.0, 12.0, 60.0, PX, None),
        number("titleSize", "Titelgrösse", GENERAL, 150.0, 40.0, 260.0, PX, None),
        color("ground", "Grund (Wand aussen)", GENERAL, "#120910"),
        color("wall", "Wand (Mitte)", GENERAL, "#22182f"),
        color("accent", "Signatur Magenta", GENERAL, "#d123a0"),
        color("accentText", "Magenta für Text", GENERAL, "#ff5ccb"),
        color("accent2", "Zweiter Akzent Cyan", GENERAL, "#09d0fe"),
        color("onAccent2", "Schrift auf Cyan und Klebeband", GENERAL, "#120910"),
        color("violet", "Violett (Flecken, Schatten)", GENERAL, "#502a5f"),
        color("violetLight", "Violett hell", GENERAL, "#986ea9"),
        color("lilac", "Flieder (Klebeband)", GENERAL, "#d39dd4"),
        color("textColor", "Textfarbe", GENERAL, "#ffffff"),
        color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#b8a6c4"),
        number("grain", "Körnung (0 = aus)", GENERAL, 0.55, 0.0, 1.0, None, STEP),
        number("jitter", "Zittern der Linien (0 = glatt)", GENERAL, 0.5, 0.0, 1.0, None, STEP),
        number("glow", "Leuchten (0 = aus)", GENERAL, 0.6, 0.0, 1.0, None, STEP),
        number("flicker", "Neon-Flackern (0 = aus)", GENERAL, 0.2, 0.0, 1.0, None, STEP),
        number("glitch", "Glitch-Stärke (0 = aus)", GENERAL, 0.3, 0.0, 1.0, None, STEP),
        number("glitchEvery", "Glitch alle", GENERAL, 9.0, 2.0, 120.0, S, None),
    ]
}

fn scribbles() -> Vec<SettingField> {
    vec![
        number("scribbleCount", "Anzahl", SCRIBBLES, 340.0, 0.0, 600.0, None, None),
        number("scribbleWidth", "Strichstärke (Faktor)", SCRIBBLES, 1.0, 0.3, 3.0, None, Some(0.1)),
        color("scribbleColor1", "Farbe 1", SCRIBBLES, "#d123a0"),
        color("scribbleColor2", "Farbe 2", SCRIBBLES, "#09d0fe"),
        color("scribbleColor3", "Farbe 3", SCRIBBLES, "#986ea9"),
        color("scribbleColor4", "Farbe 4", SCRIBBLES, "#d39dd4"),
        flag("scribbleWhite", "Ab und zu weiss", SCRIBBLES, true),
        number("drawMs", "Zeichnen: Dauer je Zeichen", SCRIBBLES, 700.0, 0.0, 5000.0, MS, None),
        number("drawGapMs", "Zeichnen: Abstand zwischen Zeichen", SCRIBBLES, 8.0, 0.0, 200.0, MS, None),
        flag("drips", "Laufnasen", SCRIBBLES, true),
    ]
}

fn screens() -> Vec<SettingField> {
    let starting = |field| in_scene(SceneName::Starting, field);
    let brb = |field| in_scene(SceneName::Brb, field);
    let ending = |field| in_scene(SceneName::Ending, field);
    vec![
        starting(choice("gestureStarting", "Starting: Pinselstriche", SCREENS, "zweix", &GESTURES)),
        starting(choice(
            "gestureColorStarting",
            "Starting: Farbe bei einem X oder Strich",
            SCREENS,
            "cyan",
            &GESTURE_COLORS,
        )),
        number("haze", "Dunkler Dunst hinter dem Text", SCREENS, 0.78, 0.0, 1.0, None, STEP),
        brb(choice("gestureBrb", "BRB: Pinselstriche", SCREENS, "zweix", &GESTURES)),
        brb(choice("gestureColorBrb", "BRB: Farbe bei einem X oder Strich", SCREENS, "magenta", &GESTURE_COLORS)),
        ending(choice("gestureEnding", "Ending: Pinselstriche", SCREENS, "zweix", &GESTURES)),
        ending(choice("gestureColorEnding", "Ending: Farbe bei einem X oder Strich", SCREENS, "cyan", &GESTURE_COLORS)),
        starting(text("startingEyebrow", "Starting: Überzeile", SCREENS, "Stream startet", None)),
        starting(text("startingTitle", "Starting: Titel", SCREENS, "Gleich geht's los", None)),
        starting(lines(
            "startingLines",
            "Starting: Sprüche",
            SCREENS,
            &[
                "... vielleicht.",
                "Snacks holen, Chaos vorbereiten.",
                "Kabel sortieren? Niemals.",
                "Ordnung ist was für Anfänger.",
            ],
            None,
        )),
        brb(text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
        brb(text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        brb(lines(
            "brbLines",
            "BRB: Sprüche",
            SCREENS,
            &["Nicht weggehen.", "Das Chaos bleibt, wo es ist.", "Chat, pass auf die Kritzeleien auf."],
            None,
        )),
        brb(text("afkPrefix", "BRB: Text vor der Pausenzeit", SCREENS, "", None)),
        ending(text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None)),
        ending(text("endingTitle", "Ending: Titel", SCREENS, "Chaos beendet", None)),
        ending(lines(
            "endingLines",
            "Ending: Sprüche",
            SCREENS,
            &["Aufräumen? Morgen vielleicht.", "Bis zum nächsten Chaos!", "Danke, dass ihr da wart."],
            None,
        )),
        ending(text("endingNextLabel", "Ending: Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream", None)),
        ending(text("endingNext", "Ending: Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        number("linesEvery", "Sprüche wechseln alle", SCREENS, 8.0, 0.0, 600.0, S, None),
        starting(number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        starting(text("countdownPrefix", "Text vor dem Countdown", SCREENS, "", None)),
        starting(text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live", None)),
        starting(choice("progressStyle", "Fortschritt", SCREENS, "zickzack", &["zickzack", "balken", "aus"])),
        text("ticker", "Klebeband unten (leer = aus)", SCREENS, "", Some(300)),
        number("tickerSpeed", "Klebeband: Dauer eines Durchlaufs", SCREENS, 25.0, 5.0, 200.0, S, None),
        choice("powerOn", "Einschalten", SCREENS, "spray", &["spray", "blende", "keins"]),
        number("powerOnDuration", "Einschalten: Dauer", SCREENS, 2500.0, 0.0, 10000.0, MS, None),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Brb, Ending, Starting};
    BTreeMap::from([(SCREENS.to_owned(), vec![Starting, Brb, Ending])])
}

/// On first login: channel name from the Twitch login instead of the sample
fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([("channelName".to_owned(), SettingValue::Text(login.as_str().to_uppercase()))])
}

/// Simple view of the dashboard (template: `BASIC` in `src/themes/chaos/settings.ts`)
const BASIC: &[&str] = &[
    "channelName",
    "font",
    "titleFont",
    "accent",
    "accent2",
    "textColor",
    "scribbleColor1",
    "gestureStarting",
    "startingEyebrow",
    "startingTitle",
    "startingLines",
    "countdownDone",
    "ticker",
    "brbEyebrow",
    "brbTitle",
    "brbLines",
    "endingEyebrow",
    "endingTitle",
    "endingNext",
];

#[must_use]
pub fn chaos() -> Theme {
    let fields = [general(), scribbles(), screens()].concat();
    let schema = ThemeSchema {
        id: "chaos".to_owned(),
        name: "Chaos".to_owned(),
        fields: mark_basic(fields, BASIC),
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
        assert_same_as_fixture(&chaos(), include_str!("../../tests/fixtures/chaos.json"));
    }

    #[test]
    fn personalize_sets_the_channel_name() {
        let neo = Login::parse("neo").expect("valid login");
        assert_eq!(
            personalize(&neo),
            BTreeMap::from([("channelName".to_owned(), SettingValue::Text("NEO".to_owned()))])
        );
    }
}
