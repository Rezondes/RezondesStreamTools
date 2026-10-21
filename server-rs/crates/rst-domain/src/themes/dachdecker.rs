//! Settings schema of the Dachdecker theme: a roof frame of glowing plan lines on blueprint, drawn, covered and
//! celebrated in terracotta, copper and slate (template: `src/themes/dachdecker/settings.ts`). Labels, groups and
//! defaults are the German UI texts and stay equal to the TypeScript schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, lines, mark_basic, number, text,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};

const FONTS: [&str; 4] = ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"];
const QUALITIES: [&str; 3] = ["hoch", "mittel", "niedrig"];
const PROGRESS: [&str; 2] = ["masskette", "aus"];

const GENERAL: &str = "Allgemein";
const FRAME: &str = "Dachstuhl";
const STARTING: &str = "Starting";
const BRB: &str = "BRB";
const ENDING: &str = "Ending";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);
const PERCENT: Option<Unit> = Some(Unit::Percent);

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanal-Name", GENERAL, "DACHDECKER", Some(40)),
        font("font", "Schrift", GENERAL, "Roboto Mono", &FONTS),
        number("fontSize", "Schriftgrösse", GENERAL, 26.0, 12.0, 60.0, PX, None),
        number("titleSize", "Titelgrösse", GENERAL, 72.0, 32.0, 160.0, PX, None),
        number("countSize", "Countdown-Grösse", GENERAL, 104.0, 32.0, 220.0, PX, None),
        color("blueprint", "Blaupause (Hintergrund)", GENERAL, "#192a56"),
        color("page", "Blaupause dunkel (Verlauf unten)", GENERAL, "#121e40"),
        color("accent", "Signatur Terrakotta", GENERAL, "#e67e22"),
        color("brick", "Ziegelrot (Flächen und Leuchten)", GENERAL, "#d35400"),
        color("copper", "Kupfer", GENERAL, "#d4a373"),
        color("slate", "Schiefer", GENERAL, "#2c3e50"),
        color("slateDark", "Schiefer dunkel", GENERAL, "#1a252f"),
        color("card", "Karte (Protokoll, Schilder)", GENERAL, "#22356a"),
        color("line", "Plan-Linien und Text", GENERAL, "#ffffff"),
        color("muted", "Gedämpfter Text und Füllung", GENERAL, "#b4c2e0"),
        color("rain", "Regen (Cyan)", GENERAL, "#7fe3ff"),
        color("dusk", "Abendglühen", GENERAL, "#8a3d16"),
        choice("quality", "Leistungsstufe 3D", GENERAL, "mittel", &QUALITIES),
        flag("bloom", "Leuchten (Bloom)", GENERAL, true),
        number("bloomStrength", "Leuchten: Stärke", GENERAL, 0.42, 0.0, 2.0, None, Some(0.02)),
        number("glow", "Text-Leuchten (0 = aus)", GENERAL, 0.8, 0.0, 1.0, None, Some(0.05)),
        flag("scramble", "Texte entschlüsseln sich", GENERAL, true),
        number("scrambleMs", "Entschlüsseln: Dauer", GENERAL, 1400.0, 100.0, 5000.0, MS, None),
        flag("flicker", "Titel flackert wie eine Lampe", GENERAL, true),
        number("flickerEvery", "Flackern alle", GENERAL, 5.0, 1.0, 60.0, S, None),
        number("linesEvery", "Wechselnde Zeilen: alle", GENERAL, 8.0, 2.0, 120.0, S, None),
    ]
}

fn frame() -> Vec<SettingField> {
    vec![
        number("span", "Spannweite in Metern", FRAME, 8.4, 4.0, 14.0, None, Some(0.1)),
        number("rise", "Firsthöhe in Metern", FRAME, 3.25, 1.5, 6.0, None, Some(0.05)),
        number("trusses", "Binder", FRAME, 5.0, 2.0, 9.0, None, None),
        number("trussGap", "Binderabstand in Metern", FRAME, 1.5, 0.8, 3.0, None, Some(0.1)),
        number("overhang", "Sparren-Überstand", FRAME, 12.0, 0.0, 30.0, PERCENT, None),
        number("lineOpacity", "Plan-Linien: Deckkraft", FRAME, 0.62, 0.0, 1.0, None, Some(0.02)),
        number("fillOpacity", "Balken: Füllung", FRAME, 0.1, 0.0, 0.5, None, Some(0.02)),
        flag("grid", "Raster am Boden", FRAME, true),
        number("gridOpacity", "Raster: Deckkraft", FRAME, 0.13, 0.0, 0.5, None, Some(0.01)),
        flag("fog", "Nebel in der Ferne", FRAME, true),
        number("tileCopperShare", "Anteil Kupferziegel", FRAME, 15.0, 0.0, 50.0, PERCENT, None),
        number("seed", "Zufall: Startwert", FRAME, 7.0, 1.0, 9999.0, None, None),
        number("cameraRadius", "Kamera: Abstand", FRAME, 17.0, 8.0, 40.0, None, Some(0.5)),
        number("cameraHeight", "Kamera: Höhe", FRAME, 6.4, 1.0, 20.0, None, Some(0.1)),
        number("cameraSpeed", "Kamera: Tempo beim Kreisen", FRAME, 0.07, 0.0, 0.5, None, Some(0.01)),
        flag("cameraIntro", "Kamera fährt am Anfang heraus", FRAME, true),
        number("buildSpeed", "Aufbau: Tempo (Faktor)", FRAME, 1.0, 0.25, 4.0, None, Some(0.05)),
    ]
}

fn starting() -> Vec<SettingField> {
    vec![
        text(
            "startingHead",
            "Kopfzeile (// trennt Abschnitte)",
            STARTING,
            "BAUPLAN 01 // DACHSTUHL 3D // {channel}",
            None,
        ),
        text("startingTitle", "Titel", STARTING, "STREAM STARTET GLEICH", None),
        text("startingSubtitle", "Unterzeile (leer = aus)", STARTING, "", None),
        lines(
            "startingLines",
            "Wechselnde Zeilen",
            STARTING,
            &[
                "Sparren stehen, gleich wird gedeckt",
                "Kaffee ist durch, die Leiter steht",
                "Erst messen, dann sägen",
                "Der Polier zählt noch die Ziegel",
            ],
            None,
        ),
        number("countdown", "Countdown-Standard", STARTING, 300.0, 0.0, 86400.0, S, None),
        text("countdownPrefix", "Text vor dem Countdown", STARTING, "", None),
        text("countdownDone", "Text nach dem Countdown", STARTING, "GLEICH GEHT'S LOS", None),
        flag("startingTiles", "Erste Ziegelreihen", STARTING, true),
        number("startingTileRows", "Ziegelreihen", STARTING, 4.0, 1.0, 11.0, None, None),
        choice("startingProgress", "Fortschritt", STARTING, "masskette", &PROGRESS),
        flag("startingBlock", "Schriftfeld unten rechts", STARTING, true),
        lines(
            "startingBlockLines",
            "Schriftfeld: Zeilen (| trennt Spalten)",
            STARTING,
            &["PROJEKT: STREAM", "M 1:50 | BLATT 1/3", "GEZ. {channel} | {date}"],
            Some(6),
        ),
        text("ticker", "Ticker als Masskette unten (leer = aus)", STARTING, "", Some(300)),
        number("tickerSpeed", "Ticker: Dauer eines Durchlaufs", STARTING, 30.0, 5.0, 300.0, S, None),
    ]
}

fn brb() -> Vec<SettingField> {
    vec![
        text("brbHead", "Kopfzeile (// trennt Abschnitte)", BRB, "BAUPLAN 02 // PAUSE BEI REGEN // {channel}", None),
        text("brbTitle", "Titel", BRB, "BIN GLEICH ZURÜCK", None),
        text("brbSubtitle", "Unterzeile (leer = aus)", BRB, "DAS DACH HÄLT DICHT", None),
        text("brbTimerPrefix", "Text vor der Pausenzeit", BRB, "SEIT ", None),
        lines(
            "brbLines",
            "Wechselnde Zeilen",
            BRB,
            &["Der Regen prüft die Ziegel", "Kurz unters Vordach", "Gleich wird weiter gedeckt"],
            None,
        ),
        flag("brbBlock", "Schriftfeld unten rechts", BRB, true),
        lines(
            "brbBlockLines",
            "Schriftfeld: Zeilen (| trennt Spalten)",
            BRB,
            &["PROJEKT: STREAM", "WETTER: REGEN | BLATT 2/3", "STATUS | DICHT"],
            Some(6),
        ),
        number("brbTileRows", "Ziegelreihen", BRB, 11.0, 1.0, 11.0, None, None),
        flag("rainOn", "Regen", BRB, true),
        // fixed: at most 6000 drops, more would cost the PC too much per frame
        number("rainCount", "Regen: Tropfen", BRB, 2600.0, 0.0, 6000.0, None, None),
        number("rainSpeed", "Regen: Tempo (Faktor)", BRB, 1.0, 0.2, 3.0, None, Some(0.05)),
        number("rainLength", "Regen: Länge der Striche in Metern", BRB, 0.38, 0.05, 1.5, None, Some(0.01)),
        number("rainOpacity", "Regen: Deckkraft", BRB, 0.75, 0.0, 1.0, None, Some(0.05)),
        flag("splashOn", "Spritzer auf dem Dach", BRB, true),
        number("splashAmount", "Spritzer je Aufprall", BRB, 3.0, 1.0, 8.0, None, None),
        flag("splashGround", "Spritzer am Boden", BRB, true),
        number("windMax", "Wind: stärkste Böe", BRB, 2.5, 0.0, 6.0, None, Some(0.1)),
        number("windEvery", "Wind: neue Böe alle", BRB, 3.5, 1.0, 30.0, S, Some(0.5)),
        flag("lightningOn", "Blitze", BRB, true),
        number("lightningEvery", "Blitze: alle", BRB, 8.0, 2.0, 120.0, S, None),
        // fixed: at most 1, a brighter flash floods the whole picture
        number("lightningStrength", "Blitze: Helligkeit", BRB, 0.6, 0.0, 1.0, None, Some(0.05)),
        flag("rainSound", "Regenrauschen", BRB, false),
        number("rainVolume", "Regenrauschen: Lautstärke", BRB, 40.0, 0.0, 100.0, PERCENT, None),
    ]
}

fn ending() -> Vec<SettingField> {
    vec![
        text("endingHead", "Kopfzeile (// trennt Abschnitte)", ENDING, "BAUPLAN 03 // RICHTFEST // {channel}", None),
        text("endingTitle", "Titel", ENDING, "FEIERABEND!", None),
        text("endingSubtitle", "Unterzeile (leer = aus)", ENDING, "DANKE FÜRS MITDECKEN", None),
        text("endingNext", "Nächster Stream (leer = aus)", ENDING, "", None),
        flag("endingBlock", "Schriftfeld unten rechts", ENDING, true),
        lines(
            "endingBlockLines",
            "Schriftfeld: Zeilen (| trennt Spalten)",
            ENDING,
            &["PROJEKT: STREAM", "RICHTFEST | BLATT 3/3", "STATUS | ABGENOMMEN"],
            Some(6),
        ),
        number("wallHeight", "Wandhöhe in Metern", ENDING, 2.7, 1.5, 5.0, None, Some(0.1)),
        flag("windowsOn", "Fenster gehen an", ENDING, true),
        number("windowStep", "Fenster: Abstand", ENDING, 350.0, 0.0, 3000.0, MS, None),
        flag("smokeOn", "Rauch aus dem Schornstein", ENDING, true),
        number("smokeAmount", "Rauch: Wolken", ENDING, 14.0, 1.0, 40.0, None, None),
        flag("wreathOn", "Richtkranz", ENDING, true),
        color("wreathGreen", "Richtkranz: Grün", ENDING, "#3f7a4a"),
        lines(
            "ribbonColors",
            "Richtkranz: Farben der Bänder (eine je Zeile)",
            ENDING,
            &["#e67e22", "#d4a373", "#ffffff", "#d35400", "#7fa8ff", "#e67e22"],
            Some(12),
        ),
        number("ribbonWind", "Bänder: Wind (Faktor)", ENDING, 1.0, 0.0, 3.0, None, Some(0.05)),
        flag("fireworksOn", "Feuerwerk", ENDING, true),
        number("fireworksEvery", "Feuerwerk: alle", ENDING, 2.5, 0.5, 30.0, S, Some(0.5)),
        number("fireworksSparks", "Feuerwerk: Funken je Rakete", ENDING, 110.0, 10.0, 400.0, None, None),
        flag("endingIntro", "Kamera startet am Richtkranz", ENDING, true),
        number("endingShift", "Haus nach rechts versetzt", ENDING, 230.0, 0.0, 600.0, PX, None),
        flag("protocolOn", "Abnahmeprotokoll", ENDING, true),
        text("protocolTitle", "Abnahmeprotokoll: Titel", ENDING, "ABNAHMEPROTOKOLL", None),
        // Keys: follows, subs, giftedSubs, raids, raiders, bits, redeems, hypeLevel, chatMessages, chatters, duration
        lines(
            "protocolLines",
            "Abnahmeprotokoll: Zeilen (Schlüssel|Text)",
            ENDING,
            &["follows|Neue Dachdecker", "subs|Abos", "raids|Raids", "bits|Bits", "chatMessages|Gelegte Ziegel"],
            Some(12),
        ),
        number("countUpMs", "Hochzählen: Dauer", ENDING, 1000.0, 0.0, 5000.0, MS, None),
        flag("stampOn", "Stempel", ENDING, true),
        text("stampText", "Stempel: Text", ENDING, "ABGENOMMEN", Some(40)),
        number("stampAt", "Stempel schlägt auf nach", ENDING, 6.0, 1.0, 60.0, S, Some(0.5)),
        flag("stampSound", "Stempel: Ton", ENDING, true),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Brb, Ending, Starting};
    [(FRAME, vec![Starting, Brb, Ending]), (STARTING, vec![Starting]), (BRB, vec![Brb]), (ENDING, vec![Ending])]
        .into_iter()
        .map(|(group, scenes)| (group.to_owned(), scenes))
        .collect()
}

/// On first login: channel name from the Twitch login instead of the sample
fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([("channelName".to_owned(), SettingValue::Text(login.as_str().to_uppercase()))])
}

/// Simple view of the dashboard (template: `BASIC` in `src/themes/dachdecker/settings.ts`)
const BASIC: &[&str] = &[
    "channelName",
    "font",
    "blueprint",
    "accent",
    "copper",
    "quality",
    "bloom",
    "startingHead",
    "startingTitle",
    "startingLines",
    "countdownDone",
    "startingTiles",
    "startingBlockLines",
    "ticker",
    "brbTitle",
    "brbSubtitle",
    "brbLines",
    "rainOn",
    "lightningOn",
    "rainSound",
    "endingTitle",
    "endingSubtitle",
    "endingNext",
    "protocolLines",
    "stampText",
    "fireworksOn",
];

#[must_use]
pub fn dachdecker() -> Theme {
    let fields = [general(), frame(), starting(), brb(), ending()].concat();
    let schema = ThemeSchema {
        id: "dachdecker".to_owned(),
        name: "Dachdecker".to_owned(),
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
        assert_same_as_fixture(&dachdecker(), include_str!("../../tests/fixtures/dachdecker.json"));
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
