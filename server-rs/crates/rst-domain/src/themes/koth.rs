//! Settings schema of the King of the Hill theme: military look after the KOTH mode of Arma 3, Arma Reforger and
//! Wardogs, a hill with radio mast and flag in the middle, three factions fight for it; plus soldiers as minimes in roles
//! and factions that stand on fixed places and fight (template: `src/themes/koth/settings.ts`, roles from
//! `src/themes/koth/soldiers3d.ts`). Labels, groups and defaults are the German UI texts and stay equal to the TypeScript
//! schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, mark_basic, number,
    text, with_defaults,
};
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::graphics_fields::quality_field;
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{
    MEDIC, MINIME_COMBAT, MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_TEAMS, MINIME_VARIANTS, minime_aim_key,
    minime_base_fields, minime_combat_fields, minime_fire_key, minime_team_fields, minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

const GENERAL: &str = "Allgemein";
const HILL: &str = "Hügel";
const SCREENS: &str = "Starting, BRB, Ending";
const ALERTS: &str = "Alerts";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const STINGER: &str = "Stinger";
const BANNER: &str = "Banner";
const WORLD: &str = "Welt";
const CAMP: &str = "Lager";
const CAMERA: &str = "Kamera";
const NIGHT: &str = "BRB: Nacht";
const DUSK: &str = "Ending: Abend";
const MINIME_LOOK: &str = "Minimes: Aussehen";
const MINIME_MOVES: &str = "Minimes: Animationen";

const TIMES: [&str; 4] = ["morgen", "mittag", "abend", "nacht"];
const LOCALES: [&str; 8] = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"];
const MOTIONS: [&str; 5] = ["funk", "plopp", "gleiten", "blenden", "keins"];
const ICONS: [&str; 8] = ["helm", "abzeichen", "stern", "kiste", "fallschirm", "granate", "funk", "flagge"];

/// The roles of the soldiers: id, name, names in chat
const ROLES: [(&str, &str, &[&str]); 5] = [
    ("sturm", "Sturmsoldat", &["sturm", "sturmsoldat", "rifleman", "assault"]),
    (MEDIC, "Medic", &[MEDIC, "sani", "sanitaeter"]),
    ("mg", "MG-Schütze", &["mg", "lmg", "maschinengewehr", "machinegun"]),
    ("sniper", "Scharfschütze", &["sniper", "scharfschuetze"]),
    ("grenadier", "Grenadier", &["grenadier", "granate", "grenade"]),
];

/// The factions: id, name, names in chat, default color
const TEAMS: [(&str, &str, &[&str], &str); 3] = [
    ("blufor", "BLUFOR", &["blau", "blue", "blufor", "nato"], "#2f6fd6"),
    ("opfor", "OPFOR", &["rot", "red", "opfor"], "#d63a2f"),
    ("indfor", "INDFOR", &["gruen", "green", "indfor", "independent"], "#3a9a3a"),
];

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanal-Name", GENERAL, "KOTH", Some(40)),
        font("font", "Schrift", GENERAL, "Inter", &["Inter", "Share Tech Mono", "IBM Plex Mono", "DM Sans"]),
        font(
            "titleFont",
            "Titelschrift",
            GENERAL,
            "Black Ops One",
            &["Black Ops One", "Stardos Stencil", "Share Tech Mono", "Inter"],
        ),
        number("fontSize", "Schriftgrösse", GENERAL, 22.0, 10.0, 60.0, PX, None),
        color("textColor", "Textfarbe", GENERAL, "#f2f0e6"),
        color("olive", "Oliv", GENERAL, "#4b5320"),
        color("oliveDark", "Oliv dunkel", GENERAL, "#2f3416"),
        color("sand", "Sand", GENERAL, "#c2b280"),
        color("sandDark", "Sand dunkel", GENERAL, "#8f7f55"),
        color("steel", "Stahl (Geräte, Rahmen)", GENERAL, "#3c4146"),
        color("paper", "Papier (Karten, Berichte)", GENERAL, "#e9e4d0"),
        color("ink", "Schrift auf Papier", GENERAL, "#23251c"),
        color("accent", "Akzent (Signal-Orange)", GENERAL, "#ff8a1f"),
        color("accent2", "Akzent 2 (Funk-Grün)", GENERAL, "#7cff6b"),
        number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.4, 0.0, 1.0, None, Some(0.05)),
        number("radius", "Eckenradius", GENERAL, 6.0, 0.0, 60.0, PX, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 400.0, 0.0, 3000.0, MS, None),
        choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", &LOCALES),
    ]
}

fn hill() -> Vec<SettingField> {
    vec![
        color("skyMorningTop", "Himmel Morgen oben", HILL, "#c9a77c"),
        color("skyMorningBottom", "Himmel Morgen unten", HILL, "#f0dcb4"),
        color("skyDayTop", "Himmel Mittag oben", HILL, "#6f9fc8"),
        color("skyDayBottom", "Himmel Mittag unten", HILL, "#d6e6ef"),
        color("skyEveningTop", "Himmel Abend oben", HILL, "#8a4b3a"),
        color("skyEveningBottom", "Himmel Abend unten", HILL, "#e0a060"),
        color("skyNightTop", "Himmel Nacht oben", HILL, "#0d1420"),
        color("skyNightBottom", "Himmel Nacht unten", HILL, "#2a3440"),
        color("sun", "Sonne", HILL, "#ffe08a"),
        color("moon", "Mond", HILL, "#e8e6d0"),
        flag("mountains", "Berge im Hintergrund", HILL, true),
        color("mountainColor", "Berge", HILL, "#6b7280"),
        color("hillColor", "Hügel", HILL, "#6b7a3a"),
        color("hillDark", "Hügel im Schatten", HILL, "#4a5628"),
        flag("tower", "Funkmast", HILL, true),
        color("towerBlink", "Funkmast: Blinklicht", HILL, "#ff3b30"),
        color("flagColor", "Flagge auf dem Hügel", HILL, "#c2b280"),
        flag("sandbags", "Sandsäcke", HILL, true),
        flag("smoke", "Rauch am Horizont", HILL, true),
        number("smokeSpeed", "Rauch: Dauer eines Aufsteigens", HILL, 12.0, 2.0, 60.0, S, None),
        flag("dust", "Staub in der Luft", HILL, true),
    ]
}

/// 3D world, camp and camera (PLAN-KOTH.md package 2)
fn world() -> Vec<SettingField> {
    vec![
        quality_field(WORLD),
        number("worldSeed", "Startwert der Welt", WORLD, 301.0, 1.0, 9999.0, None, None),
        color("skyTop", "Himmel oben", WORLD, "#5d4a3a"),
        color("skyHorizon", "Himmel am Horizont", WORLD, "#f3dcb0"),
        number("fogNear", "Nebel ab (m)", WORLD, 50.0, 5.0, 400.0, None, None),
        number("fogFar", "Nebel dicht ab (m)", WORLD, 210.0, 10.0, 600.0, None, None),
        color("sunColor", "Sonnenlicht", WORLD, "#ffd29a"),
        number("bloomStrength", "Leuchten (Bloom)", WORLD, 0.55, 0.0, 2.0, None, Some(0.05)),
        flag("shadows", "Schatten", WORLD, true),
        number("hillHeight", "Hügelhöhe (m)", WORLD, 7.2, 2.0, 14.0, None, Some(0.1)),
        color("sandColor", "Sand am Fuss", WORLD, "#b9a06a"),
        number("mastHeight", "Funkmast: Höhe (m)", CAMP, 9.5, 4.0, 20.0, None, Some(0.1)),
        flag("mastWires", "Funkmast: Abspannseile", CAMP, true),
        flag("mastDish", "Funkmast: Schüssel und Plattform", CAMP, true),
        number("beaconEvery", "Funkmast: Blinken alle", CAMP, 1.4, 0.3, 10.0, S, Some(0.1)),
        choice("flagFaction", "Flagge: Fraktion", CAMP, "blufor", &["blufor", "opfor", "indfor"]),
        number("flagSize", "Flagge: Länge (m)", CAMP, 2.8, 1.0, 6.0, None, Some(0.1)),
        number("flagWind", "Flagge: Wind", CAMP, 1.0, 0.0, 3.0, None, Some(0.1)),
        flag("bunkerOn", "Bunker", CAMP, true),
        number("tents", "Zelte", CAMP, 2.0, 0.0, 6.0, None, None),
        number("crateStacks", "Kistenstapel", CAMP, 3.0, 0.0, 8.0, None, None),
        color("campBagColor", "Lager: Sandsäcke", CAMP, "#c2b280"),
        color("campBunkerColor", "Lager: Bunker", CAMP, "#8f7f55"),
        color("campTentColor", "Lager: Zelte", CAMP, "#4b5320"),
        color("campCrateColor", "Lager: Kisten", CAMP, "#4b5320"),
        color("campCrateLidColor", "Lager: Kistendeckel", CAMP, "#6b7a3a"),
        color("campJeepColor", "Lager: Jeep", CAMP, "#4b5320"),
        color("campJeepCabColor", "Lager: Jeep-Kabine", CAMP, "#2f3416"),
        flag("fenceOn", "Stacheldrahtzaun", CAMP, true),
        number("trees", "Kiefern", CAMP, 46.0, 0.0, 200.0, None, None),
        number("rocks", "Felsen", CAMP, 30.0, 0.0, 200.0, None, None),
        flag("jeepOn", "Jeep", CAMP, true),
        flag("helicopterOn", "Hubschrauber", CAMP, true),
        flag("markerFlagsOn", "Fähnchen der anderen Fraktionen", CAMP, true),
        number("smokeColumns", "Rauchsäulen", CAMP, 3.0, 0.0, 6.0, None, None),
        number("smokeAmount", "Rauch: Wolken je Säule", CAMP, 22.0, 4.0, 60.0, None, None),
        number("dustAmount", "Staub im Licht (Körner)", CAMP, 300.0, 0.0, 2000.0, None, None),
        flag("cameraIntro", "Kamerafahrt am Anfang", CAMERA, true),
        number("cameraRadius", "Abstand (m)", CAMERA, 40.0, 10.0, 120.0, None, None),
        number("cameraHeight", "Höhe (m)", CAMERA, 12.0, 2.0, 60.0, None, None),
        number("cameraSpeed", "Kreisen: Tempo", CAMERA, 0.045, 0.0, 0.5, None, Some(0.005)),
        number("buildSpeed", "Aufbau: Tempo", CAMERA, 1.0, 0.25, 4.0, None, Some(0.05)),
        color("brbSkyTop", "Himmel oben", NIGHT, "#0b1020"),
        color("brbSkyHorizon", "Himmel am Horizont", NIGHT, "#2a3150"),
        flag("moonOn", "Mond", NIGHT, true),
        flag("searchlightOn", "Suchscheinwerfer", NIGHT, true),
        number("searchlightSpeed", "Suchscheinwerfer: Tempo", NIGHT, 1.0, 0.0, 4.0, None, Some(0.1)),
        number("searchlightFrom", "Suchscheinwerfer: Winkel von (Grad)", NIGHT, -50.0, -90.0, 90.0, None, None),
        number("searchlightTo", "Suchscheinwerfer: Winkel bis (Grad)", NIGHT, 40.0, -90.0, 90.0, None, None),
        flag("campfireOn", "Lagerfeuer", NIGHT, true),
        number("brbCameraHeight", "Kamera: Höhe (m)", NIGHT, 9.0, 2.0, 60.0, None, None),
        color("endingSkyTop", "Himmel oben", DUSK, "#3a2a4a"),
        color("endingSkyHorizon", "Himmel am Horizont", DUSK, "#e9a46a"),
        flag("flaresOn", "Leuchtraketen", DUSK, true),
        number("flaresEvery", "Leuchtraketen: alle", DUSK, 2.2, 0.5, 10.0, S, Some(0.1)),
        number("flareSparks", "Leuchtraketen: Funken", DUSK, 80.0, 10.0, 400.0, None, None),
        flag("flareSound", "Leuchtraketen: Zischen", DUSK, false),
        flag("reportOn", "Einsatzbericht", DUSK, true),
        text("reportTitle", "Einsatzbericht: Titel", DUSK, "EINSATZBERICHT", None),
        lines(
            "reportLines",
            "Einsatzbericht: Zeilen (Wert|Text)",
            DUSK,
            &[
                "follows|Neue Rekruten",
                "subs|Verstärkung",
                "raids|Verbündete Trupps",
                "bits|Munition",
                "chatMessages|Funksprüche",
            ],
            Some(8),
        ),
        number("countUpMs", "Einsatzbericht: Hochzählen", DUSK, 1000.0, 0.0, 10000.0, MS, None),
        text("stampText", "Stempel (leer = aus)", DUSK, "AUFTRAG ERFÜLLT", None),
        number("stampAt", "Stempel nach", DUSK, 6.0, 0.0, 60.0, S, Some(0.5)),
    ]
}

fn screens() -> Vec<SettingField> {
    let starting = |field: SettingField| in_scene(SceneName::Starting, field);
    let brb = |field: SettingField| in_scene(SceneName::Brb, field);
    let ending = |field: SettingField| in_scene(SceneName::Ending, field);
    vec![
        starting(text("startingEyebrow", "Starting: Überzeile", SCREENS, "Einsatzbesprechung", None)),
        starting(text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None)),
        brb(text("brbEyebrow", "BRB: Überzeile", SCREENS, "Funkstille", None)),
        brb(text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        ending(text("endingEyebrow", "Ending: Überzeile", SCREENS, "Einsatzbericht", None)),
        ending(text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
        flag("mapGrid", "Lagekarte mit Raster", SCREENS, true),
        number("titleSize", "Titelgrösse", SCREENS, 104.0, 30.0, 240.0, PX, None),
        starting(number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        starting(text("countdownPrefix", "Countdown-Präfix", SCREENS, "T-", None)),
        starting(text("countdownDone", "Text nach dem Countdown", SCREENS, "Einsatz läuft!", None)),
        starting(choice("progressStyle", "Fortschritt", SCREENS, "balken", &["balken", "funk", "aus"])),
        brb(text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Funkstille seit ", None)),
        ending(text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Einsatz", None)),
        ending(text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        starting(lines(
            "startingLines",
            "Sprüche Starting",
            SCREENS,
            &[
                "Funkgeräte werden geprüft ...",
                "Munition wird verteilt ...",
                "Fahrzeuge werden betankt ...",
                "Lagekarte wird aktualisiert ...",
            ],
            None,
        )),
        brb(lines(
            "brbLines",
            "Sprüche BRB",
            SCREENS,
            &["Position halten ...", "Kaffee aus der Feldküche ...", "Funkkanal bleibt offen ..."],
            None,
        )),
        ending(lines(
            "endingLines",
            "Sprüche Ending",
            SCREENS,
            &["Hügel gesichert ...", "Rückzug zur Basis ...", "Bis zum nächsten Einsatz!"],
            None,
        )),
        number("linesEvery", "Sprüche wechseln alle", SCREENS, 6.0, 2.0, 120.0, S, None),
        text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(300)),
        number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30.0, 5.0, 300.0, S, None),
        starting(flag("briefingMapOn", "Starting: Lagekarte", SCREENS, true)),
        starting(text("briefingLabel", "Starting: Lagekarte Beschriftung", SCREENS, "LAGEKARTE  M 1:25 000", None)),
        starting(text("briefingTarget", "Starting: Lagekarte Ziel", SCREENS, "ZIEL: HÜGEL 301", None)),
        starting(flag("radioLinesOn", "Starting: Funkzeilen", SCREENS, true)),
        starting(number(
            "radioStaticMs",
            "Starting: Rauschen zwischen Funkzeilen",
            SCREENS,
            350.0,
            0.0,
            3000.0,
            MS,
            None,
        )),
    ]
}

fn alerts() -> Vec<SettingField> {
    let mut fields = vec![
        choice("alertStyle", "Stil", ALERTS, "marke", &["marke", "funk", "akte"]),
        flag("dogtagOn", "Hundemarke", ALERTS, true),
        lines(
            "dogtagLines",
            "Hundemarke: Prägung ({channel}, {user}, {amount})",
            ALERTS,
            &["{channel}", "{user}", "{amount}", "O POS"],
            Some(6),
        ),
        color("dogtagMetal", "Hundemarke: Metall", ALERTS, "#d9dde1"),
        number("dogtagSwing", "Hundemarke: Pendeln", ALERTS, 1.0, 0.0, 3.0, None, Some(0.1)),
        flag("alertSmokeOn", "Rauchstoss", ALERTS, true),
        text("radioChannel", "Funkgerät: Kanal", ALERTS, "KANAL 7  //  41.250 MHZ", None),
        number("alertStaticMs", "Funkgerät: Rauschen", ALERTS, 500.0, 0.0, 3000.0, MS, None),
        number("alertOpenMs", "Funkgerät: Aufklappen", ALERTS, 450.0, 0.0, 3000.0, MS, None),
        number("alertCloseMs", "Funkgerät: Zuklappen", ALERTS, 350.0, 0.0, 3000.0, MS, None),
        text("alertCallsign", "Rufzeichen ({channel})", ALERTS, "{channel} an alle", None),
        text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Rekrut", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} meldet sich zum Dienst!", None),
        choice("followIcon", "Follow: Symbol", ALERTS, "helm", &ICONS),
        text("subTag", "Sub: Kopfzeile", ALERTS, "Verstärkung", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} verstärkt die Truppe!", None),
        choice("subIcon", "Sub: Symbol", ALERTS, "abzeichen", &ICONS),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "Dienstzeit x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} dient seit {amount} Monaten!", None),
        choice("resubIcon", "Resub: Symbol", ALERTS, "stern", &ICONS),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "Nachschub", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} verteilt {amount} Abos!", None),
        choice("giftIcon", "Gift: Symbol", ALERTS, "kiste", &ICONS),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "Luftlandung", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} landet mit {amount} Soldaten!", None),
        choice("raidIcon", "Raid: Symbol", ALERTS, "fallschirm", &ICONS),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits ab!", None),
        choice("cheerIcon", "Bits: Symbol", ALERTS, "granate", &ICONS),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "funk", &ICONS),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rollt an die Front!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} erreicht!", None),
        choice("hypeIcon", "Hype Train: Symbol", ALERTS, "flagge", &ICONS),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        number("alertScale", "Grösse", ALERTS, 1.0, 0.3, 2.0, None, Some(0.05)),
        number("alertTop", "Abstand oben", ALERTS, 80.0, 0.0, 1000.0, PX, None),
        choice("alertAlign", "Position", ALERTS, "center", &["left", "center", "right"]),
        number("alertWidth", "Breite", ALERTS, 760.0, 300.0, 1800.0, PX, None),
        choice("alertIn", "Einblenden", ALERTS, "funk", &MOTIONS),
        choice("alertOut", "Ausblenden", ALERTS, "funk", &MOTIONS),
        flag("alertTimer", "Restzeit als Balken", ALERTS, true),
        flag("alertStatic", "Funkrauschen beim Einblenden", ALERTS, true),
        flag("alertSound", "Töne", ALERTS, true),
    ];
    fields.extend(alert_sound_fields(ALERTS));
    fields
}

fn chat_cam_music_fx() -> Vec<SettingField> {
    let mut fields = vec![choice("chatStyle", "Stil", CHAT, "funk", &["funk", "papier", "schlicht"])];
    fields.extend(badge_fields(CHAT));
    fields.extend([
        flag("chatBadges", "Badges zeigen", CHAT, true),
        flag("chatTime", "Zeitstempel", CHAT, true),
        number("chatFontSize", "Schriftgrösse", CHAT, 20.0, 8.0, 60.0, PX, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatMax", "Max. Nachrichten", CHAT, 12.0, 1.0, 100.0, None, None),
        choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", &["bottom", "top"]),
        number("chatOpacity", "Deckkraft", CHAT, 0.9, 0.0, 1.0, None, Some(0.01)),
        number("chatGap", "Abstand", CHAT, 6.0, 0.0, 40.0, PX, None),
        choice("camStyle", "Rahmen", CAM, "helm", &["helm", "visier", "schlicht"]),
        number("camFrameWidth", "Rahmenbreite", CAM, 12.0, 2.0, 60.0, PX, None),
        number("camRadius", "Eckenradius", CAM, 8.0, 0.0, 80.0, PX, None),
        flag("camMarks", "Markierungen in den Ecken", CAM, true),
        flag("camCross", "Fadenkreuz in der Mitte", CAM, false),
        flag("camBattery", "Akku-Anzeige", CAM, true),
        text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "REC", None),
        choice("musicStyle", "Stil", MUSIC, "funkgeraet", &["funkgeraet", "kiste", "schlicht"]),
        text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Feldfunk", None),
        text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Funkstille", None),
        text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik", None),
        text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Rauschen", None),
        flag("musicAlbum", "Album zeigen", MUSIC, false),
        flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
        flag("equalizer", "Signal-Anzeige", MUSIC, true),
        number("equalizerBars", "Signal-Anzeige: Balken", MUSIC, 8.0, 1.0, 16.0, None, None),
        choice("coverShape", "Cover-Form", MUSIC, "eckig", &["rund", "eckig"]),
        number("coverSize", "Cover-Grösse", MUSIC, 120.0, 40.0, 400.0, PX, None),
        number("musicTitleSize", "Titelgrösse", MUSIC, 26.0, 10.0, 80.0, PX, None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxTextSize", "Textgrösse", FX, 44.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, Some(Unit::Percent), None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
        choice("fxIn", "Einblenden", FX, "plopp", &MOTIONS),
        choice("fxOut", "Ausblenden", FX, "blenden", &MOTIONS),
        flag("fxBubble", "Text auf einem Funkzettel", FX, true),
    ]);
    fields
}

fn stinger_banner() -> Vec<SettingField> {
    vec![
        number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5.0, S, Some(0.05)),
        text("stingerText", "Text ({channel})", STINGER, "{channel}", None),
        flag("stingerFlag", "Flaggenwechsel", STINGER, true),
        color("smokeColor", "Rauch", STINGER, "#9ea3a0"),
        number("stingerPuffs", "Rauchwolken", STINGER, 40.0, 10.0, 120.0, None, None),
        text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", None),
        text("bannerProfileText", "Profilbanner: Text", BANNER, "Halte den Hügel.", None),
        text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Funkstille", None),
        text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Folge dem Kanal und verpasse keinen Einsatz.", None),
        lines(
            "bannerOfflineLines",
            "Offline-Banner: Zeilen",
            BANNER,
            &["Bald wieder im Einsatz", "Der Hügel wartet"],
            None,
        ),
    ]
}

fn minimes() -> Vec<SettingField> {
    // Soldiers stand on fixed places at the hill and do not wander off (core fields with own defaults)
    let mut fields = with_defaults(
        minime_base_fields(),
        &[("minimePlacement", SettingValue::Text("slots".to_owned())), ("minimeWalkWeight", SettingValue::Number(0.0))],
    );
    fields.extend([
        number("soldierSize", "Grösse", MINIME_LOOK, 70.0, 30.0, 300.0, PX, None),
        number("soldierGround", "Abstand zum unteren Rand", MINIME_LOOK, 20.0, 0.0, 300.0, PX, None),
        number("soldierShadow", "Schatten (Stärke)", MINIME_LOOK, 0.35, 0.0, 1.0, None, Some(0.05)),
        flag("soldierFaces", "Gesichter", MINIME_LOOK, true),
        color("skin", "Haut", MINIME_LOOK, "#e0b48a"),
        color("soldierEye", "Augen", MINIME_LOOK, "#1d1d1d"),
        color("helmet", "Helm", MINIME_LOOK, "#4b5320"),
        color("weapon", "Waffen", MINIME_LOOK, "#2b2d2f"),
        color("weaponMark", "Zielfernrohr und Munition", MINIME_LOOK, "#9fb3c8"),
        color("medicCross", "Medic: Kreuz", MINIME_LOOK, "#e53935"),
        color("muzzle", "Mündungsfeuer", MINIME_LOOK, "#ffd23f"),
        color("dustColor", "Staubwolke bei Treffern", MINIME_LOOK, "#b8a888"),
        color("soldierLight", "Licht auf den Soldaten", MINIME_LOOK, "#fff4e0"),
        choice("soldierDefault", "Rolle ohne Wahl (alle aus)", MINIME_LOOK, "sturm", &ROLES.map(|role| role.0)),
        flag("soldierNames", "Namen zeigen", MINIME_LOOK, true),
        choice("soldierNameStyle", "Namen auf", MINIME_LOOK, "band", &["band", "schild"]),
        number("soldierNameSize", "Name: Schriftgrösse", MINIME_LOOK, 14.0, 8.0, 48.0, PX, None),
        number("soldierBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000.0, 0.0, 30000.0, MS, None),
        choice("soldierEnter", "Erscheinen", MINIME_LOOK, "fallschirm", &["fallschirm", "blenden"]),
        choice("soldierExit", "Verschwinden", MINIME_LOOK, "abzug", &["abzug", "blenden"]),
        flag("holderBanner", "Anzeige: wer den Hügel hält", MINIME_LOOK, true),
        text("holderText", "Anzeige: Hügel gehalten ({team})", MINIME_LOOK, "{team} hält den Hügel", None),
        text("contestedText", "Anzeige: Gleichstand", MINIME_LOOK, "Hügel umkämpft", None),
        number("sightWeight", "Anvisieren: Häufigkeit", MINIME_MOVES, 12.0, 0.0, 100.0, None, None),
        number("sightMs", "Anvisieren: Dauer", MINIME_MOVES, 2000.0, 300.0, 10000.0, MS, None),
        number("reloadWeight", "Nachladen: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("reloadMs", "Nachladen: Dauer", MINIME_MOVES, 1400.0, 300.0, 10000.0, MS, None),
        number("coverWeight", "Deckung: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("coverMs", "Deckung: Dauer", MINIME_MOVES, 3000.0, 300.0, 20000.0, MS, None),
        number("proneWeight", "Hinlegen: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
        number("proneMs", "Hinlegen: Dauer", MINIME_MOVES, 4000.0, 300.0, 30000.0, MS, None),
        number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12.0, 0.0, 100.0, None, None),
        number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400.0, 300.0, 10000.0, MS, None),
        number("saluteWeight", "Salutieren: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("saluteMs", "Salutieren: Dauer", MINIME_MOVES, 1600.0, 300.0, 10000.0, MS, None),
        number("cheerMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900.0, 200.0, 5000.0, MS, None),
    ]);
    fields.extend(info_fields());
    fields.push(choice("timeInfo", "Befehlsseite: Tageszeit am Hügel", INFO_GROUP, "mittag", &TIMES));
    fields
}

/// Fights with own durations per role: the sniper aims long and fires once, the MG fires a long burst
fn combat() -> Vec<SettingField> {
    let number = SettingValue::Number;
    with_defaults(
        minime_combat_fields(&roles()),
        &[
            (&minime_aim_key("sniper"), number(1600.0)),
            (&minime_fire_key("sniper"), number(300.0)),
            (&minime_fire_key("mg"), number(1400.0)),
            (&minime_fire_key("grenadier"), number(900.0)),
        ],
    )
}

fn fields() -> Vec<SettingField> {
    [
        general(),
        hill(),
        world(),
        screens(),
        alerts(),
        chat_cam_music_fx(),
        stinger_banner(),
        minimes(),
        minime_variant_fields(&roles()),
        minime_team_fields(&teams()),
        combat(),
    ]
    .concat()
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    let screens = vec![SceneName::Starting, SceneName::Brb, SceneName::Ending];
    [
        (HILL, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending, SceneName::Info]),
        (SCREENS, screens.clone()),
        (ALERTS, vec![SceneName::Alerts]),
        (CHAT, vec![SceneName::Chat]),
        (CAM, vec![SceneName::Cam]),
        (MUSIC, vec![SceneName::Music]),
        (FX, vec![SceneName::Fx]),
        (WORLD, screens.clone()),
        (CAMP, screens.clone()),
        (CAMERA, screens),
        (NIGHT, vec![SceneName::Brb]),
        (DUSK, vec![SceneName::Ending]),
        (STINGER, vec![]),
        (BANNER, vec![]),
        (MINIME_COMMANDS, vec![SceneName::Minimes]),
        (MINIME_RULES, vec![SceneName::Minimes]),
        (MINIME_MOTION, vec![SceneName::Minimes]),
        (MINIME_VARIANTS, vec![SceneName::Minimes]),
        (MINIME_TEAMS, vec![SceneName::Minimes]),
        (MINIME_LOOK, vec![SceneName::Minimes]),
        (MINIME_MOVES, vec![SceneName::Minimes]),
        (MINIME_COMBAT, vec![SceneName::Minimes]),
        (INFO_GROUP, vec![SceneName::Info]),
    ]
    .into_iter()
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
}

fn names(list: &[&str]) -> Vec<String> {
    list.iter().map(|name| (*name).to_owned()).collect()
}

fn roles() -> MinimeVariantSet {
    MinimeVariantSet {
        command: "!rolle".to_owned(),
        label: "Rolle".to_owned(),
        variants: ROLES
            .iter()
            .map(|(id, label, list)| MinimeVariantInfo {
                id: (*id).to_owned(),
                label: (*label).to_owned(),
                names: names(list),
                color: None,
            })
            .collect(),
    }
}

fn teams() -> MinimeVariantSet {
    MinimeVariantSet {
        command: "!team".to_owned(),
        label: "Fraktion".to_owned(),
        variants: TEAMS
            .iter()
            .map(|(id, label, list, color)| MinimeVariantInfo {
                id: (*id).to_owned(),
                label: (*label).to_owned(),
                names: names(list),
                color: Some((*color).to_owned()),
            })
            .collect(),
    }
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

/// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
/// (template: `BASIC` in `src/themes/koth/settings.ts`)
const BASIC: &[&str] = &[
    "channelName",
    "font",
    "titleFont",
    "textColor",
    "accent",
    "accent2",
    "tower",
    "mountains",
    "smoke",
    "flagFaction",
    "startingEyebrow",
    "startingTitle",
    "ticker",
    "brbTitle",
    "searchlightOn",
    "flaresOn",
    "endingTitle",
    "endingNext",
    "alertStyle",
    "followLine",
    "subLine",
    "resubLine",
    "giftLine",
    "raidLine",
    "cheerLine",
    "redeemLine",
    "hypeBeginLine",
    "chatStyle",
    "chatBadges",
    "camStyle",
    "camLabel",
    "camLive",
    "musicStyle",
    "musicHide",
    "fxIn",
    "fxOut",
    "soldierDefault",
    "soldierNames",
];

#[must_use]
pub fn koth() -> Theme {
    let schema = ThemeSchema {
        id: "koth".to_owned(),
        name: "King of the Hill".to_owned(),
        fields: mark_basic(with_stinger_fields(fields(), STINGER, 60.0, 0.0), BASIC),
        group_scenes: group_scenes(),
        minime_variants: Some(roles()),
        minime_teams: Some(teams()),
    };
    Theme { schema, personalize }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::themes::fixture::assert_same_as_fixture;

    #[test]
    fn same_as_typescript() {
        assert_same_as_fixture(&koth(), include_str!("../../tests/fixtures/koth.json"));
    }

    #[test]
    fn three_factions_fixed_places_and_fights() {
        let schema = koth().schema;
        assert_eq!(schema.minime_teams.as_ref().map(|teams| teams.variants.len()), Some(3));
        let placement = schema.field("minimePlacement").map(SettingField::default_value);
        assert_eq!(placement, Some(SettingValue::Text("slots".to_owned())));
        let walk = schema.field("minimeWalkWeight").map(SettingField::default_value);
        assert_eq!(walk, Some(SettingValue::Number(0.0)));
        assert!(schema.field("minimeTeamColor_opfor").is_some());
        assert!(schema.field("minimeCombat").is_some());
    }
}
