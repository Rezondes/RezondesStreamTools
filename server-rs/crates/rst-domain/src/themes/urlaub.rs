//! Settings schema of the Urlaub theme: southern tropical coast and sea look (sea, waves, sand, palms, wooden
//! signs) for all scenes, stinger and banners, plus fruit minimes that hop (template: `src/themes/urlaub/settings.ts`,
//! fruits from `src/themes/urlaub/fruits.ts`). Labels, groups and defaults are the German UI texts and stay equal
//! to the TypeScript schema (fixture test). The field list was ported once from the fixture.

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
use crate::themes::stinger_fields::stinger_fields;

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);

fn variant(id: &str, label: &str, names: &[&str]) -> MinimeVariantInfo {
    MinimeVariantInfo {
        id: id.to_owned(),
        label: label.to_owned(),
        names: names.iter().map(|name| (*name).to_owned()).collect(),
        color: None,
    }
}

const GENERAL: &str = "Allgemein";
const BEACH: &str = "Kulisse";
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
const THING_COLORS: &str = "Typen: Farben";

/// The beach things (minime variants): id, name, names in chat, main and detail color
const BEACH_THINGS: [(&str, &str, &[&str], &str, &str); 16] = [
    ("rettungsring", "Rettungsring", &["rettungsring", "ring", "lifebuoy"], "#ff3b30", "#ffffff"),
    ("badeente", "Badeente", &["badeente", "ente", "duck", "rubberduck"], "#ffd22e", "#ff8c1a"),
    ("wasserball", "Wasserball", &["wasserball", "ball", "beachball"], "#ffffff", "#ff4f6d"),
    ("surfbrett", "Surfbrett", &["surfbrett", "surf", "surfboard"], "#29b6f6", "#ffd166"),
    ("sonnenschirm", "Sonnenschirm", &["sonnenschirm", "schirm", "umbrella"], "#ff6f61", "#fff3d6"),
    ("flamingo", "Flamingo-Schwimmring", &["flamingo", "flamingoring", "schwimmring"], "#ff8fb8", "#ff5c99"),
    ("liegestuhl", "Liegestuhl", &["liegestuhl", "stuhl", "deckchair"], "#4fc3f7", "#ffffff"),
    ("sandeimer", "Sandeimer", &["sandeimer", "eimer", "bucket"], "#ff9f1c", "#ffe066"),
    ("eis", "Eis am Stiel", &["eis", "eisamstiel", "popsicle", "icecream"], "#ff8fab", "#fff1c1"),
    ("muschel", "Muschel", &["muschel", "shell"], "#ffd8c2", "#e8a07e"),
    ("seestern", "Seestern", &["seestern", "starfish"], "#ff9a52", "#ffd27a"),
    ("krebs", "Krebs", &["krebs", "krabbe", "crab"], "#ff5a4e", "#c9372c"),
    ("schnorchel", "Schnorchelmaske", &["schnorchel", "schnorchelmaske", "snorkel"], "#ffdd00", "#bfefff"),
    ("sonnenbrille", "Sonnenbrille", &["sonnenbrille", "brille", "shades"], "#2b2b3a", "#7fd8ff"),
    ("cocktail", "Cocktail", &["cocktail", "drink"], "#e8f8ff", "#ff7aa8"),
    ("strandtasche", "Strandtasche", &["strandtasche", "tasche", "beachbag", "bag"], "#2ec4b6", "#ffe28a"),
];

/// Main and detail color per beach thing (keys `thing<Id>Main`, `thing<Id>Detail`)
fn thing_color_fields() -> Vec<SettingField> {
    BEACH_THINGS
        .iter()
        .flat_map(|(id, label, _, main, detail)| {
            let key = capital(id);
            [
                color(&format!("thing{key}Main"), &format!("{label}: Hauptfarbe"), THING_COLORS, main),
                color(&format!("thing{key}Detail"), &format!("{label}: Detailfarbe"), THING_COLORS, detail),
            ]
        })
        .collect()
}

fn fields() -> Vec<SettingField> {
    [
        vec![
            text("channelName", "Kanal-Name", GENERAL, "Strand", Some(40)),
            font("font", "Schrift", GENERAL, "Fredoka", &["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]),
            font("titleFont", "Titelschrift", GENERAL, "Pacifico", &["Pacifico", "Fredoka", "Baloo 2", "Nunito"]),
            number("fontSize", "Schriftgrösse", GENERAL, 22.0, 10.0, 60.0, PX, None),
            color("textColor", "Textfarbe", GENERAL, "#ffffff"),
            color("textOnWood", "Text auf Holz", GENERAL, "#3b2412"),
            color("wood", "Holz", GENERAL, "#d39a5c"),
            color("woodDark", "Holz dunkel (Maserung, Rand)", GENERAL, "#8a5527"),
            color("sea", "Meer", GENERAL, "#1fb5c9"),
            color("seaDeep", "Meer tief", GENERAL, "#0b6f8e"),
            color("foam", "Gischt", GENERAL, "#f4fffd"),
            color("sand", "Sand", GENERAL, "#f2d49b"),
            color("palmLeaf", "Palmblätter", GENERAL, "#2e9e4f"),
            color("palmTrunk", "Palmstamm", GENERAL, "#8b5a2b"),
            color("accent", "Akzent (Hibiskus)", GENERAL, "#ff4f8b"),
            color("accent2", "Akzent 2 (Mango)", GENERAL, "#ffa62b"),
            number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.35, 0.0, 1.0, None, Some(0.05)),
            number("radius", "Eckenradius", GENERAL, 18.0, 0.0, 60.0, PX, None),
            number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500.0, 0.0, 3000.0, MS, None),
            choice(
                "locale",
                "Uhrzeit-Format",
                GENERAL,
                "de-DE",
                &["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"],
            ),
            color("skyMorningBottom", "Himmel Morgen unten", BEACH, "#ffe2b0"),
            color("sun", "Sonne", BEACH, "#ffd23f"),
            number("palmsLeft", "Palmen links", BEACH, 2.0, 0.0, 3.0, None, None),
            number("palmsRight", "Palmen rechts", BEACH, 1.0, 0.0, 3.0, None, None),
            number("palmSway", "Palmen wiegen (Grad)", BEACH, 3.0, 0.0, 20.0, None, None),
            flag("boat", "Segelboot am Horizont", BEACH, true),
            flag("gulls", "Möwen", BEACH, true),
            quality_field(BEACH),
            number("worldSeed", "Startwert der Welt", BEACH, 12.0, 0.0, 9999.0, None, None),
            flag("sunriseOn", "Sonnenaufgang im Starting", BEACH, true),
            number("sunriseMs", "Sonnenaufgang (Dauer)", BEACH, 4000.0, 0.0, 20000.0, MS, None),
            number("sunHeight", "Sonnenhöhe (Grad)", BEACH, 4.5, -5.0, 90.0, None, Some(0.5)),
            number("sunAzimuth", "Sonnenrichtung (Grad)", BEACH, 196.0, 0.0, 360.0, None, None),
            number("turbidity", "Dunst am Himmel", BEACH, 6.0, 1.0, 20.0, None, Some(0.5)),
            number("exposure", "Belichtung", BEACH, 0.42, 0.1, 2.0, None, Some(0.02)),
            color("waterColor", "Meer in der Tiefe (3D)", BEACH, "#0a4a5e"),
            number("waveDistortion", "Wellen: Verzerrung der Spiegelung", BEACH, 2.6, 0.0, 10.0, None, Some(0.1)),
            flag("surfOn", "Brandung", BEACH, true),
            number("surfBands", "Brandung: Bänder", BEACH, 3.0, 1.0, 6.0, None, None),
            number("surfSeconds", "Brandung: Zeit je Welle", BEACH, 7.0, 2.0, 30.0, S, None),
            number("rocks", "Felsen an der Wasserlinie", BEACH, 9.0, 0.0, 30.0, None, None),
            number("gullCount", "Möwen (Anzahl)", BEACH, 5.0, 1.0, 40.0, None, None),
            number("cameraHeight", "Kamera: Höhe", BEACH, 3.2, 1.0, 10.0, None, Some(0.1)),
            flag("cameraDrift", "Kamera schwankt leicht", BEACH, true),
            in_scene(
                SceneName::Brb,
                number("brbSunHeight", "BRB: Sonnenhöhe (Grad)", BEACH, 55.0, 0.0, 90.0, None, None),
            ),
            in_scene(SceneName::Brb, flag("umbrellaOn", "BRB: Sonnenschirm und Liegestuhl", BEACH, true)),
            in_scene(SceneName::Brb, color("umbrellaColor", "BRB: Sonnenschirm", BEACH, "#ff4f8b")),
            in_scene(
                SceneName::Ending,
                number("sunsetMs", "Ending: Sonnenuntergang (Dauer)", BEACH, 5000.0, 0.0, 30000.0, MS, None),
            ),
            in_scene(SceneName::Ending, flag("torchesOn", "Ending: Fackeln", BEACH, true)),
            in_scene(SceneName::Ending, number("torches", "Ending: Anzahl Fackeln", BEACH, 4.0, 1.0, 8.0, None, None)),
            in_scene(
                SceneName::Starting,
                text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los", None),
            ),
            in_scene(
                SceneName::Starting,
                text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None),
            ),
            in_scene(
                SceneName::Starting,
                text("startingNote", "Starting: Untertitel", SCREENS, "Schnapp dir einen Cocktail!", None),
            ),
            in_scene(SceneName::Brb, text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
            in_scene(SceneName::Brb, text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
            in_scene(
                SceneName::Brb,
                text("brbNote", "BRB: Untertitel", SCREENS, "Kurz im Meer, gleich wieder da.", None),
            ),
            in_scene(
                SceneName::Ending,
                text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None),
            ),
            in_scene(SceneName::Ending, text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
            in_scene(
                SceneName::Ending,
                text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Sonnenuntergang!", None),
            ),
            flag("woodGrain", "Schild: Holzmaserung", SCREENS, true),
            number("signSwing", "Schild: Pendeln (Grad)", SCREENS, 8.0, 0.0, 30.0, None, None),
            number("signWidth", "Schild: Breite", SCREENS, 1100.0, 400.0, 1800.0, PX, None),
            number("titleSize", "Titelgrösse", SCREENS, 110.0, 30.0, 240.0, PX, None),
            in_scene(
                SceneName::Starting,
                number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86_400.0, S, None),
            ),
            in_scene(SceneName::Starting, text("countdownPrefix", "Countdown-Präfix", SCREENS, "", None)),
            in_scene(
                SceneName::Starting,
                text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!", None),
            ),
            in_scene(
                SceneName::Starting,
                choice("progressStyle", "Fortschritt", SCREENS, "welle", &["welle", "seil", "aus"]),
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
                        "Sonnencreme wird aufgetragen ...",
                        "Liegestuhl wird aufgestellt ...",
                        "Kokosnuss wird geöffnet ...",
                        "Surfbrett wird gewachst ...",
                        "Wellen werden gezählt ...",
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
                    &[
                        "Kurz eine Runde schwimmen ...",
                        "Cocktail wird nachgefüllt ...",
                        "Sandburg wird gebaut ...",
                        "Muscheln werden gesammelt ...",
                    ],
                    None,
                ),
            ),
            in_scene(
                SceneName::Ending,
                lines(
                    "endingLines",
                    "Sprüche Ending",
                    SCREENS,
                    &[
                        "Handtuch wird ausgeschüttelt ...",
                        "Sonnenuntergang wird genossen ...",
                        "Bis zum nächsten Mal am Strand!",
                    ],
                    None,
                ),
            ),
            number("linesEvery", "Sprüche wechseln alle", SCREENS, 6.0, 2.0, 120.0, S, None),
            text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(300)),
            choice("tickerStyle", "Ticker", SCREENS, "flugzeug", &["flugzeug", "leiste"]),
            number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30.0, 5.0, 300.0, S, None),
            choice("powerOn", "Einschalten", SCREENS, "sonnenaufgang", &["sonnenaufgang", "blenden", "keins"]),
            number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1800.0, 0.0, 10_000.0, MS, None),
            choice("alertStyle", "Stil", ALERTS, "postkarte", &["postkarte", "surfbrett", "flaschenpost"]),
            text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower", None),
            text("followLine", "Follow: Zeile", ALERTS, "{user} ist mit an Bord!", None),
            choice(
                "followIcon",
                "Follow: Symbol",
                ALERTS,
                "muschel",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo", None),
            text("subLine", "Sub: Zeile", ALERTS, "{user} hat abonniert!", None),
            choice(
                "subIcon",
                "Sub: Symbol",
                ALERTS,
                "hibiskus",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}", None),
            text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten am Strand!", None),
            choice(
                "resubIcon",
                "Resub: Symbol",
                ALERTS,
                "sonne",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt", None),
            text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!", None),
            choice(
                "giftIcon",
                "Gift: Symbol",
                ALERTS,
                "kokosnuss",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid", None),
            text("raidLine", "Raid: Zeile", ALERTS, "{user} landet mit {amount} Leuten am Strand!", None),
            choice(
                "raidIcon",
                "Raid: Symbol",
                ALERTS,
                "boot",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits", None),
            text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits ins Meer!", None),
            choice(
                "cheerIcon",
                "Bits: Symbol",
                ALERTS,
                "seestern",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
            text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
            choice(
                "redeemIcon",
                "Kanalpunkte: Symbol",
                ALERTS,
                "ananas",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
            text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train fährt ab!", None),
            text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
            choice(
                "hypeIcon",
                "Hype Train: Symbol",
                ALERTS,
                "welle",
                &["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"],
            ),
            flag("alertQuote", "Nachricht zeigen", ALERTS, true),
            text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
            number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60_000.0, MS, None),
            number("alertScale", "Grösse", ALERTS, 1.0, 0.3, 2.0, None, Some(0.05)),
            number("alertTop", "Abstand oben", ALERTS, 80.0, 0.0, 1000.0, PX, None),
            choice("alertAlign", "Position", ALERTS, "center", &["left", "center", "right"]),
            number("alertWidth", "Breite", ALERTS, 760.0, 300.0, 1800.0, PX, None),
            flag("alertTimer", "Restzeit als Seil", ALERTS, true),
            flag("petals", "Hibiskus-Konfetti", ALERTS, true),
            number("petalCount", "Anzahl Blüten", ALERTS, 14.0, 0.0, 40.0, None, None),
            flag("splash", "Wasserspritzer", ALERTS, true),
            text("alertGreeting", "Postkarte: Gruss auf der Vorderseite", ALERTS, "Grüße aus dem Chat", Some(40)),
            number("alertSwellIn", "Welle herein (Dauer)", ALERTS, 1300.0, 300.0, 5000.0, MS, None),
            number("alertSwellOut", "Welle hinaus (Dauer)", ALERTS, 1300.0, 300.0, 5000.0, MS, None),
            number("alertSwellHeight", "Welle: Höhe", ALERTS, 300.0, 50.0, 600.0, PX, None),
            number("alertSpray", "Gischt: Tropfen", ALERTS, 60.0, 0.0, 200.0, None, None),
            text("alertStamp", "Poststempel ({date} = Datum)", ALERTS, "STRAND {date}", Some(30)),
            text(
                "alertAddress",
                "Postkarte: Adresse ({channel} = Kanal, Zeilen mit / trennen)",
                ALERTS,
                "An: {channel} / Strandkorb 7 / Am Meer",
                Some(80),
            ),
            flag("alertSound", "Töne", ALERTS, true),
        ],
        alert_sound_fields(ALERTS),
        vec![choice("chatStyle", "Stil", CHAT, "blase", &["blase", "planke", "muschel"])],
        badge_fields(CHAT),
        vec![
            flag("chatBadges", "Badges zeigen", CHAT, true),
            number("chatFontSize", "Schriftgrösse", CHAT, 20.0, 8.0, 60.0, PX, None),
            number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
            number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
            number("chatMax", "Max. Nachrichten", CHAT, 12.0, 1.0, 100.0, None, None),
            choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", &["bottom", "top"]),
            number("chatOpacity", "Deckkraft", CHAT, 0.92, 0.0, 1.0, None, Some(0.01)),
            number("chatGap", "Abstand", CHAT, 10.0, 0.0, 40.0, PX, None),
            flag("chatSway", "Sanft schaukeln", CHAT, true),
            flag("chatBubbles", "Luftblasen steigen auf", CHAT, true),
            number("chatBubbleCount", "Luftblasen: Anzahl", CHAT, 14.0, 0.0, 60.0, None, None),
            number("chatBubbleRise", "Luftblasen: Steigen (px pro s)", CHAT, 60.0, 10.0, 300.0, None, None),
            choice("camStyle", "Rahmen", CAM, "bambus", &["bambus", "holz", "seil"]),
            number("camFrameWidth", "Rahmenbreite", CAM, 18.0, 2.0, 60.0, PX, None),
            number("camRadius", "Eckenradius", CAM, 22.0, 0.0, 80.0, PX, None),
            number("camLeaves", "Palmblätter in den Ecken", CAM, 3.0, 0.0, 4.0, None, None),
            number("camLeafSize", "Palmblatt: Grösse", CAM, 150.0, 40.0, 400.0, PX, None),
            flag("camLeafSway", "Palmblätter wiegen", CAM, true),
            flag("camFlower", "Hibiskusblüte", CAM, true),
            text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
            flag("camLive", "Live-Anzeige", CAM, true),
            text("camLiveText", "Live-Text", CAM, "LIVE", None),
            choice("musicStyle", "Stil", MUSIC, "radio", &["radio", "muschel", "schlicht"]),
            text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Strandradio", None),
            text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause", None),
            text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik", None),
            text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Meeresrauschen", None),
            flag("musicAlbum", "Album zeigen", MUSIC, false),
            flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
            flag("equalizer", "Wellen-Equalizer", MUSIC, true),
            number("equalizerBars", "Equalizer: Balken", MUSIC, 7.0, 1.0, 16.0, None, None),
            choice("coverShape", "Cover-Form", MUSIC, "rund", &["rund", "eckig"]),
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
            choice("fxIn", "Einblenden", FX, "plopp", &["welle", "plopp", "gleiten", "blenden", "keins"]),
            choice("fxOut", "Ausblenden", FX, "blenden", &["welle", "plopp", "gleiten", "blenden", "keins"]),
            flag("fxBubble", "Text in Sprechblase", FX, true),
            number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5.0, S, Some(0.05)),
            number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5.0, S, Some(0.05)),
            text("stingerText", "Text ({channel})", STINGER, "{channel}", None),
            number("stingerWaves", "Wellenschichten", STINGER, 3.0, 1.0, 5.0, None, None),
            flag("stingerFoam", "Schaumkrone", STINGER, true),
            flag("stingerPalm", "Palme im Bild", STINGER, true),
            number("stingerSpray", "Gischt: Tropfen", STINGER, 50.0, 0.0, 200.0, None, None),
            number("bannerSunHeight", "Profilbanner: Sonnenhöhe (Grad)", BANNER, 30.0, 0.0, 90.0, None, None),
            number("bannerSunset", "Offline-Banner: Sonnenhöhe (Grad)", BANNER, 3.0, -4.0, 20.0, None, None),
            text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", None),
            text("bannerProfileText", "Profilbanner: Text", BANNER, "Sonne, Strand und gute Streams", None),
            text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Gerade am Strand", None),
            text(
                "bannerOfflineText",
                "Offline-Banner: Text",
                BANNER,
                "Folge dem Kanal und verpasse keinen Stream.",
                None,
            ),
            lines(
                "bannerOfflineLines",
                "Offline-Banner: Zeilen",
                BANNER,
                &["Bald wieder live", "Sonnencreme nicht vergessen"],
                None,
            ),
        ],
        minime_base_fields(),
        vec![
            number("fruitSize", "Grösse", MINIME_LOOK, 84.0, 30.0, 300.0, PX, None),
            number("fruitGround", "Abstand zum unteren Rand", MINIME_LOOK, 20.0, 0.0, 300.0, PX, None),
            number("fruitShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0.0, 1.0, None, Some(0.05)),
            flag("fruitFaces", "Gesichter", MINIME_LOOK, true),
            color("fruitEye", "Augen", MINIME_LOOK, "#2b1b17"),
            color("fruitCheek", "Bäckchen", MINIME_LOOK, "#ff7a9a"),
            color("fruitMouth", "Mund", MINIME_LOOK, "#6b2a1f"),
            color("fruitOutline", "Umriss", MINIME_LOOK, "#5a3a22"),
            number("fruitOutlineWidth", "Umriss: Stärke", MINIME_LOOK, 2.5, 0.0, 8.0, None, Some(0.5)),
            color("fruitLeaf", "Akzent", MINIME_LOOK, "#3aa655"),
            color("fruitStem", "Holz und Griffe", MINIME_LOOK, "#6b4423"),
            choice(
                "fruitDefault",
                "Typ ohne Wahl (alle aus)",
                MINIME_LOOK,
                "rettungsring",
                &BEACH_THINGS.map(|thing| thing.0),
            ),
            flag("fruitNames", "Namen zeigen", MINIME_LOOK, true),
            choice("fruitNameStyle", "Namen auf", MINIME_LOOK, "schild", &["schild", "band"]),
            number("fruitNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15.0, 8.0, 48.0, PX, None),
            number("fruitBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000.0, 0.0, 30_000.0, MS, None),
            choice("fruitEnter", "Erscheinen", MINIME_LOOK, "fallen", &["fallen", "blenden"]),
            choice("fruitExit", "Verschwinden", MINIME_LOOK, "wegspringen", &["wegspringen", "versinken"]),
        ],
        minime_hop_fields(),
        vec![
            number("bounceWeight", "Freudensprünge: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
            number("bounceMs", "Freudensprünge: Dauer", MINIME_MOVES, 1500.0, 300.0, 10_000.0, MS, None),
            number("bounceHeight", "Freudensprünge: Höhe", MINIME_MOVES, 34.0, 0.0, 200.0, PX, None),
            number("spinWeight", "Pirouette: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
            number("spinMs", "Pirouette: Dauer", MINIME_MOVES, 900.0, 200.0, 10_000.0, MS, None),
            number("spinTurns", "Pirouette: Umdrehungen", MINIME_MOVES, 1.0, 1.0, 6.0, None, None),
            number("wobbleWeight", "Wackeln: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
            number("wobbleMs", "Wackeln: Dauer", MINIME_MOVES, 1200.0, 200.0, 10_000.0, MS, None),
            number("wobbleAngle", "Wackeln: Winkel", MINIME_MOVES, 12.0, 0.0, 45.0, None, None),
            number("sunglassesWeight", "Sonnenbrille: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
            number("sunglassesMs", "Sonnenbrille: Dauer", MINIME_MOVES, 5000.0, 1000.0, 30_000.0, MS, None),
            color("sunglasses", "Sonnenbrille", MINIME_MOVES, "#1d1d2b"),
            number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12.0, 0.0, 100.0, None, None),
            number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400.0, 300.0, 10_000.0, MS, None),
            number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
            number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000.0, 1000.0, 60_000.0, MS, None),
            text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", Some(4)),
            number("splashMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900.0, 200.0, 5000.0, MS, None),
            number("splashHeight", "Reaktion auf Chat: Sprunghöhe", MINIME_MOVES, 50.0, 0.0, 300.0, PX, None),
            number("splashDrops", "Reaktion auf Chat: Wasserspritzer", MINIME_MOVES, 8.0, 0.0, 20.0, None, None),
        ],
        info_fields(),
        minime_variant_fields(&variants()),
        thing_color_fields(),
    ]
    .concat()
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    [
        (BEACH, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending, SceneName::Info]),
        (SCREENS, vec![SceneName::Starting, SceneName::Brb, SceneName::Ending]),
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
        (THING_COLORS, vec![SceneName::Minimes]),
        (INFO_GROUP, vec![SceneName::Info]),
    ]
    .into_iter()
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
}

fn variants() -> MinimeVariantSet {
    MinimeVariantSet {
        command: "!typ".to_owned(),
        label: "Typ".to_owned(),
        variants: BEACH_THINGS.iter().map(|(id, label, names, ..)| variant(id, label, names)).collect(),
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
/// (template: `BASIC` in `src/themes/urlaub/settings.ts`)
const BASIC: &[&str] = &[
    "channelName",
    "font",
    "titleFont",
    "textColor",
    "accent",
    "accent2",
    "boat",
    "gulls",
    "startingEyebrow",
    "startingTitle",
    "ticker",
    "brbTitle",
    "brbNote",
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
    "fruitDefault",
    "fruitNames",
];

#[must_use]
pub fn urlaub() -> Theme {
    let schema = ThemeSchema {
        id: "urlaub".to_owned(),
        name: "Urlaub".to_owned(),
        fields: mark_basic([fields(), stinger_fields(STINGER, 60.0, 0.0)].concat(), BASIC),
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
        assert_same_as_fixture(&urlaub(), include_str!("../../tests/fixtures/urlaub.json"));
    }

    #[test]
    fn variants_and_personalize() {
        let set = variants();
        assert_eq!(set.variants.len(), 16);
        assert_eq!(set.variants.first().map(|variant| variant.id.as_str()), Some("rettungsring"));
        assert_eq!(set.command, "!typ");
        let neo = Login::parse("neo_42").expect("valid login");
        assert_eq!(
            personalize(&neo),
            BTreeMap::from([("channelName".to_owned(), SettingValue::Text("Neo_42".to_owned()))])
        );
    }
}
