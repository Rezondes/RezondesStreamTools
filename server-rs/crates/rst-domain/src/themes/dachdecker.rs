//! Settings schema of the Dachdecker theme: a roof frame of glowing plan lines on blueprint, drawn, covered and
//! celebrated in terracotta, copper and slate (template: `src/themes/dachdecker/settings.ts`). Labels, groups and
//! defaults are the German UI texts and stay equal to the TypeScript schema (fixture test).

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
    MINIME_COMMANDS, MINIME_HOP, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minime_base_fields, minime_hop_fields,
    minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;
use crate::themes::tuning;

const FONTS: [&str; 4] = ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"];
const PROGRESS: [&str; 2] = ["masskette", "aus"];
const CHAT_STYLES: [&str; 3] = ["zettel", "liste", "schlicht"];
const NAME_COLORS: [&str; 2] = ["kupfer", "chatter"];
const CAM_STYLES: [&str; 3] = ["plan", "ecken", "aus"];
const MUSIC_STYLES: [&str; 3] = ["radio", "schild", "schlicht"];

const GENERAL: &str = "Allgemein";
const FRAME: &str = "Dachstuhl";
const STARTING: &str = "Starting";
const BRB: &str = "BRB";
const ENDING: &str = "Ending";
const ALERTS: &str = "Alerts";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const STINGER: &str = "Stinger";
const PROFILE_BANNER: &str = "Profilbanner";
const OFFLINE_BANNER: &str = "Offline-Banner";
const MINIME_LOOK: &str = "Minimes: Aussehen";
const MINIME_MOVES: &str = "Minimes: Animationen";
const FIGURE_TYPES: [&str; 5] = ["dachdecker", "zimmerer", "spengler", "azubi", "polier"];

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
        color("onAccent", "Schrift auf Terrakotta", GENERAL, "#121e40"),
        color("brick", "Ziegelrot (Flächen und Leuchten)", GENERAL, "#d35400"),
        color("copper", "Kupfer", GENERAL, "#d4a373"),
        color("slate", "Schiefer", GENERAL, "#2c3e50"),
        color("slateDark", "Schiefer dunkel", GENERAL, "#1a252f"),
        color("card", "Karte (Protokoll, Schilder)", GENERAL, "#22356a"),
        color("line", "Plan-Linien und Text", GENERAL, "#ffffff"),
        color("muted", "Gedämpfter Text und Füllung", GENERAL, "#b4c2e0"),
        color("rain", "Regen (Cyan)", GENERAL, "#7fe3ff"),
        color("dusk", "Abendglühen", GENERAL, "#8a3d16"),
        quality_field(GENERAL),
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
        number("countdown", "Countdown: Dauer", STARTING, 300.0, 0.0, 86400.0, S, None),
        text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", Some(5)),
        text("countdownPrefix", "Text vor dem Countdown", STARTING, "", None),
        text("countdownDone", "Text nach dem Countdown", STARTING, "GLEICH GEHT'S LOS", None),
        flag("startingTiles", "Ziegel: Dach bis zum Ende des Countdowns decken", STARTING, true),
        number("startingTileRows", "Ziegelreihen beim Aufbau", STARTING, 4.0, 1.0, 11.0, None, None),
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
        color("houseWall", "Haus: Putz", ENDING, "#e3d5bc"),
        color("houseTimber", "Haus: Fachwerk und Tür", ENDING, "#5b3a24"),
        flag("windowsOn", "Fenster gehen an", ENDING, true),
        number("windowStep", "Fenster: Abstand", ENDING, 350.0, 0.0, 3000.0, MS, None),
        flag("smokeOn", "Rauch aus dem Schornstein", ENDING, true),
        number("smokeAmount", "Rauch: Wolken", ENDING, 14.0, 1.0, 40.0, None, None),
        flag("wreathOn", "Richtkranz", ENDING, true),
        number("wreathPole", "Richtkranz: Höhe des Balkens in Metern", ENDING, 1.6, 0.4, 5.0, None, Some(0.1)),
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
        in_scene(SceneName::Stats, flag("protocolOn", "Abnahmeprotokoll", ENDING, true)),
        in_scene(SceneName::Stats, text("protocolTitle", "Abnahmeprotokoll: Titel", ENDING, "ABNAHMEPROTOKOLL", None)),
        // Keys: follows, subs, giftedSubs, raids, raiders, bits, redeems, hypeLevel, chatMessages, chatters, duration
        in_scene(
            SceneName::Stats,
            lines(
                "protocolLines",
                "Abnahmeprotokoll: Zeilen (Schlüssel|Text)",
                ENDING,
                &["follows|Neue Dachdecker", "subs|Abos", "raids|Raids", "bits|Bits", "chatMessages|Gelegte Ziegel"],
                Some(12),
            ),
        ),
        in_scene(SceneName::Stats, number("countUpMs", "Hochzählen: Dauer", ENDING, 1000.0, 0.0, 5000.0, MS, None)),
        in_scene(SceneName::Stats, flag("stampOn", "Stempel", ENDING, true)),
        in_scene(SceneName::Stats, text("stampText", "Stempel: Text", ENDING, "ABGENOMMEN", Some(40))),
        in_scene(SceneName::Stats, number("stampAt", "Stempel schlägt auf nach", ENDING, 6.0, 1.0, 60.0, S, Some(0.5))),
        in_scene(SceneName::Stats, flag("stampSound", "Stempel: Ton", ENDING, true)),
    ]
}

fn alerts() -> Vec<SettingField> {
    vec![
        text("followTag", "Follow: Kopfzeile", ALERTS, "NEUER FOLLOWER", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} deckt jetzt das Dach mit!", None),
        text("followDim", "Follow: Masslinie", ALERTS, "+1 DACHDECKER", None),
        text("subTag", "Sub: Kopfzeile", ALERTS, "NEUES ABO", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} geht bei uns in die Lehre!", None),
        text("subDim", "Sub: Masslinie", ALERTS, "+1 AZUBI", None),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "ABO x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} deckt seit {amount} Monaten mit!", None),
        text("resubDim", "Resub: Masslinie", ALERTS, "{amount} MONATE", None),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "ABOS VERSCHENKT", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} stellt {amount} Azubis ein!", None),
        text("giftDim", "Gift: Masslinie", ALERTS, "+{amount} AZUBIS", None),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} rückt mit einer Kolonne von {amount} Leuten an!", None),
        text("raidDim", "Raid: Masslinie", ALERTS, "+{amount} KOLONNE", None),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} legt {amount} Ziegel aufs Dach!", None),
        text("cheerDim", "Bits: Masslinie", ALERTS, "+{amount} ZIEGEL", None),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "KANALPUNKTE", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        text("redeemDim", "Kanalpunkte: Masslinie", ALERTS, "EINGELÖST", None),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Richtfest! Der Kran fährt hoch!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Richtfest Level {amount} geschafft!", None),
        text("hypeDim", "Hype Train: Masslinie", ALERTS, "RICHTFEST", None),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        number("alertWidth", "Breite", ALERTS, 720.0, 300.0, 1800.0, PX, None),
        flag("alertDim", "Masslinie mit Text", ALERTS, true),
        flag("alertCorners", "Eckmarken", ALERTS, true),
        flag("alertTimer", "Restzeit als Masskette", ALERTS, true),
        number("alertOpenMs", "Öffnen: Dauer", ALERTS, 550.0, 0.0, 3000.0, MS, None),
        number("alertCloseMs", "Schliessen: Dauer", ALERTS, 400.0, 0.0, 3000.0, MS, None),
        flag("alertSound", "Töne", ALERTS, true),
    ]
}

fn chat() -> Vec<SettingField> {
    vec![
        choice("chatStyle", "Stil", CHAT, "zettel", &CHAT_STYLES),
        number("chatMax", "Max. Nachrichten", CHAT, 6.0, 1.0, 50.0, None, None),
        number("chatLifetime", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatWidth", "Breite", CHAT, 520.0, 200.0, 1600.0, PX, None),
        choice("chatNameColor", "Farbe der Namen", CHAT, "kupfer", &NAME_COLORS),
        flag("chatDim", "Masslinie unter dem Namen", CHAT, true),
        flag("chatBadges", "Badges zeigen", CHAT, true),
    ]
}

fn cam_music_fx() -> Vec<SettingField> {
    vec![
        number("chatOpenMs", "Öffnen: Dauer", CHAT, 350.0, 0.0, 3000.0, MS, None),
        choice("camStyle", "Rahmen", CAM, "plan", &CAM_STYLES),
        text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
        text("camDims", "Masskette: Text", CAM, "1920 x 1080", None),
        flag("camDimsOn", "Massketten an den Kanten", CAM, true),
        flag("camCorners", "Eckmarken", CAM, true),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "LIVE", None),
        choice("musicStyle", "Stil", MUSIC, "radio", &MUSIC_STYLES),
        text("musicLabel", "Überzeile", MUSIC, "BAUSTELLENRADIO", None),
        text("musicIdle", "Text ohne Wiedergabe", MUSIC, "FUNKSTILLE", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicCover", "Cover zeigen", MUSIC, true),
        flag("musicEq", "Equalizer", MUSIC, true),
        flag("musicProgress", "Fortschritt als Masskette", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        color("radioBody", "Radio: Gehäuse", MUSIC, "#2c3e50"),
        color("radioBumper", "Radio: Puffer und Bügel", MUSIC, "#e67e22"),
        color("radioDisplay", "Radio: Display", MUSIC, "#7fe3ff"),
        number("radioScale", "Radio: Grösse (Faktor)", MUSIC, 1.0, 0.4, 3.0, None, Some(0.05)),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, PERCENT, None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
        flag("fxText", "Text zeigen", FX, true),
        number("fxTextSize", "Textgrösse", FX, 96.0, 8.0, 300.0, PX, None),
    ]
}

fn stinger_banner() -> Vec<SettingField> {
    vec![
        text("stingerText", "Bauplan: Titel ({channel})", STINGER, "{channel}", None),
        text("stingerSubtitle", "Bauplan: Unterzeile ({channel})", STINGER, "AUSFÜHRUNGSPLAN // DACHSTUHL", None),
        lines(
            "stingerBlockLines",
            "Bauplan: Schriftfeld (| trennt Bezeichnung und Wert, {channel})",
            STINGER,
            &["BAUHERR | {channel}", "PROJEKT | DACHSTUHL", "MASSSTAB | 1:50", "BLATT | 1/1"],
            Some(6),
        ),
        lines(
            "stingerNotes",
            "Bauplan: Hinweise",
            STINGER,
            &["ALLE MASSE IN METERN", "EINDECKUNG: TERRAKOTTA UND SCHIEFER", "FIRST MIT LÜFTUNG"],
            Some(6),
        ),
        text("stingerStamp", "Bauplan: Stempel (leer = aus)", STINGER, "GEPRÜFT", None),
        number("stingerDuration", "Länge", STINGER, 2.4, 0.5, 6.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 1.2, 0.1, 6.0, S, Some(0.05)),
        number("stingerGrid", "Bauplan: Rastergrösse", STINGER, 40.0, 10.0, 200.0, PX, None),
        number("stingerRollSize", "Rolle: Durchmesser", STINGER, 180.0, 40.0, 600.0, PX, None),
        text("profileTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}", None),
        text("profileOverline", "Masslinie ({channel})", PROFILE_BANNER, "BAUPLAN // RICHTFEST", None),
        text("profileTag", "Überzeile ({channel})", PROFILE_BANNER, "DACHDECKEREI", None),
        text("profileSubtitle", "Unterzeile ({channel})", PROFILE_BANNER, "Live vom Dach!", None),
        text("offlineText", "Titel ({channel})", OFFLINE_BANNER, "OFFLINE", None),
        text("offlineOverline", "Masslinie ({channel})", OFFLINE_BANNER, "{channel}", None),
        text("offlineTag", "Überzeile ({channel})", OFFLINE_BANNER, "FEIERABEND", None),
        text("offlineSubtitle", "Unterzeile ({channel})", OFFLINE_BANNER, "Dach dicht, bis zum nächsten Stream!", None),
        number("bannerGrid", "Bauplan: Rastergrösse", PROFILE_BANNER, 50.0, 10.0, 200.0, PX, None),
        number("bannerOfflineGrid", "Bauplan: Rastergrösse", OFFLINE_BANNER, 50.0, 10.0, 200.0, PX, None),
        flag("bannerRain", "Regen", OFFLINE_BANNER, true),
        number("bannerRainCount", "Tropfen", OFFLINE_BANNER, 1200.0, 0.0, 4000.0, None, None),
    ]
}

/// The five figure types as minime variants (template: `FIGURE_SET` in `src/themes/dachdecker/figures.ts`)
fn variants() -> MinimeVariantSet {
    let variant = |id: &str, label: &str, names: &[&str]| MinimeVariantInfo {
        id: id.to_owned(),
        label: label.to_owned(),
        names: names.iter().map(|name| (*name).to_owned()).collect(),
        color: None,
    };
    MinimeVariantSet {
        command: "!typ".to_owned(),
        label: "Typ".to_owned(),
        variants: vec![
            variant("dachdecker", "Dachdecker", &["dachdecker", "decker"]),
            variant("zimmerer", "Zimmerer", &["zimmerer", "zimmermann"]),
            variant("spengler", "Spengler", &["spengler", "klempner"]),
            variant("azubi", "Azubi", &["azubi", "lehrling"]),
            variant("polier", "Polier", &["polier", "chef"]),
        ],
    }
}

fn minimes() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend(minime_hop_fields());
    fields.extend(vec![
        number("minimeSize", "Grösse (Höhe)", MINIME_LOOK, 110.0, 40.0, 400.0, PX, None),
        number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 10.0, 0.0, 300.0, PX, None),
        choice("minimeDefault", "Typ ohne Wahl (alle aus)", MINIME_LOOK, "dachdecker", &FIGURE_TYPES),
        color("minimeSkin", "Haut", MINIME_LOOK, "#e8b98f"),
        color("minimeShirt", "Hemd", MINIME_LOOK, "#e9edf5"),
        color("minimePants", "Arbeitshose", MINIME_LOOK, "#3b4a66"),
        color("minimeBoots", "Stiefel und Gürtel", MINIME_LOOK, "#5a3a22"),
        flag("minimeRidge", "Boden zeigen (Firststreifen)", MINIME_LOOK, true),
        number("minimeRidgeHeight", "Boden: Höhe", MINIME_LOOK, 34.0, 4.0, 200.0, PX, None),
        flag("minimeLabels", "Namensschilder", MINIME_LOOK, true),
        number("minimeLabelSize", "Namensschild: Schriftgrösse", MINIME_LOOK, 16.0, 8.0, 48.0, PX, None),
        color("helmetDachdecker", "Helm: Dachdecker", MINIME_LOOK, "#e67e22"),
        color("helmetZimmerer", "Helm: Zimmerer", MINIME_LOOK, "#d4a373"),
        color("helmetSpengler", "Helm: Spengler", MINIME_LOOK, "#ffffff"),
        color("helmetAzubi", "Helm: Azubi", MINIME_LOOK, "#7fe3ff"),
        color("helmetPolier", "Helm: Polier", MINIME_LOOK, "#d35400"),
        number("minimeHammerWeight", "Hämmern: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
        number("minimeHammerMs", "Hämmern: Dauer", MINIME_MOVES, 2400.0, 300.0, 10_000.0, MS, None),
        number("minimeMeasureWeight", "Messen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeMeasureMs", "Messen: Dauer", MINIME_MOVES, 3000.0, 300.0, 10_000.0, MS, None),
        number("minimeCarryWeight", "Tragen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeCarryMs", "Tragen: Dauer", MINIME_MOVES, 3500.0, 300.0, 10_000.0, MS, None),
        flag("minimeStumble", "Tragen: Azubi stolpert", MINIME_MOVES, true),
        number("minimePlanWeight", "Plan zeigen: Häufigkeit", MINIME_MOVES, 3.0, 0.0, 100.0, None, None),
        number("minimePlanMs", "Plan zeigen: Dauer", MINIME_MOVES, 3000.0, 300.0, 10_000.0, MS, None),
        number("minimeWaveWeight", "Winken: Häufigkeit", MINIME_MOVES, 3.0, 0.0, 100.0, None, None),
        number("minimeWaveMs", "Winken: Dauer", MINIME_MOVES, 1800.0, 300.0, 10_000.0, MS, None),
        number("minimeSnackWeight", "Brotzeit: Häufigkeit", MINIME_MOVES, 2.0, 0.0, 100.0, None, None),
        number("minimeSnackMs", "Brotzeit: Dauer", MINIME_MOVES, 6000.0, 300.0, 60_000.0, MS, None),
        number("minimeTipMs", "Reaktion auf Chat (Helm lupfen): Dauer", MINIME_MOVES, 900.0, 200.0, 5000.0, MS, None),
    ]);
    fields
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Alerts, Brb, Cam, Chat, Ending, Fx, Info, Minimes, Music, Starting};
    [
        (FRAME, vec![Starting, Brb, Ending]),
        (STARTING, vec![Starting]),
        (BRB, vec![Brb]),
        (ENDING, vec![Ending]),
        (ALERTS, vec![Alerts]),
        (CHAT, vec![Chat]),
        (CAM, vec![Cam]),
        (MUSIC, vec![Music]),
        (FX, vec![Fx]),
        (STINGER, vec![]),
        (PROFILE_BANNER, vec![]),
        (OFFLINE_BANNER, vec![]),
        (MINIME_COMMANDS, vec![Minimes]),
        (MINIME_RULES, vec![Minimes]),
        (MINIME_MOTION, vec![Minimes]),
        (MINIME_HOP, vec![Minimes]),
        (MINIME_VARIANTS, vec![Minimes]),
        (MINIME_LOOK, vec![Minimes]),
        (MINIME_MOVES, vec![Minimes]),
        (INFO_GROUP, vec![Info]),
    ]
    .into_iter()
    .chain(tuning::dachdecker::group_scenes())
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
    "followLine",
    "subLine",
    "raidLine",
    "cheerLine",
    "alertDim",
    "chatStyle",
    "chatBadges",
    "camStyle",
    "camLabel",
    "camLive",
    "musicStyle",
    "musicLabel",
    "musicIdle",
    "fxText",
    "minimeDefault",
    "minimeLabels",
];

#[must_use]
pub fn dachdecker() -> Theme {
    let mut fields = [
        general(),
        frame(),
        starting(),
        brb(),
        ending(),
        alerts(),
        alert_sound_fields(ALERTS),
        chat(),
        badge_fields(CHAT),
        cam_music_fx(),
        stinger_banner(),
        minimes(),
        info_fields(),
    ]
    .concat();
    fields.push(number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900.0, 400.0, 1600.0, PX, None));
    fields.extend(minime_variant_fields(&variants()));
    fields.extend(tuning::dachdecker::fields());
    let schema = ThemeSchema {
        id: "dachdecker".to_owned(),
        name: "Dachdecker".to_owned(),
        fields: mark_basic(with_stinger_fields(fields, STINGER, 30.0, 20.0), BASIC),
        group_scenes: group_scenes(),
        minime_variants: Some(variants()),
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
