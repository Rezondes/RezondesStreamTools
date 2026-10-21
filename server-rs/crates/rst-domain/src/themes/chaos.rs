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
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::graphics_fields::quality_field;
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{
    MINIME_COMMANDS, MINIME_HOP, MINIME_MOTION, MINIME_RULES, minime_fields, minime_hop_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};
use crate::themes::stinger_fields::stinger_fields;

const FONTS: [&str; 4] = ["Space Grotesk", "Inter", "Manrope", "DM Sans"];
const TITLE_FONTS: [&str; 4] = ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"];
const GESTURES: [&str; 4] = ["zweix", "x", "strich", "keine"];
const GESTURE_COLORS: [&str; 2] = ["cyan", "magenta"];

const GENERAL: &str = "Allgemein";
const SCRIBBLES: &str = "Kritzeleien";
const SCREENS: &str = "Starting, BRB, Ending";
const MOTION: &str = "Bewegung";
const ALERTS: &str = "Alerts";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const STINGER: &str = "Stinger";
const BANNER: &str = "Banner";
const MINIME_LOOK: &str = "Minimes: Aussehen";
const MINIME_MOVES: &str = "Minimes: Animationen";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);
const PERCENT: Option<Unit> = Some(Unit::Percent);
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
        color("surface", "Fläche (Zettel)", GENERAL, "#2b2041"),
        color("surfaceLight", "Fläche hell", GENERAL, "#3a2c55"),
        color("textColor", "Textfarbe", GENERAL, "#ffffff"),
        color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#b8a6c4"),
        number("grain", "Körnung (0 = aus)", GENERAL, 0.55, 0.0, 1.0, None, STEP),
        number("jitter", "Zittern der Linien (0 = glatt)", GENERAL, 0.5, 0.0, 1.0, None, STEP),
        number("glow", "Leuchten (0 = aus)", GENERAL, 0.6, 0.0, 1.0, None, STEP),
        number("flicker", "Neon-Flackern (0 = aus)", GENERAL, 0.2, 0.0, 1.0, None, STEP),
        number("glitch", "Glitch-Stärke (0 = aus)", GENERAL, 0.3, 0.0, 1.0, None, STEP),
        number("glitchEvery", "Glitch alle", GENERAL, 9.0, 2.0, 120.0, S, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 450.0, 0.0, 3000.0, MS, None),
        quality_field(GENERAL),
        number("glowStrength", "Leuchten der Striche (Unschärfe)", GENERAL, 22.0, 0.0, 60.0, PX, None),
        number("glowAlpha", "Leuchten der Striche (Stärke)", GENERAL, 0.75, 0.0, 1.0, None, STEP),
        number("roughShare", "Kritzeleien mit Füllung (Anteil)", GENERAL, 35.0, 0.0, 100.0, PERCENT, None),
        flag("roughFill", "Kritzeleien gefüllt", GENERAL, true),
        flag("idleOn", "Bewegung nach dem Aufbau", MOTION, true),
        flag("boilOn", "Kritzeleien kochen", MOTION, true),
        number("boilFps", "Kochen: Bilder pro Sekunde", MOTION, 8.0, 1.0, 24.0, None, None),
        in_scene(
            SceneName::Brb,
            number("brbBoilFps", "BRB: Kochen (Bilder pro Sekunde)", MOTION, 5.0, 1.0, 24.0, None, None),
        ),
        number("driftAmount", "Treiben der Kritzeleien", MOTION, 2.5, 0.0, 20.0, PX, Some(0.5)),
        number("bristleShimmer", "Schimmern der Borsten (Faktor)", MOTION, 1.0, 0.0, 4.0, None, Some(0.1)),
        flag("dripLoop", "Laufnasen tropfen ab", MOTION, true),
        flag("dustOn", "Sprühstaub schwebt", MOTION, true),
        number("dustCount", "Sprühstaub (Anzahl)", MOTION, 90.0, 0.0, 600.0, None, None),
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
        starting(number("strokeMs", "Starting: Pinselstrich (Dauer)", SCREENS, 550.0, 100.0, 3000.0, MS, None)),
        starting(number(
            "scribbleStagger",
            "Starting: Kritzeleien nacheinander (Abstand)",
            SCREENS,
            45.0,
            0.0,
            500.0,
            MS,
            None,
        )),
        starting(number("sprayTitleMs", "Starting: Titel aufsprühen (Dauer)", SCREENS, 1200.0, 0.0, 5000.0, MS, None)),
        in_scene(
            SceneName::Ending,
            number("endingDrips", "Ending: zusätzliche Laufnasen am Titel", SCREENS, 6.0, 0.0, 30.0, None, None),
        ),
        text("ticker", "Klebeband unten (leer = aus)", SCREENS, "", Some(300)),
        number("tickerSpeed", "Klebeband: Dauer eines Durchlaufs", SCREENS, 25.0, 5.0, 200.0, S, None),
        choice("powerOn", "Einschalten", SCREENS, "spray", &["spray", "blende", "keins"]),
        number("powerOnDuration", "Einschalten: Dauer", SCREENS, 2500.0, 0.0, 10000.0, MS, None),
    ]
}

fn alerts() -> Vec<SettingField> {
    vec![
        text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} stiftet jetzt mit Chaos!", None),
        text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} sprüht ab jetzt mit!", None),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten im Chaos!", None),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!", None),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} bringt {amount} Leute ins Chaos!", None),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits an die Wand!", None),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rast los!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        number("alertTop", "Abstand oben", ALERTS, 120.0, 0.0, 1000.0, PX, None),
        number("alertWidth", "Breite", ALERTS, 820.0, 300.0, 1800.0, PX, None),
        choice("alertSide", "Schwaden von", ALERTS, "wechselnd", &["links", "rechts", "wechselnd"]),
        number("swathDensity", "Schwaden: Striche", ALERTS, 90.0, 0.0, 300.0, None, None),
        flag("alertTimer", "Restzeit als Markerstrich", ALERTS, true),
        flag("confetti", "Konfetti aus Kritzeleien", ALERTS, true),
        number("confettiCount", "Anzahl Konfetti", ALERTS, 18.0, 0.0, 60.0, None, None),
        flag("alertSound", "Töne", ALERTS, true),
    ]
}

fn chat_style() -> Vec<SettingField> {
    vec![choice("chatStyle", "Stil", CHAT, "zettel", &["zettel", "blasen", "schlicht"])]
}

fn chat_cam_music_fx() -> Vec<SettingField> {
    vec![
        flag("chatBadges", "Badges zeigen", CHAT, true),
        number("chatFontSize", "Schriftgrösse", CHAT, 22.0, 8.0, 60.0, PX, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatMax", "Max. Nachrichten", CHAT, 8.0, 1.0, 100.0, None, None),
        choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", &["bottom", "top"]),
        number("chatGap", "Abstand", CHAT, 12.0, 0.0, 40.0, PX, None),
        choice("camStyle", "Rahmen", CAM, "marker", &["marker", "neon", "schlicht"]),
        number("camFrameWidth", "Rahmenbreite", CAM, 12.0, 2.0, 60.0, PX, None),
        flag("camScribbles", "Kritzeleien an den Ecken", CAM, true),
        text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "LIVE", None),
        choice("musicStyle", "Stil", MUSIC, "zettel", &["zettel", "kassette", "schlicht"]),
        text("musicLabel", "Überzeile", MUSIC, "Läuft gerade", None),
        text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Stille im Chaos", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicCover", "Cover zeigen", MUSIC, true),
        flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
        flag("equalizer", "Equalizer", MUSIC, true),
        number("equalizerBars", "Equalizer: Striche", MUSIC, 9.0, 1.0, 24.0, None, None),
        flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        number("coverSize", "Cover-Grösse", MUSIC, 130.0, 40.0, 400.0, PX, None),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxTextSize", "Textgrösse", FX, 72.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, PERCENT, None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
    ]
}

fn stinger_banner() -> Vec<SettingField> {
    vec![
        number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5.0, S, Some(0.05)),
        text("stingerText", "Text in der Mitte ({channel})", STINGER, "{channel}", None),
        number("stingerTextSize", "Textgrösse", STINGER, 260.0, 40.0, 600.0, PX, None),
        text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", None),
        text("bannerProfileText", "Profilbanner: Text", BANNER, "Kritzeleien, Neon und gute Laune", None),
        text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Offline", None),
        text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Die Farbe trocknet noch. Folge dem Kanal!", None),
    ]
}

fn minimes() -> Vec<SettingField> {
    vec![
        color("minimeDefaultColor", "Farbe ohne eigene Wahl", MINIME_LOOK, "#d123a0"),
        number("minimeSize", "Breite der Figur", MINIME_LOOK, 90.0, 30.0, 300.0, PX, None),
        number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 30.0, 0.0, 300.0, PX, None),
        number("minimeStroke", "Strichstärke", MINIME_LOOK, 3.0, 0.5, 10.0, None, Some(0.5)),
        number("minimeGlow", "Leuchten (Stärke)", MINIME_LOOK, 1.0, 0.0, 3.0, None, Some(0.1)),
        number("minimeShadow", "Schatten (Stärke)", MINIME_LOOK, 0.5, 0.0, 1.0, None, STEP),
        flag("minimeNames", "Namen anzeigen", MINIME_LOOK, true),
        number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 20.0, 8.0, 48.0, PX, None),
        number("minimeNameGap", "Name: Abstand zum Kopf", MINIME_LOOK, 2.0, 0.0, 60.0, PX, None),
        number("minimeWiggleWeight", "Zappeln: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("minimeWiggleMs", "Zappeln: Dauer", MINIME_MOVES, 1200.0, 200.0, 10_000.0, MS, None),
        number("minimeGrinWeight", "Grinsen: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("minimeGrinMs", "Grinsen: Dauer", MINIME_MOVES, 1800.0, 200.0, 10_000.0, MS, None),
        number("minimeStarWeight", "Kritzel-Stern: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
        number("minimeStarMs", "Kritzel-Stern: Dauer", MINIME_MOVES, 2000.0, 200.0, 10_000.0, MS, None),
        number("minimeTumbleWeight", "Umfallen: Häufigkeit", MINIME_MOVES, 5.0, 0.0, 100.0, None, None),
        number("minimeTumbleMs", "Umfallen: Dauer", MINIME_MOVES, 2400.0, 500.0, 10_000.0, MS, None),
        number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeSleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000.0, 1000.0, 60_000.0, MS, None),
        number("minimeSleepScrawls", "Schlafen: aufsteigende Krakel", MINIME_MOVES, 3.0, 1.0, 8.0, None, None),
        number(
            "minimeSplatMs",
            "Reaktion auf Chat (Spray-Klecks): Dauer",
            MINIME_MOVES,
            900.0,
            200.0,
            5000.0,
            MS,
            None,
        ),
        number("minimeSplatSize", "Spray-Klecks: Grösse (Faktor)", MINIME_MOVES, 1.4, 0.5, 4.0, None, Some(0.1)),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Alerts, Brb, Cam, Chat, Ending, Fx, Info, Minimes, Music, Starting};
    [
        (SCREENS, vec![Starting, Brb, Ending]),
        (MOTION, vec![Starting, Brb, Ending]),
        (ALERTS, vec![Alerts]),
        (CHAT, vec![Chat]),
        (CAM, vec![Cam]),
        (MUSIC, vec![Music]),
        (FX, vec![Fx]),
        (STINGER, vec![]),
        (BANNER, vec![]),
        (MINIME_LOOK, vec![Minimes]),
        (MINIME_MOVES, vec![Minimes]),
        (MINIME_COMMANDS, vec![Minimes]),
        (MINIME_RULES, vec![Minimes]),
        (MINIME_MOTION, vec![Minimes]),
        (MINIME_HOP, vec![Minimes]),
        (INFO_GROUP, vec![Info]),
    ]
    .into_iter()
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
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
    "followLine",
    "subLine",
    "resubLine",
    "giftLine",
    "raidLine",
    "cheerLine",
    "redeemLine",
    "hypeBeginLine",
    "alertSide",
    "chatStyle",
    "chatBadges",
    "camStyle",
    "camLabel",
    "camLive",
    "musicStyle",
    "musicLabel",
    "musicIdle",
    "minimeDefaultColor",
    "minimeNames",
];

#[must_use]
pub fn chaos() -> Theme {
    let mut fields = [
        general(),
        scribbles(),
        screens(),
        alerts(),
        alert_sound_fields(ALERTS),
        chat_style(),
        badge_fields(CHAT),
        chat_cam_music_fx(),
        stinger_banner(),
        minime_fields(),
        minime_hop_fields(),
        minimes(),
        info_fields(),
    ]
    .concat();
    fields.push(number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900.0, 400.0, 1600.0, PX, None));
    let schema = ThemeSchema {
        id: "chaos".to_owned(),
        name: "Chaos".to_owned(),
        fields: mark_basic([fields, stinger_fields(STINGER, 60.0, 0.0)].concat(), BASIC),
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
