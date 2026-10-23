//! Settings schema of the Kebab theme: a kebab shop as red line art on paper (template:
//! `src/themes/kebab/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal to the TypeScript
//! schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, color, flag, font, in_scene, lines, mark_basic, number, text,
};
use crate::themes::graphics_fields::quality_field;
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;

const TITLE_FONTS: [&str; 3] = ["Titan One", "Baloo 2", "Fredoka"];
const TEXT_FONTS: [&str; 3] = ["Nunito", "DM Sans", "Manrope"];

const GENERAL: &str = "Allgemein";
const CHEF: &str = "Koch und Spieß";
const STARTING: &str = "Starting";
const BRB: &str = "BRB";
const ENDING: &str = "Ending";
const CLOSING: &str = "Tagesabschluss";
const STINGER: &str = "Stinger";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Ladenname ({shop})", GENERAL, "Döner", Some(40)),
        font("titleFont", "Schrift: Titel und Namen", GENERAL, "Titan One", &TITLE_FONTS),
        font("font", "Schrift: Text", GENERAL, "Nunito", &TEXT_FONTS),
        number("fontSize", "Schriftgrösse", GENERAL, 24.0, 10.0, 60.0, PX, None),
        color("red", "Linien und Bogenschrift (Signatur)", GENERAL, "#f85449"),
        color("redText", "Rot für Schrift und Flächen", GENERAL, "#c8261b"),
        color("paper", "Papier", GENERAL, "#fff8ec"),
        color("bon", "Bon-Papier", GENERAL, "#fffdf8"),
        color("kraft", "Tütenpapier", GENERAL, "#f9ebd6"),
        color("brown", "Text dunkel", GENERAL, "#3a1a12"),
        color("muted", "Text gedämpft", GENERAL, "#8a5a4a"),
        color("steam", "Dampf über dem Spiel", GENERAL, "#fff8ec"),
        quality_field(GENERAL),
        number("inkRoughness", "Linie: Rauheit", GENERAL, 0.55, 0.0, 3.0, None, Some(0.05)),
        number("inkBowing", "Linie: Bogen", GENERAL, 0.6, 0.0, 5.0, None, Some(0.05)),
        number("inkWidth", "Linie: Stärke (Faktor)", GENERAL, 1.0, 0.3, 3.0, None, Some(0.05)),
        number("inkSeed", "Linie: Startwert", GENERAL, 11.0, 1.0, 9999.0, None, None),
        number("introSpeed", "Auftritt: Tempo (Faktor)", GENERAL, 1.0, 0.25, 4.0, None, Some(0.05)),
        flag("lightsOn", "Licht flackert beim Start an", GENERAL, true),
    ]
}

fn chef() -> Vec<SettingField> {
    vec![
        text("arcText", "Bogenschrift", CHEF, "DÖNER KEBAB", Some(30)),
        number("arcSize", "Bogenschrift: Grösse", CHEF, 72.0, 20.0, 140.0, None, None),
        number("arcSpan", "Bogenschrift: Winkel", CHEF, 66.0, 10.0, 180.0, None, None),
        number("arcStroke", "Bogenschrift: Kontur", CHEF, 4.0, 0.0, 12.0, PX, Some(0.5)),
        number("spitSpeed", "Spieß: Tempo", CHEF, 18.0, 0.0, 120.0, None, None),
        number("hatchRows", "Spieß: Reihen", CHEF, 32.0, 8.0, 60.0, None, None),
        flag("sawOn", "Koch sägt", CHEF, true),
        number("sawSpeed", "Sägen: Tempo", CHEF, 5.2, 0.0, 20.0, None, Some(0.1)),
        number("sawAngle", "Sägen: Ausschlag", CHEF, 2.6, 0.0, 15.0, None, Some(0.1)),
        flag("hatOn", "Mütze wippt", CHEF, true),
        flag("stacheOn", "Schnurrbart zuckt", CHEF, true),
        number("blinkEvery", "Blinzeln: alle (0 = nie)", CHEF, 4.2, 0.0, 30.0, S, Some(0.1)),
        flag("shavingsOn", "Fleischspäne fallen", CHEF, true),
        number("shavingsEvery", "Späne: alle", CHEF, 160.0, 40.0, 2000.0, MS, None),
        number("shavingsFall", "Späne: Fallzeit", CHEF, 800.0, 100.0, 3000.0, MS, None),
        // At most 300 shavings, every one is drawn every frame
        number("shavingsMax", "Späne: höchstens", CHEF, 140.0, 0.0, 300.0, None, None),
        flag("steamOn", "Dampf", CHEF, true),
        number("steamHeight", "Dampf: Höhe", CHEF, 70.0, 0.0, 300.0, None, None),
    ]
}

fn starting() -> Vec<SettingField> {
    let scene = |field| in_scene(SceneName::Starting, field);
    vec![
        scene(text("startingNumber", "Bon: Bestellnummer", STARTING, "Bestellung Nr. 042", Some(40))),
        scene(lines(
            "startingItems",
            "Bon: Posten (Posten|Zusatz)",
            STARTING,
            &["1x Stream|mit alles", "1x Gute Laune|scharf", "1x Chat|extra Soße"],
            Some(6),
        )),
        scene(text("countdownLabel", "Countdown: Beschriftung", STARTING, "FERTIG IN", Some(40))),
        scene(number("countdown", "Countdown: Dauer", STARTING, 300.0, 0.0, 86400.0, S, None)),
        scene(text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", Some(5))),
        scene(text("countdownDone", "Text nach dem Countdown", STARTING, "GUTEN APPETIT!", Some(40))),
        scene(lines(
            "startingLines",
            "Bon: wechselnde Zeile unten",
            STARTING,
            &["Danke und guten Appetit!", "Zwiebeln? Scharf? Mit alles!"],
            Some(12),
        )),
        scene(number("linesEvery", "Wechselnde Zeile: alle", STARTING, 8.0, 1.0, 120.0, S, None)),
        scene(flag("bonOn", "Bestellbon zeigen", STARTING, true)),
        scene(text(
            "ticker",
            "Laufband (leer = aus)",
            STARTING,
            "Frisch vom Spieß • Mit alles und scharf • Gleich geht's los • Zwiebeln? Klar!",
            Some(300),
        )),
        scene(number("tickerSpeed", "Laufband: Tempo (px pro Sekunde)", STARTING, 90.0, 10.0, 400.0, None, None)),
    ]
}

fn brb() -> Vec<SettingField> {
    vec![
        in_scene(SceneName::Brb, text("brbTitle", "Bon: Titel", BRB, "BIN GLEICH ZURÜCK", Some(40))),
        in_scene(
            SceneName::Brb,
            lines("brbItems", "Bon: Posten (Posten|Zusatz)", BRB, &["1x Çay|heiß", "1x Pause|kurz"], Some(6)),
        ),
        in_scene(SceneName::Brb, text("brbTimerLabel", "Pausenzeit: Beschriftung", BRB, "PAUSE SEIT", Some(40))),
        in_scene(
            SceneName::Brb,
            lines(
                "brbLines",
                "Bon: wechselnde Zeile unten",
                BRB,
                &["Gleich geht's weiter", "Der Spieß dreht sich weiter"],
                Some(12),
            ),
        ),
        in_scene(SceneName::Brb, flag("brbTeaOn", "Koch trinkt Tee", BRB, true)),
        in_scene(SceneName::Brb, flag("brbSignOn", "Schild am Spieß", BRB, true)),
        in_scene(SceneName::Brb, text("brbSign", "Schild: Text", BRB, "Kurz Tee trinken", Some(30))),
        in_scene(SceneName::Brb, number("brbSignSwing", "Schild: Pendeln", BRB, 3.0, 0.0, 20.0, None, None)),
        in_scene(
            SceneName::Brb,
            text(
                "brbTicker",
                "Laufband (leer = aus)",
                BRB,
                "Gleich geht's weiter • Der Spieß dreht sich weiter • Noch kurz ziehen lassen",
                Some(300),
            ),
        ),
    ]
}

fn ending() -> Vec<SettingField> {
    vec![
        in_scene(SceneName::Ending, text("endingTitle", "Titel", ENDING, "Danke und bis morgen!", Some(60))),
        in_scene(SceneName::Ending, text("endingClosed", "Bon: Titel", ENDING, "HEUTE GESCHLOSSEN", Some(40))),
        in_scene(
            SceneName::Ending,
            lines(
                "endingItems",
                "Bon: Posten (Posten|Zusatz)",
                ENDING,
                &["1x Stream|aufgegessen", "1x Chat|satt"],
                Some(6),
            ),
        ),
        in_scene(
            SceneName::Ending,
            text("endingNextLabel", "Nächster Stream: Beschriftung", ENDING, "NÄCHSTER STREAM", Some(40)),
        ),
        in_scene(SceneName::Ending, text("endingNext", "Nächster Stream (leer = ausblenden)", ENDING, "", Some(60))),
        in_scene(SceneName::Ending, flag("shutterOn", "Rollladen", ENDING, true)),
        in_scene(SceneName::Ending, text("shutterText", "Rollladen: Schrift", ENDING, "DÖNER KEBAB", Some(30))),
        in_scene(
            SceneName::Ending,
            number("shutterStart", "Rollladen fährt herunter nach", ENDING, 1.0, 0.0, 60.0, S, Some(0.5)),
        ),
        in_scene(SceneName::Ending, number("shutterMs", "Rollladen: Dauer", ENDING, 1600.0, 0.0, 10000.0, MS, None)),
    ]
}

fn closing() -> Vec<SettingField> {
    vec![
        // Keys: follows, subs, giftedSubs, raids, raiders, bits, redeems, hypeLevel, chatMessages, chatters, duration
        in_scene(SceneName::Stats, text("closingTitle", "Bon: Titel", CLOSING, "TAGESABSCHLUSS", Some(40))),
        in_scene(
            SceneName::Stats,
            lines(
                "closingLines",
                "Zahlen (Schlüssel|Text)",
                CLOSING,
                &[
                    "follows|Neue Stammkunden",
                    "subs|Abos",
                    "raids|Raids",
                    "bits|Bits",
                    "chatMessages|Bestellungen im Chat",
                ],
                Some(12),
            ),
        ),
        in_scene(SceneName::Stats, number("countUpMs", "Hochzählen: Dauer", CLOSING, 1000.0, 0.0, 5000.0, MS, None)),
        in_scene(SceneName::Stats, flag("stampOn", "Stempel", CLOSING, true)),
        in_scene(SceneName::Stats, text("stampText", "Stempel: Text", CLOSING, "BEZAHLT", Some(20))),
        in_scene(SceneName::Stats, number("stampAt", "Stempel knallt auf nach", CLOSING, 3.0, 0.5, 60.0, S, Some(0.5))),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Brb, Ending, Starting, Stats};
    BTreeMap::from([
        (GENERAL.to_owned(), vec![Starting, Brb, Ending, Stats]),
        (CHEF.to_owned(), vec![Starting, Brb, Ending]),
        (STARTING.to_owned(), vec![Starting]),
        (BRB.to_owned(), vec![Brb]),
        (ENDING.to_owned(), vec![Ending]),
        (CLOSING.to_owned(), vec![Stats]),
        (STINGER.to_owned(), vec![]),
    ])
}

/// The shop of the streamer: "Rezondes' Döner" for a login ending in s, x or z, else "Neos Döner"
fn shop_of(login: &str) -> String {
    let mut chars = login.chars();
    let name = chars.next().map(|first| first.to_uppercase().chain(chars).collect::<String>()).unwrap_or_default();
    if name.ends_with(['s', 'x', 'z', 'S', 'X', 'Z']) { format!("{name}' Döner") } else { format!("{name}s Döner") }
}

fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([("channelName".to_owned(), SettingValue::Text(shop_of(login.as_str())))])
}

/// Simple view of the dashboard (template: `BASIC` in `src/themes/kebab/settings.ts`)
const BASIC: &[&str] = &[
    "quality",
    "channelName",
    "red",
    "redText",
    "sawOn",
    "shavingsOn",
    "startingItems",
    "countdownLabel",
    "countdownDone",
    "ticker",
    "brbTitle",
    "brbSign",
    "brbTicker",
    "endingTitle",
    "endingNext",
    "closingTitle",
    "closingLines",
    "stampText",
];

#[must_use]
pub fn kebab() -> Theme {
    let fields = [general(), chef(), starting(), brb(), ending(), closing()].concat();
    let schema = ThemeSchema {
        id: "kebab".to_owned(),
        name: "Kebab".to_owned(),
        fields: mark_basic(with_stinger_fields(fields, STINGER, 60.0, 0.0), BASIC),
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
        assert_same_as_fixture(&kebab(), include_str!("../../tests/fixtures/kebab.json"));
    }

    #[test]
    fn personalize_sets_the_shop_name() {
        let shop = |login: &str| personalize(&Login::parse(login).expect("valid login"));
        let text = |value: &str| BTreeMap::from([("channelName".to_owned(), SettingValue::Text(value.to_owned()))]);
        assert_eq!(shop("rezondes"), text("Rezondes' Döner"));
        assert_eq!(shop("neo"), text("Neos Döner"));
    }
}
