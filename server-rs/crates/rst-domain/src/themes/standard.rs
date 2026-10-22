//! Settings schema of the standard theme: clear, modern look with gradient, rounded cards and soft transitions
//! (template: `src/themes/standard/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal
//! to the TypeScript schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, mark_basic, number,
    text,
};
use crate::themes::core_fields::alert_sound_fields;
use crate::themes::graphics_fields::quality_field;
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;

const FONTS: [&str; 4] = ["Inter", "Manrope", "DM Sans", "Space Grotesk"];
const LOCALES: [&str; 8] = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"];
const ALERT_EXITS: [&str; 3] = ["Unschärfe", "Gleiten", "Blenden"];

const GENERAL: &str = "Allgemein";
const SCREENS: &str = "Starting, BRB, Ending";
const BACKGROUND: &str = "Hintergrund";
const ALERTS: &str = "Alerts";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const STINGER: &str = "Stinger";
const PROFILE_BANNER: &str = "Profilbanner";
const OFFLINE_BANNER: &str = "Offline-Banner";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

fn general() -> Vec<SettingField> {
    vec![
        color("accent", "Akzentfarbe", GENERAL, "#7c5cff"),
        color("accent2", "Zweite Akzentfarbe (Verlauf)", GENERAL, "#22d3ee"),
        color("textColor", "Textfarbe", GENERAL, "#ffffff"),
        color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#a1a1b5"),
        color("card", "Kartenfarbe", GENERAL, "#14141c"),
        color("background", "Hintergrund (Vollbild-Szenen)", GENERAL, "#0b0b12"),
        number("cardOpacity", "Deckkraft der Karten", GENERAL, 0.88, 0.0, 1.0, None, Some(0.01)),
        number("radius", "Eckenradius", GENERAL, 16.0, 0.0, 48.0, PX, None),
        font("font", "Schrift", GENERAL, "Inter", &FONTS),
        number("fontSize", "Schriftgrösse", GENERAL, 22.0, 10.0, 60.0, PX, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 400.0, 0.0, 3000.0, MS, None),
        text("channelName", "Kanal-Name", GENERAL, "STREAM", Some(40)),
        choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", &LOCALES),
    ]
}

fn screens() -> Vec<SettingField> {
    let starting = |field| in_scene(SceneName::Starting, field);
    let brb = |field| in_scene(SceneName::Brb, field);
    let ending = |field| in_scene(SceneName::Ending, field);
    vec![
        starting(text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los", None)),
        starting(text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None)),
        brb(text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
        brb(text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        brb(text("brbNote", "BRB: Untertitel", SCREENS, "Der Chat bleibt offen.", None)),
        ending(text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None)),
        ending(text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
        ending(text("endingNextLabel", "Ending: Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream", None)),
        ending(text("endingNext", "Ending: Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        starting(number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        starting(text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live", None)),
        starting(flag("progressBar", "Fortschrittsbalken", SCREENS, true)),
        flag("showClock", "Uhrzeit oben rechts", SCREENS, true),
        text("ticker", "Hinweis unten (leer = aus)", SCREENS, "", Some(300)),
        number("introMs", "Lichtfelder blenden auf", SCREENS, 1200.0, 0.0, 10000.0, MS, None),
        number("titleRiseMs", "Titel steigt auf (Dauer)", SCREENS, 900.0, 0.0, 5000.0, MS, None),
        // fixed: at most 900 ms, a digit has to settle before the next second
        number("digitRollMs", "Countdown und Pausenzeit: Ziffern rollen (Dauer)", SCREENS, 350.0, 0.0, 900.0, MS, None),
        starting(flag("progressShine", "Glanzlicht auf dem Fortschrittsbalken", SCREENS, true)),
        starting(number("shineEvery", "Glanzlicht: alle", SCREENS, 4.0, 2.0, 60.0, S, Some(0.5))),
        brb(number("brbPace", "BRB: Tempo der Lichtfelder (Faktor)", SCREENS, 0.5, 0.1, 1.0, None, Some(0.05))),
        brb(number("brbDim", "BRB: Helligkeit beim Atmen", SCREENS, 0.6, 0.0, 1.0, None, Some(0.05))),
        brb(number("brbBreatheSeconds", "BRB: Dauer eines Atemzugs (0 = aus)", SCREENS, 6.0, 0.0, 60.0, S, Some(0.5))),
        ending(lines(
            "endingStats",
            "Ending: Zahlen (Schlüssel|Text)",
            SCREENS,
            &["follows|Follows", "subs|Abos", "raids|Raids", "bits|Bits", "chatMessages|Nachrichten"],
            None,
        )),
        ending(number("countUpMs", "Ending: Hochzählen (Dauer)", SCREENS, 1200.0, 0.0, 10_000.0, MS, None)),
        ending(number("endingFadeAt", "Ending: Lichtfelder blenden aus nach", SCREENS, 10.0, 0.0, 600.0, S, None)),
        ending(number("endingFadeMs", "Ending: Ausblenden (Dauer)", SCREENS, 4000.0, 0.0, 20_000.0, MS, None)),
    ]
}

/// Light fields, light dust and grain in a `PixiJS` stage (PLAN-STANDARD.md package 1)
fn background() -> Vec<SettingField> {
    vec![
        quality_field(BACKGROUND),
        flag("blobs", "Lichtfelder", BACKGROUND, true),
        number("blobSpeed", "Lichtfelder: Dauer einer Bahn", BACKGROUND, 24.0, 4.0, 120.0, S, None),
        number("worldSeed", "Startwert der Lichtfelder", BACKGROUND, 7.0, 1.0, 9999.0, None, None),
        // fixed: at most 8 fields, each one is a large blurred sprite
        number("auroraFields", "Anzahl Lichtfelder", BACKGROUND, 4.0, 1.0, 8.0, None, None),
        number("auroraBlur", "Lichtfelder: Unschärfe", BACKGROUND, 40.0, 0.0, 200.0, PX, None),
        number("auroraStrength", "Lichtfelder: Helligkeit", BACKGROUND, 0.7, 0.0, 1.0, None, Some(0.01)),
        flag("dustOn", "Lichtstaub", BACKGROUND, true),
        // fixed: at most 400 motes, more costs too much on weak PCs
        number("dustCount", "Anzahl Lichtstaub", BACKGROUND, 70.0, 0.0, 400.0, None, None),
        flag("grainOn", "Feines Korn gegen Farbstufen", BACKGROUND, true),
        number("grainStrength", "Korn: Stärke", BACKGROUND, 0.025, 0.0, 0.2, None, Some(0.005)),
    ]
}

/// Placeholders: {user}, {amount}, {detail}, {text}
fn alerts() -> Vec<SettingField> {
    let mut fields = vec![
        text("followLabel", "Follow: Kopfzeile", ALERTS, "Neuer Follower", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} folgt jetzt!", None),
        text("subLabel", "Sub: Kopfzeile", ALERTS, "Neues Abo", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} hat abonniert!", None),
        text("resubLabel", "Resub: Kopfzeile", ALERTS, "Abo verlängert", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten dabei!", None),
        text("giftLabel", "Gift: Kopfzeile", ALERTS, "Abos verschenkt", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Subs!", None),
        text("raidLabel", "Raid: Kopfzeile", ALERTS, "Raid", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} raidet mit {amount} Leuten!", None),
        text("cheerLabel", "Bits: Kopfzeile", ALERTS, "Bits", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} cheert {amount} Bits!", None),
        text("redeemLabel", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        text("hypeLabel", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train ist abgefahren!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
        flag("alertMessage", "Nachricht zeigen", ALERTS, true),
        flag("alertProgress", "Restzeit-Balken", ALERTS, true),
        number("alertDuration", "Dauer", ALERTS, 6000.0, 2000.0, 60000.0, MS, None),
        number("alertTop", "Abstand oben", ALERTS, 48.0, 0.0, 1000.0, PX, None),
        number("alertWidth", "Breite", ALERTS, 640.0, 200.0, 1900.0, PX, None),
        flag("alertTraceOn", "Rand zeichnet sich ein", ALERTS, true),
        number("alertTraceMs", "Rand: Dauer", ALERTS, 700.0, 0.0, 3000.0, MS, None),
        number("alertGlow", "Schein um die Karte", ALERTS, 24.0, 0.0, 80.0, PX, None),
        flag("alertSparksOn", "Funken", ALERTS, true),
        // fixed: at most 300 sparks, more costs too much in OBS
        number("alertSparks", "Anzahl Funken", ALERTS, 36.0, 0.0, 300.0, None, None),
        choice("alertExit", "Abgang", ALERTS, "Unschärfe", &ALERT_EXITS),
        flag("alertSound", "Töne", ALERTS, true),
    ];
    fields.extend(alert_sound_fields(ALERTS));
    fields
}

fn chat_cam_music() -> Vec<SettingField> {
    vec![
        number("chatMax", "Max. Nachrichten", CHAT, 20.0, 1.0, 200.0, None, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatGap", "Abstand zwischen Nachrichten", CHAT, 8.0, 0.0, 40.0, PX, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        flag("chatBadges", "Badges zeigen", CHAT, true),
        text("camName", "Namensschild ({channel})", CAM, "{channel}", None),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "LIVE", None),
        number("camBorder", "Rahmenstärke", CAM, 4.0, 0.0, 24.0, PX, None),
        flag("camSpinOn", "Verlauf wandert ringsum", CAM, true),
        number("camSpinSeconds", "Verlauf: Dauer einer Runde", CAM, 8.0, 2.0, 120.0, S, None),
        text("musicLabel", "Überzeile", MUSIC, "Läuft gerade", None),
        text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Keine Musik", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicCover", "Cover zeigen", MUSIC, true),
        flag("musicMarquee", "Lange Zeilen laufen durch", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        number("coverSize", "Cover-Grösse", MUSIC, 120.0, 40.0, 400.0, PX, None),
    ]
}

fn fx_stinger_banner() -> Vec<SettingField> {
    vec![
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxTextSize", "Textgrösse", FX, 48.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, Some(Unit::Percent), None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
        number("stingerDuration", "Länge", STINGER, 1.2, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.6, 0.1, 5.0, S, Some(0.05)),
        number("stingerPanels", "Anzahl Streifen", STINGER, 3.0, 1.0, 8.0, None, None),
        text("stingerText", "Text in der Mitte ({channel})", STINGER, "{channel}", None),
        text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}", None),
        text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}", None),
        text("bannerProfileText", "Text", PROFILE_BANNER, "Games, Talk und gute Laune", None),
        text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Gerade offline", None),
        text("bannerOfflineText", "Text", OFFLINE_BANNER, "Folge dem Kanal und verpasse keinen Stream.", None),
    ]
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Alerts, Brb, Cam, Chat, Ending, Fx, Info, Music, Starting};
    [
        (SCREENS, vec![Starting, Brb, Ending]),
        (BACKGROUND, vec![Starting, Brb, Ending]),
        (ALERTS, vec![Alerts]),
        (CHAT, vec![Chat]),
        (CAM, vec![Cam]),
        (MUSIC, vec![Music]),
        (FX, vec![Fx]),
        (STINGER, vec![]),
        (PROFILE_BANNER, vec![]),
        (OFFLINE_BANNER, vec![]),
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

/// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
/// (template: `BASIC` in `src/themes/standard/settings.ts`)
const BASIC: &[&str] = &[
    "quality",
    "accent",
    "accent2",
    "textColor",
    "background",
    "font",
    "channelName",
    "startingEyebrow",
    "startingTitle",
    "countdownDone",
    "ticker",
    "brbEyebrow",
    "brbTitle",
    "brbNote",
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
    "chatBadges",
    "camName",
    "camLive",
    "musicLabel",
    "musicIdle",
    "musicHide",
];

#[must_use]
pub fn standard() -> Theme {
    let mut fields =
        [general(), screens(), background(), alerts(), chat_cam_music(), fx_stinger_banner(), info_fields()].concat();
    fields.push(number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 860.0, 400.0, 1600.0, PX, None));
    let schema = ThemeSchema {
        id: "standard".to_owned(),
        name: "Standard".to_owned(),
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
        assert_same_as_fixture(&standard(), include_str!("../../tests/fixtures/standard.json"));
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
