//! Settings schema of the built-in theme "matrix": every visible and audible value is a setting, the defaults give
//! the original look (template: `src/themes/matrix/settings.ts`). Labels, groups and defaults are the German UI texts
//! and stay equal to the TypeScript schema (fixture test). The field list was ported once from the fixture.

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, ascii_art, choice, color, flag, font, in_scene, lines, mark_basic,
    number, text,
};
use crate::themes::ascii_text::ascii_text;
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::graphics_fields::quality_field;
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, minime_fields};
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;
use crate::themes::tuning;

/// Character set of rain, decoding and stinger (`GLYPHS` in `src/core/glyphs.ts`)
const GLYPHS: &str = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

const GENERAL: &str = "Allgemein";
const RAIN: &str = "Matrix-Regen";
const SCREENS: &str = "Starting, BRB, Ending";
const STATS: &str = "Statistik";
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

fn fields() -> Vec<SettingField> {
    [
    vec![
        color("accent", "Hauptfarbe", GENERAL, "#39ff14"),
        color("dim", "Gedämpfte Farbe", GENERAL, "#1e9e0f"),
        color("line", "Linienfarbe", GENERAL, "#0e4d07"),
        color("background", "Hintergrund", GENERAL, "#000000"),
        color("glow", "Glühfarbe", GENERAL, "#39ff14"),
        color("highlight", "Glitch-Farbe", GENERAL, "#b6ff9e"),
        color("flash", "Blitzfarbe", GENERAL, "#d8ffcc"),
        font("font", "Schrift", GENERAL, "Share Tech Mono", &["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]),
        number("fontSize", "Grundgrösse der Schrift", GENERAL, 16.0, 8.0, 48.0, PX, None),
        text("channelName", "Kanal-Name", GENERAL, "STREAM", Some(40)),
        ascii_art("logo", "ASCII-Logo", GENERAL, &ascii_text("STREAM"), None),
        number("glowStrength", "Glühen (Stärke)", GENERAL, 1.0, 0.0, 3.0, None, Some(0.1)),
        flag("scanlines", "Scanlines", GENERAL, true),
        number("scanlineStrength", "Scanlines (Stärke)", GENERAL, 0.28, 0.0, 1.0, None, Some(0.01)),
        number("glitchStrength", "Glitch (Stärke)", GENERAL, 1.0, 0.0, 4.0, PX, Some(0.1)),
        number("glitchInDuration", "Glitch rein (Dauer)", GENERAL, 500.0, 0.0, 3000.0, MS, None),
        number("glitchOutDuration", "Glitch raus (Dauer)", GENERAL, 450.0, 0.0, 3000.0, MS, None),
        number("glitchCycle", "Namens-Glitch alle", GENERAL, 3.0, 1.0, 30.0, S, None),
        number("decodeSpeed", "Entschlüsseln (Tempo)", GENERAL, 1.0, 0.1, 5.0, None, Some(0.1)),
        text("cursor", "Cursor-Zeichen", GENERAL, "█", Some(4)),
        choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", &["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"]),
        text("glyphs", "Zeichensatz (Regen, Entschlüsseln, Stinger)", RAIN, GLYPHS, Some(400)),
        flag("rainScreens", "Regen in Starting/BRB/Ending", RAIN, true),
        flag("rainAlerts", "Regen in Alerts", RAIN, true),
        quality_field(RAIN),
        number("rainSeed", "Startwert (anderes Muster)", RAIN, 1.0, 1.0, 9999.0, None, None),
        number("rainLayers", "Tiefenebenen", RAIN, 3.0, 1.0, 3.0, None, None),
        number("rainSizeFar", "Zeichengrösse fern", RAIN, 15.0, 6.0, 80.0, PX, None),
        number("rainSizeMid", "Zeichengrösse mittel", RAIN, 24.0, 6.0, 80.0, PX, None),
        number("rainSizeNear", "Zeichengrösse nah", RAIN, 36.0, 6.0, 80.0, PX, None),
        number("rainBlurFar", "Unschärfe fern", RAIN, 1.5, 0.0, 6.0, None, Some(0.1)),
        number("headGlow", "Leuchten der Köpfe", RAIN, 10.0, 0.0, 30.0, None, None),
        number("glyphChange", "Zeichenwechsel in der Spur (je s)", RAIN, 3.0, 0.0, 30.0, None, None),
        number("glyphChangeTip", "Zeichenwechsel an der Spitze (je s)", RAIN, 14.0, 0.0, 60.0, None, None),
        number("rainDensity", "Dichte", RAIN, 100.0, 0.0, 100.0, Some(Unit::Percent), None),
        number("rainSpeed", "Geschwindigkeit", RAIN, 1.0, 0.1, 5.0, None, Some(0.1)),
        number("rainOpacityScreens", "Deckkraft (Szenen)", RAIN, 0.8, 0.0, 1.0, None, Some(0.01)),
        number("rainOpacityAlerts", "Deckkraft (Alerts)", RAIN, 0.16, 0.0, 1.0, None, Some(0.01)),
        in_scene(SceneName::Starting, text("startingTitle", "Titel Starting", SCREENS, "STREAM STARTET GLEICH", None)),
        in_scene(SceneName::Brb, text("brbTitle", "Titel BRB", SCREENS, "BIN GLEICH ZURÜCK", None)),
        in_scene(SceneName::Ending, text("endingTitle", "Titel Ending", SCREENS, "STREAM BEENDET", None)),
        text("sceneHeader", "Kopfzeile ({channel}, {scene})", SCREENS, "{channel}://stream/{scene}", None),
        text("liveText", "Live-Anzeige", SCREENS, "● LIVE-FEED", None),
        flag("screenLogo", "Logo zeigen", SCREENS, true),
        in_scene(SceneName::Starting, number("countdown", "Countdown: Dauer", SCREENS, 300.0, 0.0, 86_400.0, S, None)),
        in_scene(SceneName::Starting, text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", SCREENS, "", Some(5))),
        in_scene(SceneName::Starting, text("countdownPrefix", "Countdown-Präfix", SCREENS, "T-", None)),
        in_scene(SceneName::Starting, text("countdownDone", "Text nach dem Countdown", SCREENS, "INITIALISIERE ...", None)),
        in_scene(SceneName::Starting, flag("progressBar", "Fortschrittsbalken", SCREENS, true)),
        in_scene(SceneName::Starting, number("progressWidth", "Fortschrittsbalken (Zeichen)", SCREENS, 40.0, 5.0, 100.0, None, None)),
        in_scene(SceneName::Starting, text("barFull", "Balken voll", SCREENS, "█", Some(4))),
        in_scene(SceneName::Starting, text("barEmpty", "Balken leer", SCREENS, "░", Some(4))),
        in_scene(SceneName::Brb, text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "AFK ", None)),
        in_scene(SceneName::Brb, text("brbNote", "Untertitel BRB", SCREENS, "Chat bleibt offen, schreibt ruhig weiter.", None)),
        in_scene(SceneName::Brb, number("brbRainSpeed", "BRB: Tempo des Regens", SCREENS, 0.35, 0.05, 1.0, None, Some(0.05))),
        in_scene(SceneName::Brb, number("brbRetryEvery", "BRB: Verbindungsversuch alle", SCREENS, 6.0, 1.0, 120.0, S, None)),
        in_scene(SceneName::Brb, text("brbRetryText", "BRB: Verbindungsversuch", SCREENS, "> reconnecting ...", None)),
        in_scene(SceneName::Ending, text("endingThanks", "Untertitel Ending", SCREENS, "DANKE FÜRS ZUSCHAUEN", None)),
        in_scene(SceneName::Ending, text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream: ", None)),
        in_scene(SceneName::Ending, text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "", None)),
        lines("logoutLines", "Zahlen (Schlüssel|Text)", STATS, &["follows|new users", "subs|subscriptions", "raids|incoming raids", "bits|bits", "chatMessages|messages"], None),
        number("countUpMs", "Hochzählen (Dauer)", STATS, 1000.0, 0.0, 10_000.0, MS, None),
        in_scene(SceneName::Ending, number("crtOffAt", "Ending: CRT aus nach (0 = nie)", SCREENS, 8.0, 0.0, 600.0, S, None)),
        flag("terminal", "Terminal", SCREENS, true),
        text("prompt", "Prompt ({login}, {channel})", SCREENS, "root@{login}:~$", None),
        in_scene(SceneName::Starting, lines("startingLines", "Terminal Starting ({del 3}, {pause 900}, {smash 10})", SCREENS, &["boot sequence initiated", "coffee.exe not found ... falling back to energy_drink.exe", "cracking open a cold one ... *psst*", "loading neural_net.dll ... ok", "compiling overlays ... succeeded (0 warnings, 47 suppressed)", "connecting to twitch.tv:443 ... ok", "sudo systemclt{del 2}tl strat{del 3}art stream{pause 900} --now{pause 600} --pls", "npm install motivation ... 1,284 vulnerabilities found", "calibrating webcam ... ok", "git blame overlay.tsx ... it was me", "estimating start time ... 5 min (programmer minutes)", "rubber duck debugging ... duck refuses to comment", "warming up keyboard ... ok", "git comit{del 4}ommit -m \"fxi{del 3}fix\"{pause 800}{del 4}final fix v2\"{pause 500} && git psuh{del 4}push", "fixing 1 bug ... 2 new bugs found", "scanning chat for the one ... searching", "it works on my machine ... shipping my machine to chat", "git pull origin main ... already up to date"], None)),
        in_scene(SceneName::Brb, lines("brbLines", "Terminal BRB", SCREENS, &["process suspended (pid 1337)", "user status: afk", "refilling drink ... cup 3 of ?", "ping streamer ... request timed out", "retrying in 5s ...", "sleep 300 # TODO: remove before stream", "echo \"bin gelich{del 5}lecih{del 3}ich zrü{del 3}{pause 600}zurkc{del 3}{pause 900}{smash 18}", "keeping chat warm ... ok", "rubber duck is now in charge of the stream", "garbage collector running ... streamer not collected", "streamer.exe is not responding ... [wait] [close]", "do not unplug the matrix", "while (afk) { chat.entertain(); }", "awaiting operator input"], None)),
        in_scene(SceneName::Ending, lines("endingLines", "Terminal Ending", SCREENS, &["saving session ... ok", "flushing chat buffer ... ok", "writing highlights to /dev/memory ... ok", "git commit -m \"stream done\" ... ok", "shutting down streamer ... streamer refuses", "thanks for watching", "closing 47 browser tabs ... 46 remaining", "shutdwon{del 4}down -h nwo{del 3}now{pause 900} --really{pause 700}{smash 10}", "stopping services ...", "connection closed by remote host", "see you in the matrix"], None)),
        number("typingSpeed", "Tipp-Tempo", SCREENS, 1.0, 0.2, 5.0, None, Some(0.1)),
        number("terminalStartDelay", "Terminal startet nach", SCREENS, 2600.0, 0.0, 30_000.0, MS, None),
        number("terminalPauseMin", "Pause zwischen Zeilen (min)", SCREENS, 1800.0, 0.0, 60_000.0, MS, None),
        number("terminalPauseMax", "Pause zwischen Zeilen (max)", SCREENS, 3200.0, 0.0, 60_000.0, MS, None),
        number("terminalVisible", "Sichtbare Zeilen", SCREENS, 5.0, 1.0, 20.0, None, None),
        text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(500)),
        text("tickerSeparator", "Ticker-Trenner", SCREENS, "   //   ", None),
        number("tickerSpeed", "Ticker-Durchlauf", SCREENS, 60.0, 5.0, 600.0, S, None),
        choice("powerOn", "Einschalt-Animation", SCREENS, "crt", &["crt", "zoom", "fade", "none"]),
        number("crtOnMs", "CRT einschalten (Dauer)", SCREENS, 600.0, 100.0, 5000.0, MS, None),
        flag("glitchOn", "Glitch im Bild", SCREENS, true),
        number("glitchEvery", "Glitch alle", SCREENS, 4.2, 1.0, 60.0, S, Some(0.1)),
        number("powerOnDuration", "Einschalt-Animation (Dauer)", SCREENS, 1600.0, 0.0, 10_000.0, MS, None),
        number("frameWidth", "Rahmen-Breite", SCREENS, 1400.0, 400.0, 1920.0, PX, None),
        number("frameHeight", "Rahmen-Höhe", SCREENS, 820.0, 300.0, 1080.0, PX, None),
        text("alertHeader", "Kopfzeile ({tag})", ALERTS, "> INCOMING TRANSMISSION // {tag}", None),
        text("tierSuffix", "Abo-Stufe an der Kopfzeile ({detail})", ALERTS, " // {detail}", None),
        text("followTag", "Follow: Kopfzeile", ALERTS, "FOLLOW", None),
        text("followLine", "Follow: Zeile", ALERTS, "ist jetzt in der Matrix.", None),
        text("subTag", "Sub: Kopfzeile", ALERTS, "SUB", None),
        text("subLine", "Sub: Zeile", ALERTS, "hat die rote Pille genommen.", None),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "RESUB x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "ist seit {amount} Monaten dabei.", None),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "GIFT x{amount}", None),
        text("giftLine", "Gift: Zeile (mehrere)", ALERTS, "verschenkt {amount} Subs an den Chat.", None),
        text("giftOneLine", "Gift: Zeile (einer)", ALERTS, "verschenkt einen Sub.", None),
        text("giftToLine", "Gift: Zeile (an jemanden, {text})", ALERTS, "verschenkt einen Sub an {text}.", None),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID", None),
        text("raidLine", "Raid: Zeile", ALERTS, "raidet mit {amount} Zuschauern!", None),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "cheert {amount} Bits.", None),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "{amount} KANALPUNKTE", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "löst \"{detail}\" ein.", None),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN", None),
        text("hypeTitle", "Hype Train: Name", ALERTS, "HYPE TRAIN", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "ist abgefahren! Alle einsteigen.", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "ist auf Level {amount} angekommen. Danke!", None),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60_000.0, MS, None),
        number("alertScale", "Grösse", ALERTS, 0.7, 0.2, 2.0, None, Some(0.05)),
        number("alertWidth", "Breite", ALERTS, 900.0, 300.0, 1900.0, PX, None),
        choice("alertIn", "Einblenden", ALERTS, "glitch", &["glitch", "fade", "none"]),
        choice("alertOut", "Ausblenden", ALERTS, "glitch", &["glitch", "fade", "none"]),
        flag("alertTimer", "Restzeit-Balken", ALERTS, true),
        flag("alertCurtainOn", "Regenvorhang beim Einschalten", ALERTS, true),
        number("alertCurtainSize", "Regenvorhang: Zeichengrösse", ALERTS, 22.0, 8.0, 60.0, PX, None),
        number("alertCurtainSpeed", "Regenvorhang: Tempo", ALERTS, 1.0, 0.2, 4.0, None, Some(0.1)),
        number("alertCrtOnMs", "Box einschalten (Dauer)", ALERTS, 430.0, 100.0, 3000.0, MS, None),
        flag("alertDissolveOn", "Zerfällt in Zeichen", ALERTS, true),
        number("alertDissolveMs", "Zerfall (Dauer)", ALERTS, 1000.0, 200.0, 1000.0, MS, None),
        flag("alertGlitchOn", "Glitch in der Mitte", ALERTS, true),
        flag("alertSound", "Töne", ALERTS, true),
    ],
    alert_sound_fields(ALERTS),
    vec![
        text("chatPrompt", "Prompt hinter dem Namen", CHAT, "@twitch:~$", None),
    ],
    badge_fields(CHAT),
    vec![
        number("chatFontSize", "Schriftgrösse", CHAT, 22.0, 8.0, 80.0, PX, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatMax", "Max. Nachrichten", CHAT, 30.0, 1.0, 200.0, None, None),
        choice("chatAlign", "Ausrichtung", CHAT, "bottom", &["bottom", "top"]),
        number("chatOpacity", "Hintergrund-Deckkraft", CHAT, 0.75, 0.0, 1.0, None, Some(0.01)),
        number("emoteSize", "Emote-Grösse", CHAT, 33.0, 8.0, 200.0, PX, None),
        choice("chatIn", "Einblenden", CHAT, "glitch", &["glitch", "fade", "none"]),
        choice("chatOut", "Ausblenden", CHAT, "glitch", &["glitch", "fade", "none"]),
        text("camLabel", "Label ({channel})", CAM, "CAM_01 // {channel}", None),
        flag("camRec", "REC-Anzeige", CAM, true),
        text("camRecDot", "REC-Punkt", CAM, "●", Some(4)),
        text("camRecText", "REC-Text", CAM, "REC", None),
        flag("camClock", "Uhr", CAM, true),
        number("cornerLength", "Eckenlänge", CAM, 36.0, 0.0, 400.0, PX, None),
        number("cornerWidth", "Eckendicke", CAM, 4.0, 0.0, 40.0, PX, None),
        number("camOnMs", "Rahmen einschalten (Dauer, 0 = sofort)", CAM, 700.0, 0.0, 3000.0, MS, None),
        flag("camRain", "Feiner Regen an den Kanten", CAM, true),
        number("camRainWidth", "Regen: Breite der Kanten", CAM, 48.0, 8.0, 400.0, PX, None),
        number("camRainSize", "Regen: Zeichengrösse", CAM, 12.0, 4.0, 60.0, PX, None),
        choice("musicArt", "Darstellung", MUSIC, "cover", &["cover", "record", "vinyl", "none"]),
        text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "> NOW PLAYING // SPOTIFY", None),
        text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "> NOW PLAYING // PAUSE", None),
        text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "KEINE WIEDERGABE", None),
        text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "spotify://offline", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("equalizer", "Equalizer", MUSIC, true),
        number("equalizerBars", "Equalizer-Balken", MUSIC, 12.0, 1.0, 60.0, None, None),
        number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        text("equalizerChars", "Equalizer-Zeichen", MUSIC, "▁▂▃▄▅▆▇█", Some(20)),
        number("vinylSpeed", "Platten-Drehtempo", MUSIC, 0.16, 0.0, 1.0, None, Some(0.01)),
        number("vinylSize", "Platten-Grösse (Zeichen)", MUSIC, 21.0, 8.0, 40.0, None, None),
        number("coverSize", "Cover-Grösse", MUSIC, 176.0, 40.0, 600.0, PX, None),
        number("musicTitleSize", "Titel-Grösse", MUSIC, 38.0, 10.0, 120.0, PX, None),
        number("musicBarWidth", "Fortschrittsbalken (Zeichen)", MUSIC, 32.0, 5.0, 100.0, None, None),
        choice("musicIn", "Einblenden", MUSIC, "glitch", &["glitch", "fade", "none"]),
        choice("musicOut", "Ausblenden", MUSIC, "glitch", &["glitch", "fade", "none"]),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxTextSize", "Textgrösse", FX, 64.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, Some(Unit::Percent), None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
        choice("fxIn", "Einblenden", FX, "glitch", &["glitch", "fade", "none"]),
        choice("fxOut", "Ausblenden", FX, "glitch", &["glitch", "fade", "none"]),
        flag("fxType", "Text tippt sich mit Glitch", FX, true),
        number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.75, 0.1, 5.0, S, Some(0.05)),
        number("stingerFall", "Fallzeit der Spalten", STINGER, 0.42, 0.05, 2.0, S, Some(0.01)),
        number("stingerColumn", "Spaltenbreite", STINGER, 24.0, 8.0, 96.0, PX, None),
        text("stingerText", "Text", STINGER, "> SZENENWECHSEL", None),
        flag("stingerLogo", "Logo", STINGER, true),
        text("bannerProfileText", "Text", PROFILE_BANNER, "> willkommen in der matrix", None),
        text("bannerProfileSub", "Untertitel", PROFILE_BANNER, "Games · Talk · Community", None),
        text("bannerOfflineStatus", "Status", OFFLINE_BANNER, "○ OFFLINE", None),
        text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "STREAM OFFLINE", None),
        text("bannerOfflineText", "Text", OFFLINE_BANNER, "> Folge dem Kanal, dann verpasst du den nächsten Stream nicht.", None),
        lines("bannerOfflineLines", "Terminal", OFFLINE_BANNER, &["connection closed by remote host", "saving session ... ok", "awaiting next broadcast"], None),
        number("bannerRainDensity", "Regen-Dichte", PROFILE_BANNER, 100.0, 0.0, 100.0, Some(Unit::Percent), None),
        number("bannerOfflineRainDensity", "Regen-Dichte", OFFLINE_BANNER, 100.0, 0.0, 100.0, Some(Unit::Percent), None),
    ],
    minime_fields(),
    vec![
        color("minimeDefaultColor", "Farbe ohne eigene Wahl", MINIME_LOOK, "#39ff14"),
        color("minimeFace", "Gesicht (Kapuzeninneres)", MINIME_LOOK, "#000000"),
        number("minimeSize", "Breite der Figur", MINIME_LOOK, 90.0, 30.0, 300.0, PX, None),
        number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 70.0, 0.0, 300.0, PX, None),
        number("minimeStroke", "Strichstärke", MINIME_LOOK, 2.5, 0.5, 8.0, None, Some(0.5)),
        number("minimeGlow", "Glühen (Stärke)", MINIME_LOOK, 1.0, 0.0, 3.0, None, Some(0.1)),
        number("minimeFloatHeight", "Schweben: Höhe", MINIME_LOOK, 6.0, 0.0, 40.0, PX, None),
        number("minimeFloatMs", "Schweben: Dauer auf oder ab", MINIME_LOOK, 1800.0, 200.0, 10_000.0, MS, None),
        number("minimeTilt", "Neigung beim Wandern (Grad)", MINIME_LOOK, 8.0, 0.0, 45.0, None, None),
        number("minimeJetColumns", "Düse: Spalten", MINIME_LOOK, 3.0, 1.0, 8.0, None, None),
        number("minimeJetLength", "Düse: Zeichen je Spalte", MINIME_LOOK, 4.0, 1.0, 12.0, None, None),
        number("minimeJetSize", "Düse: Zeichengrösse", MINIME_LOOK, 12.0, 6.0, 40.0, PX, None),
        number("minimeJetSpeed", "Düse: Fallzeit", MINIME_LOOK, 700.0, 100.0, 5000.0, MS, None),
        flag("minimeNames", "Namen anzeigen", MINIME_LOOK, true),
        number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 16.0, 8.0, 48.0, PX, None),
        number("minimeNameGap", "Name: Abstand zum Kopf", MINIME_LOOK, 4.0, 0.0, 60.0, PX, None),
        number("minimeBackflipWeight", "Backflip: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("minimeBackflipMs", "Backflip: Dauer", MINIME_MOVES, 1300.0, 200.0, 10_000.0, MS, None),
        number("minimeBackflipHeight", "Backflip: Sprunghöhe", MINIME_MOVES, 60.0, 0.0, 300.0, PX, None),
        number("minimeGlitchWeight", "Glitch: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("minimeGlitchMs", "Glitch: Dauer", MINIME_MOVES, 600.0, 100.0, 5000.0, MS, None),
        number("minimeGlitchShift", "Glitch: Versatz", MINIME_MOVES, 6.0, 0.0, 40.0, PX, None),
        number("minimeLookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 15.0, 0.0, 100.0, None, None),
        number("minimeLookMs", "Umschauen: Dauer", MINIME_MOVES, 2400.0, 300.0, 10_000.0, MS, None),
        number("minimeLookShift", "Umschauen: Augenweg", MINIME_MOVES, 4.0, 0.0, 20.0, PX, None),
        number("minimeSpinWeight", "Drehen: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("minimeSpinMs", "Drehen: Dauer", MINIME_MOVES, 1000.0, 200.0, 10_000.0, MS, None),
        number("minimeSpinTurns", "Drehen: Umdrehungen", MINIME_MOVES, 2.0, 1.0, 10.0, None, None),
        number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 5.0, 0.0, 100.0, None, None),
        number("minimeSleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000.0, 1000.0, 60_000.0, MS, None),
        number("minimeSleepDrop", "Schlafen: Absinken", MINIME_MOVES, 10.0, 0.0, 100.0, PX, None),
        text("minimeSleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", Some(4)),
        number("minimeBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_MOVES, 4000.0, 0.0, 30_000.0, MS, None),
        number("minimeBoostMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 700.0, 100.0, 5000.0, MS, None),
        number("minimeBoostHeight", "Reaktion auf Chat: Hüpfhöhe", MINIME_MOVES, 18.0, 0.0, 200.0, PX, None),
        number("minimeBoostJet", "Reaktion auf Chat: Düse länger (Faktor)", MINIME_MOVES, 2.0, 1.0, 4.0, None, Some(0.1)),
    ],
    info_fields(),
    vec![
        flag("infoRain", "Befehlsseite: Matrix-Regen im Hintergrund", INFO_GROUP, true),
        flag("infoType", "Befehlsseite: Zeilen tippen sich mit Glitch", INFO_GROUP, true),
    ],
    ]
    .concat()
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    [
        (RAIN, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending, SceneName::Alerts, SceneName::Info]),
        (SCREENS, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending]),
        (STATS, vec![SceneName::Stats]),
        (ALERTS, vec![SceneName::Alerts]),
        (CHAT, vec![SceneName::Chat]),
        (CAM, vec![SceneName::Cam]),
        (MUSIC, vec![SceneName::Music]),
        (FX, vec![SceneName::Fx]),
        (STINGER, vec![]),
        (PROFILE_BANNER, vec![]),
        (OFFLINE_BANNER, vec![]),
        (MINIME_LOOK, vec![SceneName::Minimes]),
        (MINIME_MOVES, vec![SceneName::Minimes]),
        (MINIME_COMMANDS, vec![SceneName::Minimes]),
        (MINIME_RULES, vec![SceneName::Minimes]),
        (MINIME_MOTION, vec![SceneName::Minimes]),
        (INFO_GROUP, vec![SceneName::Info]),
    ]
    .into_iter()
    .chain(tuning::matrix::group_scenes())
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
}

/// On first login: channel name and ASCII logo from the Twitch login instead of the samples
fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([
        ("channelName".to_owned(), SettingValue::Text(login.as_str().to_uppercase())),
        ("logo".to_owned(), SettingValue::Text(ascii_text(login.as_str()))),
    ])
}

/// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
/// (template: `BASIC` in `src/themes/matrix/settings.ts`)
const BASIC: &[&str] = &[
    "quality",
    "accent",
    "background",
    "font",
    "channelName",
    "logo",
    "rainScreens",
    "rainAlerts",
    "startingTitle",
    "countdownDone",
    "startingLines",
    "ticker",
    "brbTitle",
    "brbNote",
    "brbLines",
    "endingTitle",
    "endingThanks",
    "endingNext",
    "endingLines",
    "logoutLines",
    "followLine",
    "subLine",
    "resubLine",
    "giftLine",
    "raidLine",
    "cheerLine",
    "redeemLine",
    "hypeBeginLine",
    "chatPrompt",
    "camLabel",
    "camRec",
    "musicHeadPlaying",
    "musicIdleTitle",
    "musicHide",
    "fxIn",
    "fxOut",
    "minimeNames",
    "minimeDefaultColor",
];

#[must_use]
pub fn matrix() -> Theme {
    let schema = ThemeSchema {
        id: "matrix".to_owned(),
        name: "Matrix".to_owned(),
        fields: mark_basic(
            with_stinger_fields([fields(), tuning::matrix::fields()].concat(), STINGER, 60.0, 0.0),
            BASIC,
        ),
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
    use crate::themes::minime_fields::has_minimes;

    #[test]
    fn same_as_typescript() {
        assert_same_as_fixture(&matrix(), include_str!("../../tests/fixtures/matrix.json"));
    }

    #[test]
    fn personalize_sets_channel_name_and_logo_and_minimes_use_colors() {
        let neo = Login::parse("neo").expect("valid login");
        let values = personalize(&neo);
        assert_eq!(values.get("channelName"), Some(&SettingValue::Text("NEO".to_owned())));
        assert_eq!(values.get("logo"), Some(&SettingValue::Text(ascii_text("neo"))));
        let theme = matrix();
        assert!(has_minimes(&theme.schema.fields));
        assert!(theme.schema.minime_variants.is_none());
        assert!(theme.schema.field("minimeColorCommand").is_some());
    }
}
