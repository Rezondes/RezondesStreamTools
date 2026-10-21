//! Settings schema of the Plantage theme (Südfrucht-Plantage): mango plantation with rows of mango trees, soil, crates
//! and the streamer as the mango picker for all scenes, stinger and banners, plus mango soldiers as minimes that hop
//! and fight (template: `src/themes/plantage/settings.ts`, roles from `src/themes/plantage/mangos.ts`). Labels, groups
//! and defaults are the German UI texts and stay equal to the TypeScript schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, mark_basic, number,
    text, with_defaults,
};
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{
    MEDIC, MINIME_COMBAT, MINIME_COMMANDS, MINIME_HOP, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minime_aim_key,
    minime_base_fields, minime_combat_fields, minime_fire_key, minime_hop_fields, minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

const GENERAL: &str = "Allgemein";
const FIELD: &str = "Plantage";
const SCREENS: &str = "Starting, BRB, Ending";
const ALERTS: &str = "Alerts";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const STINGER: &str = "Stinger";
const BANNER: &str = "Banner";
const MINIME_LOOK: &str = "Minimes: Aussehen";
const MINIME_MOVES: &str = "Minimes: Animationen";

const TIMES: [&str; 4] = ["morgen", "mittag", "abend", "nacht"];
const LOCALES: [&str; 8] = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"];
const MOTIONS: [&str; 5] = ["fallen", "plopp", "gleiten", "blenden", "keins"];
const ICONS: [&str; 8] = ["mango", "blatt", "kiste", "korb", "leiter", "sonne", "baum", "stern"];

/// The roles of the mango soldiers: id, name, names in chat
const ROLES: [(&str, &str, &[&str]); 5] = [
    ("sturm", "Sturmsoldat", &["sturm", "sturmsoldat", "rifleman", "assault"]),
    (MEDIC, "Medic", &[MEDIC, "sani", "sanitaeter"]),
    ("mg", "MG-Schütze", &["mg", "lmg", "maschinengewehr", "machinegun"]),
    ("sniper", "Scharfschütze", &["sniper", "scharfschuetze"]),
    ("grenadier", "Grenadier", &["grenadier", "granate", "grenade"]),
];

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanal-Name", GENERAL, "Plantage", Some(40)),
        font("font", "Schrift", GENERAL, "Baloo 2", &["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"]),
        font("titleFont", "Titelschrift", GENERAL, "Fredoka", &["Fredoka", "Baloo 2", "Pacifico", "Nunito"]),
        number("fontSize", "Schriftgrösse", GENERAL, 22.0, 10.0, 60.0, PX, None),
        color("textColor", "Textfarbe", GENERAL, "#ffffff"),
        color("textOnWood", "Text auf Holz und Papier", GENERAL, "#3a2410"),
        color("wood", "Holz", GENERAL, "#c8935a"),
        color("woodDark", "Holz dunkel (Maserung, Rand)", GENERAL, "#7a4a24"),
        color("paper", "Erntezettel", GENERAL, "#fff6df"),
        color("soil", "Erde", GENERAL, "#8b5e3c"),
        color("soilDark", "Erde dunkel", GENERAL, "#5e3b22"),
        color("leaf", "Blätter", GENERAL, "#2f8f3a"),
        color("leafDark", "Blätter dunkel", GENERAL, "#1d5e27"),
        color("trunk", "Baumstamm", GENERAL, "#6d4c2f"),
        color("mango", "Mango", GENERAL, "#ffb02e"),
        color("mangoBlush", "Mango rot", GENERAL, "#ff5e3a"),
        color("accent", "Akzent (Mango-Orange)", GENERAL, "#ff8c1a"),
        color("accent2", "Akzent 2 (Blattgrün)", GENERAL, "#4caf50"),
        number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.35, 0.0, 1.0, None, Some(0.05)),
        number("radius", "Eckenradius", GENERAL, 14.0, 0.0, 60.0, PX, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500.0, 0.0, 3000.0, MS, None),
        choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", &LOCALES),
    ]
}

fn field() -> Vec<SettingField> {
    vec![
        in_scene(SceneName::Starting, choice("timeStarting", "Tageszeit Starting", FIELD, "morgen", &TIMES)),
        in_scene(SceneName::Brb, choice("timeBrb", "Tageszeit BRB", FIELD, "mittag", &TIMES)),
        in_scene(SceneName::Ending, choice("timeEnding", "Tageszeit Ending", FIELD, "abend", &TIMES)),
        color("skyMorningTop", "Himmel Morgen oben", FIELD, "#ff9a76"),
        color("skyMorningBottom", "Himmel Morgen unten", FIELD, "#ffe2b0"),
        color("skyDayTop", "Himmel Mittag oben", FIELD, "#3aa0e0"),
        color("skyDayBottom", "Himmel Mittag unten", FIELD, "#c8ecff"),
        color("skyEveningTop", "Himmel Abend oben", FIELD, "#ff6f61"),
        color("skyEveningBottom", "Himmel Abend unten", FIELD, "#ffc371"),
        color("skyNightTop", "Himmel Nacht oben", FIELD, "#0b1d3a"),
        color("skyNightBottom", "Himmel Nacht unten", FIELD, "#2c4a5a"),
        color("sun", "Sonne", FIELD, "#ffd23f"),
        number("sunGlow", "Sonnenschein (Stärke)", FIELD, 1.0, 0.0, 3.0, None, Some(0.1)),
        color("moon", "Mond", FIELD, "#f5f1d6"),
        flag("clouds", "Wolken", FIELD, true),
        number("cloudCount", "Anzahl Wolken", FIELD, 4.0, 0.0, 8.0, None, None),
        number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", FIELD, 90.0, 10.0, 600.0, S, None),
        flag("hills", "Hügel im Hintergrund", FIELD, true),
        color("hillColor", "Hügel", FIELD, "#8fbf5a"),
        color("hillFarColor", "Hügel fern", FIELD, "#bcd88a"),
        number("treeRows", "Baumreihen", FIELD, 2.0, 1.0, 3.0, None, None),
        number("treesPerRow", "Bäume je Reihe", FIELD, 6.0, 2.0, 10.0, None, None),
        number("treeSize", "Baumgrösse (Faktor)", FIELD, 1.0, 0.4, 2.0, None, Some(0.05)),
        number("treeSway", "Bäume wiegen (Grad)", FIELD, 2.0, 0.0, 15.0, None, None),
        number("treeSwaySpeed", "Bäume wiegen (Dauer)", FIELD, 6.0, 1.0, 30.0, S, None),
        flag("mangosOnTrees", "Mangos an den Bäumen", FIELD, true),
        flag("crates", "Kisten am Feldrand", FIELD, true),
        flag("birds", "Vögel", FIELD, true),
        number("birdEvery", "Vögel: alle", FIELD, 18.0, 4.0, 120.0, S, None),
        flag("crateName", "Kanal-Name auf der Kiste", FIELD, true),
    ]
}

fn screens() -> Vec<SettingField> {
    let starting = |field: SettingField| in_scene(SceneName::Starting, field);
    let brb = |field: SettingField| in_scene(SceneName::Brb, field);
    let ending = |field: SettingField| in_scene(SceneName::Ending, field);
    vec![
        starting(text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los", None)),
        starting(text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None)),
        starting(text("startingNote", "Starting: Untertitel", SCREENS, "Die Mangos sind fast reif!", None)),
        brb(text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
        brb(text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        brb(text("brbNote", "BRB: Untertitel", SCREENS, "Kurz eine Reihe abernten.", None)),
        ending(text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None)),
        ending(text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
        ending(text("endingNote", "Ending: Untertitel", SCREENS, "Bis zur nächsten Ernte!", None)),
        choice("signStyle", "Schild", SCREENS, "haengend", &["haengend", "pfahl"]),
        number("signWidth", "Schild: Breite", SCREENS, 1100.0, 400.0, 1800.0, PX, None),
        number("titleSize", "Titelgrösse", SCREENS, 110.0, 30.0, 240.0, PX, None),
        flag("picker", "Mangopflücker zeigen", SCREENS, true),
        choice("pickerSide", "Mangopflücker: Seite", SCREENS, "links", &["links", "rechts"]),
        number("pickerSize", "Mangopflücker: Grösse (Faktor)", SCREENS, 1.0, 0.4, 2.0, None, Some(0.05)),
        color("pickerHat", "Mangopflücker: Hut", SCREENS, "#e8c770"),
        color("pickerShirt", "Mangopflücker: Hemd", SCREENS, "#3f7fbf"),
        color("pickerSkin", "Mangopflücker: Haut", SCREENS, "#f1c27d"),
        starting(number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        starting(text("countdownPrefix", "Countdown-Präfix", SCREENS, "", None)),
        starting(text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!", None)),
        starting(choice("progressStyle", "Fortschritt", SCREENS, "korb", &["korb", "ast", "aus"])),
        brb(text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ", None)),
        ending(text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream", None)),
        ending(text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        starting(lines(
            "startingLines",
            "Sprüche Starting",
            SCREENS,
            &[
                "Mangos werden gezählt ...",
                "Leiter wird aufgestellt ...",
                "Körbe werden geflochten ...",
                "Pflückstange wird geschärft ...",
            ],
            None,
        )),
        brb(lines(
            "brbLines",
            "Sprüche BRB",
            SCREENS,
            &["Kurz eine Reihe abernten ...", "Mangosaft wird gepresst ...", "Kisten werden gestapelt ..."],
            None,
        )),
        ending(lines(
            "endingLines",
            "Sprüche Ending",
            SCREENS,
            &["Die Körbe sind voll ...", "Die Sonne geht über der Plantage unter ...", "Bis zur nächsten Ernte!"],
            None,
        )),
        number("linesEvery", "Sprüche wechseln alle", SCREENS, 6.0, 2.0, 120.0, S, None),
        text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(300)),
        choice("tickerStyle", "Ticker", SCREENS, "flugzeug", &["flugzeug", "leiste"]),
        number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30.0, 5.0, 300.0, S, None),
        choice("powerOn", "Einschalten", SCREENS, "sonnenaufgang", &["sonnenaufgang", "blenden", "keins"]),
        number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1800.0, 0.0, 10000.0, MS, None),
    ]
}

fn alerts() -> Vec<SettingField> {
    let mut fields = vec![
        choice("alertStyle", "Stil", ALERTS, "kiste", &["kiste", "zettel", "korb"]),
        text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} hilft bei der Ernte!", None),
        choice("followIcon", "Follow: Symbol", ALERTS, "blatt", &ICONS),
        text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} kommt in die Kiste!", None),
        choice("subIcon", "Sub: Symbol", ALERTS, "kiste", &ICONS),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} pflückt seit {amount} Monaten mit!", None),
        choice("resubIcon", "Resub: Symbol", ALERTS, "baum", &ICONS),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!", None),
        choice("giftIcon", "Gift: Symbol", ALERTS, "korb", &ICONS),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} kommt mit {amount} Erntehelfern!", None),
        choice("raidIcon", "Raid: Symbol", ALERTS, "leiter", &ICONS),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits in den Korb!", None),
        choice("cheerIcon", "Bits: Symbol", ALERTS, "stern", &ICONS),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "mango", &ICONS),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train fährt zur Ernte!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
        choice("hypeIcon", "Hype Train: Symbol", ALERTS, "sonne", &ICONS),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        number("alertScale", "Grösse", ALERTS, 1.0, 0.3, 2.0, None, Some(0.05)),
        number("alertTop", "Abstand oben", ALERTS, 80.0, 0.0, 1000.0, PX, None),
        choice("alertAlign", "Position", ALERTS, "center", &["left", "center", "right"]),
        number("alertWidth", "Breite", ALERTS, 760.0, 300.0, 1800.0, PX, None),
        choice("alertIn", "Einblenden", ALERTS, "fallen", &MOTIONS),
        choice("alertOut", "Ausblenden", ALERTS, "fallen", &MOTIONS),
        flag("alertTimer", "Restzeit als Ast", ALERTS, true),
        flag("leafConfetti", "Blätter-Konfetti", ALERTS, true),
        number("leafCount", "Anzahl Blätter", ALERTS, 14.0, 0.0, 40.0, None, None),
        flag("juice", "Saftspritzer", ALERTS, true),
        flag("alertSound", "Töne", ALERTS, true),
    ];
    fields.extend(alert_sound_fields(ALERTS));
    fields
}

fn chat_cam_music_fx() -> Vec<SettingField> {
    let mut fields = vec![choice("chatStyle", "Stil", CHAT, "zettel", &["zettel", "brett", "blatt"])];
    fields.extend(badge_fields(CHAT));
    fields.extend([
        flag("chatBadges", "Badges zeigen", CHAT, true),
        number("chatFontSize", "Schriftgrösse", CHAT, 20.0, 8.0, 60.0, PX, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatMax", "Max. Nachrichten", CHAT, 12.0, 1.0, 100.0, None, None),
        choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", &["bottom", "top"]),
        number("chatOpacity", "Deckkraft", CHAT, 0.94, 0.0, 1.0, None, Some(0.01)),
        number("chatGap", "Abstand", CHAT, 10.0, 0.0, 40.0, PX, None),
        flag("chatSway", "Sanft schaukeln", CHAT, true),
        choice("camStyle", "Rahmen", CAM, "kiste", &["kiste", "holz", "seil"]),
        number("camFrameWidth", "Rahmenbreite", CAM, 18.0, 2.0, 60.0, PX, None),
        number("camRadius", "Eckenradius", CAM, 16.0, 0.0, 80.0, PX, None),
        number("camLeaves", "Mangoblätter in den Ecken", CAM, 3.0, 0.0, 4.0, None, None),
        number("camLeafSize", "Mangoblatt: Grösse", CAM, 150.0, 40.0, 400.0, PX, None),
        flag("camLeafSway", "Blätter wiegen", CAM, true),
        flag("camMango", "Mango in der Ecke", CAM, true),
        text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "LIVE", None),
        choice("musicStyle", "Stil", MUSIC, "radio", &["radio", "kiste", "schlicht"]),
        text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Plantagenradio", None),
        text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause", None),
        text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik", None),
        text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Grillenzirpen", None),
        flag("musicAlbum", "Album zeigen", MUSIC, false),
        flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
        flag("equalizer", "Mango-Equalizer", MUSIC, true),
        number("equalizerBars", "Equalizer: Balken", MUSIC, 7.0, 1.0, 16.0, None, None),
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
        flag("fxBubble", "Text auf einem Erntezettel", FX, true),
    ]);
    fields
}

fn stinger_banner() -> Vec<SettingField> {
    vec![
        number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5.0, S, Some(0.05)),
        text("stingerText", "Text ({channel})", STINGER, "{channel}", None),
        flag("stingerLeaves", "Blätter fliegen mit", STINGER, true),
        text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", None),
        text("bannerProfileText", "Profilbanner: Text", BANNER, "Mangos, Ernte und gute Streams", None),
        text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Gerade auf der Plantage", None),
        text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Folge dem Kanal und verpasse keine Ernte.", None),
        lines(
            "bannerOfflineLines",
            "Offline-Banner: Zeilen",
            BANNER,
            &["Bald wieder live", "Die Mangos reifen noch"],
            None,
        ),
    ]
}

fn minimes() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend([
        number("mangoSize", "Grösse", MINIME_LOOK, 84.0, 30.0, 300.0, PX, None),
        number("mangoGround", "Abstand zum unteren Rand", MINIME_LOOK, 20.0, 0.0, 300.0, PX, None),
        number("mangoShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0.0, 1.0, None, Some(0.05)),
        flag("mangoFaces", "Gesichter", MINIME_LOOK, true),
        color("mangoEye", "Augen", MINIME_LOOK, "#2b1b17"),
        color("mangoCheek", "Bäckchen", MINIME_LOOK, "#ff7a9a"),
        color("mangoMouth", "Mund", MINIME_LOOK, "#6b2a1f"),
        color("mangoOutline", "Umriss", MINIME_LOOK, "#5a3a22"),
        number("mangoOutlineWidth", "Umriss: Stärke", MINIME_LOOK, 2.5, 0.0, 8.0, None, Some(0.5)),
        color("helmet", "Helm", MINIME_LOOK, "#5b6b3a"),
        color("weapon", "Waffen", MINIME_LOOK, "#3a3a42"),
        color("weaponMark", "Zielfernrohr und Streifen", MINIME_LOOK, "#9fb3c8"),
        color("medicCross", "Medic: Kreuz", MINIME_LOOK, "#e53935"),
        color("muzzle", "Mündungsfeuer", MINIME_LOOK, "#ffd23f"),
        choice("mangoDefault", "Rolle ohne Wahl (alle aus)", MINIME_LOOK, "sturm", &ROLES.map(|role| role.0)),
        flag("mangoNames", "Namen zeigen", MINIME_LOOK, true),
        choice("mangoNameStyle", "Namen auf", MINIME_LOOK, "kiste", &["kiste", "band"]),
        number("mangoNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15.0, 8.0, 48.0, PX, None),
        number("mangoBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000.0, 0.0, 30000.0, MS, None),
        choice("mangoEnter", "Erscheinen", MINIME_LOOK, "fallen", &["fallen", "blenden"]),
        choice("mangoExit", "Verschwinden", MINIME_LOOK, "wegspringen", &["wegspringen", "versinken"]),
    ]);
    fields.extend(minime_hop_fields());
    fields.extend([
        number("reloadWeight", "Nachladen: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("reloadMs", "Nachladen: Dauer", MINIME_MOVES, 1400.0, 300.0, 10000.0, MS, None),
        number("helmetWeight", "Helm richten: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("helmetMs", "Helm richten: Dauer", MINIME_MOVES, 1200.0, 300.0, 10000.0, MS, None),
        number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12.0, 0.0, 100.0, None, None),
        number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400.0, 300.0, 10000.0, MS, None),
        number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000.0, 1000.0, 60000.0, MS, None),
        text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", Some(4)),
        number("cheerMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900.0, 200.0, 5000.0, MS, None),
        number("cheerHeight", "Reaktion auf Chat: Sprunghöhe", MINIME_MOVES, 50.0, 0.0, 300.0, PX, None),
    ]);
    fields.extend(info_fields());
    fields.push(choice("timeInfo", "Befehlsseite: Tageszeit auf der Plantage", INFO_GROUP, "mittag", &TIMES));
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
        field(),
        screens(),
        alerts(),
        chat_cam_music_fx(),
        stinger_banner(),
        minimes(),
        minime_variant_fields(&roles()),
        combat(),
    ]
    .concat()
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    let screens = vec![SceneName::Starting, SceneName::Brb, SceneName::Ending];
    [
        (FIELD, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending, SceneName::Info]),
        (SCREENS, screens),
        (ALERTS, vec![SceneName::Alerts]),
        (CHAT, vec![SceneName::Chat]),
        (CAM, vec![SceneName::Cam]),
        (MUSIC, vec![SceneName::Music]),
        (FX, vec![SceneName::Fx]),
        (STINGER, vec![]),
        (BANNER, vec![]),
        (MINIME_COMMANDS, vec![SceneName::Minimes]),
        (MINIME_RULES, vec![SceneName::Minimes]),
        (MINIME_MOTION, vec![SceneName::Minimes]),
        (MINIME_VARIANTS, vec![SceneName::Minimes]),
        (MINIME_LOOK, vec![SceneName::Minimes]),
        (MINIME_HOP, vec![SceneName::Minimes]),
        (MINIME_MOVES, vec![SceneName::Minimes]),
        (MINIME_COMBAT, vec![SceneName::Minimes]),
        (INFO_GROUP, vec![SceneName::Info]),
    ]
    .into_iter()
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
}

fn roles() -> MinimeVariantSet {
    MinimeVariantSet {
        command: "!rolle".to_owned(),
        label: "Rolle".to_owned(),
        variants: ROLES
            .iter()
            .map(|(id, label, names)| MinimeVariantInfo {
                id: (*id).to_owned(),
                label: (*label).to_owned(),
                names: names.iter().map(|name| (*name).to_owned()).collect(),
                color: None,
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
/// (template: `BASIC` in `src/themes/plantage/settings.ts`)
const BASIC: &[&str] = &[
    "channelName",
    "font",
    "titleFont",
    "textColor",
    "accent",
    "accent2",
    "picker",
    "mangosOnTrees",
    "birds",
    "timeStarting",
    "startingEyebrow",
    "startingTitle",
    "ticker",
    "timeBrb",
    "brbTitle",
    "brbNote",
    "timeEnding",
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
    "mangoDefault",
    "mangoNames",
];

#[must_use]
pub fn plantage() -> Theme {
    let schema = ThemeSchema {
        id: "plantage".to_owned(),
        name: "Südfrucht-Plantage".to_owned(),
        fields: mark_basic(fields(), BASIC),
        group_scenes: group_scenes(),
        minime_variants: Some(roles()),
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
        assert_same_as_fixture(&plantage(), include_str!("../../tests/fixtures/plantage.json"));
    }

    #[test]
    fn roles_with_a_medic_and_fights() {
        let set = roles();
        assert_eq!(set.variants.len(), 5);
        assert!(set.variants.iter().any(|role| role.id == MEDIC));
        let schema = plantage().schema;
        assert!(schema.field("minimeCombat").is_some());
        let aim = schema.field(&minime_aim_key("sniper")).map(SettingField::default_value);
        assert_eq!(aim, Some(SettingValue::Number(1600.0)));
        assert!(schema.field(&minime_aim_key(MEDIC)).is_none());
    }
}
