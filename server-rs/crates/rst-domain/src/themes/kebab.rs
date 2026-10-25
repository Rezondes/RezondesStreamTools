//! Settings schema of the Kebab theme: a kebab shop as red line art on paper (template:
//! `src/themes/kebab/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal to the TypeScript
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
    MINIME_COMMANDS, MINIME_HOP, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minime_base_fields, minime_hop_fields,
    minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;

const TITLE_FONTS: [&str; 3] = ["Titan One", "Baloo 2", "Fredoka"];
const TEXT_FONTS: [&str; 3] = ["Nunito", "DM Sans", "Manrope"];

const GENERAL: &str = "Allgemein";
const CHEF: &str = "Koch und Spieß";
const STARTING: &str = "Starting";
const BRB: &str = "BRB";
const ENDING: &str = "Ending";
const CLOSING: &str = "Tagesabschluss";
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

const ALERT_STYLES: [&str; 2] = ["bon", "tuete"];
const CHAT_STYLES: [&str; 3] = ["zettel", "liste", "schlicht"];
const NAME_COLORS: [&str; 2] = ["rot", "chatter"];
const CAM_STYLES: [&str; 3] = ["fenster", "rahmen", "aus"];
const MUSIC_STYLES: [&str; 3] = ["bon", "schild", "schlicht"];
const STINGER_STYLES: [&str; 2] = ["papier", "messer"];
const DISH_TYPES: [&str; 4] = ["doener", "duerum", "lahmacun", "pommes"];

const PX: Option<Unit> = Some(Unit::Px);
const PERCENT: Option<Unit> = Some(Unit::Percent);
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
        in_scene(SceneName::Ending, flag("endingWaveOn", "Koch winkt zum Abschied", ENDING, true)),
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

fn alerts() -> Vec<SettingField> {
    vec![
        // Per kind: head line, dish, the line under the name and the item at the bottom (Posten|Zusatz)
        choice("alertStyle", "Darstellung", ALERTS, "bon", &ALERT_STYLES),
        number("alertWidth", "Breite", ALERTS, 460.0, 300.0, 1800.0, PX, None),
        text("followTag", "Follow: Kopfzeile", ALERTS, "NEUER FOLLOW", None),
        text("followDish", "Follow: Gericht", ALERTS, "1x Döner", None),
        text("followLine", "Follow: Spruch", ALERTS, "Mit alles?", None),
        text("followItem", "Follow: Posten", ALERTS, "Follow|gratis", None),
        text("subTag", "Sub: Kopfzeile", ALERTS, "NEUES ABO", None),
        text("subDish", "Sub: Gericht", ALERTS, "1x Dürüm", None),
        text("subLine", "Sub: Spruch", ALERTS, "Ab jetzt Stammkunde!", None),
        text("subItem", "Sub: Posten", ALERTS, "Abo|Stammkunde", None),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "ABO x{amount}", None),
        text("resubDish", "Resub: Gericht", ALERTS, "1x Dönerteller", None),
        text("resubLine", "Resub: Spruch", ALERTS, "Wie immer, {user}? Seit {amount} Monaten!", None),
        text("resubItem", "Resub: Posten", ALERTS, "{amount} Monate|treu", None),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "ABOS VERSCHENKT", None),
        text("giftDish", "Gift: Gericht", ALERTS, "Runde für alle", None),
        text("giftLine", "Gift: Spruch", ALERTS, "{user} gibt {amount} Döner aus!", None),
        text("giftItem", "Gift: Posten", ALERTS, "{amount}x Döner|geschenkt", None),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID", None),
        text("raidDish", "Raid: Gericht", ALERTS, "Familienplatte", None),
        text("raidLine", "Raid: Spruch", ALERTS, "{user} kommt mit {amount} Leuten rein!", None),
        text("raidItem", "Raid: Posten", ALERTS, "{amount} Gäste|willkommen", None),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS", None),
        text("cheerDish", "Bits: Gericht", ALERTS, "Extra-Soße", None),
        text("cheerLine", "Bits: Spruch", ALERTS, "{amount} Bits auf die Theke!", None),
        text("cheerItem", "Bits: Posten", ALERTS, "{amount} Bits|danke", None),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "KANALPUNKTE", None),
        text("redeemDish", "Kanalpunkte: Gericht", ALERTS, "1x Ayran", None),
        text("redeemLine", "Kanalpunkte: Spruch", ALERTS, "{detail} kommt sofort!", None),
        text("redeemItem", "Kanalpunkte: Posten", ALERTS, "Punkte|eingelöst", None),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN", None),
        text("hypeDish", "Hype Train: Gericht", ALERTS, "Grillparty", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Alle an den Grill!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Grillparty Level {amount} geschafft!", None),
        text("hypeItem", "Hype Train: Posten", ALERTS, "Hype|Level {amount}", None),
        text("alertNumber", "Bestellnummer ({number})", ALERTS, "Bestellung Nr. {number}", Some(40)),
        text("alertFor", "Wort vor dem Namen", ALERTS, "für", Some(20)),
        flag("alertQuote", "Nachricht statt Spruch zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "„{text}“", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        flag("alertStamp", "Stempel", ALERTS, true),
        text("alertStampText", "Stempel: Text", ALERTS, "MIT ALLES", Some(20)),
        number("alertStampAt", "Stempel knallt auf nach", ALERTS, 2000.0, 0.0, 10000.0, MS, None),
        flag("alertCrumbs", "Zwiebelringe und Fleischstücke", ALERTS, true),
        number("alertCrumbCount", "Zwiebelringe: Anzahl", ALERTS, 34.0, 0.0, 200.0, None, None),
        number("alertPrintSteps", "Drucker: Rucke", ALERTS, 16.0, 1.0, 40.0, None, None),
        flag("alertSound", "Töne", ALERTS, true),
    ]
}

fn chat() -> Vec<SettingField> {
    vec![
        choice("chatStyle", "Darstellung", CHAT, "zettel", &CHAT_STYLES),
        number("chatMax", "Max. Nachrichten", CHAT, 6.0, 1.0, 50.0, None, None),
        number("chatLifetime", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatWidth", "Breite", CHAT, 480.0, 200.0, 1900.0, PX, None),
        choice("chatNameColor", "Farbe der Namen", CHAT, "rot", &NAME_COLORS),
        number("chatPrintMs", "Zettel kommt heraus (Dauer)", CHAT, 400.0, 0.0, 3000.0, MS, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        flag("chatBadges", "Badges zeigen", CHAT, true),
    ]
}

fn cam_music_fx() -> Vec<SettingField> {
    vec![
        choice("camStyle", "Darstellung", CAM, "fenster", &CAM_STYLES),
        text("camLabel", "Namensschild ({channel}, {shop})", CAM, "{shop}", None),
        flag("camAwning", "Markise", CAM, true),
        number("camAwningStripes", "Markise: Streifen", CAM, 8.0, 2.0, 30.0, None, None),
        flag("camCounter", "Theke unten", CAM, true),
        number("camBorder", "Rahmenstärke", CAM, 6.0, 0.0, 30.0, PX, None),
        choice("musicStyle", "Darstellung", MUSIC, "bon", &MUSIC_STYLES),
        text("musicLabel", "Überzeile", MUSIC, "LÄUFT GERADE", None),
        text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Gerade keine Musik", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicCover", "Cover zeigen", MUSIC, true),
        flag("musicProgress", "Fortschritt", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        number("coverSize", "Cover-Grösse", MUSIC, 96.0, 40.0, 300.0, PX, None),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        flag("fxText", "Text zeigen", FX, true),
        number("fxTextSize", "Textgrösse", FX, 96.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, PERCENT, None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
    ]
}

/// Clips: the stinger (papier or messer) and the profile and offline banners
fn clips() -> Vec<SettingField> {
    vec![
        choice("stingerStyle", "Darstellung", STINGER, "papier", &STINGER_STYLES),
        text("stingerText", "Bogenschrift", STINGER, "DÖNER KEBAB", Some(30)),
        number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5.0, S, Some(0.05)),
        number("stingerTearJag", "Papier: Zacken der Riss-Kante", STINGER, 4.0, 0.0, 15.0, PERCENT, Some(0.5)),
        number("stingerSlices", "Messer: Fleischscheiben", STINGER, 9.0, 3.0, 20.0, None, None),
        flag("stingerShavings", "Messer: Späne fliegen", STINGER, true),
        number("stingerSeed", "Startwert", STINGER, 7.0, 1.0, 9999.0, None, None),
        text("profileTitle", "Titel", PROFILE_BANNER, "{shop}", Some(60)),
        text("profileSubtitle", "Zeile darunter", PROFILE_BANNER, "Frisch vom Spieß", Some(80)),
        flag("profileSteam", "Dampf über dem Spieß", PROFILE_BANNER, true),
        text("offlineText", "Text auf dem Rollladen", OFFLINE_BANNER, "Heute geschlossen", Some(60)),
        flag("offlineSteam", "Dampf unter dem Rollladen", OFFLINE_BANNER, true),
    ]
}

/// The four dishes as minime variants (template: `DISH_SET` in `src/themes/kebab/dishes.ts`)
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
            variant("doener", "Döner", &["doener", "döner", "kebab"]),
            variant("duerum", "Dürüm", &["duerum", "dürüm", "wrap"]),
            variant("lahmacun", "Lahmacun", &["lahmacun", "pizza"]),
            variant("pommes", "Pommes", &["pommes", "fries"]),
        ],
    }
}

/// Minimes: core fields plus the look and the own animations of the dishes
fn minimes() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend(minime_hop_fields());
    fields.extend(vec![
        number("minimeSize", "Grösse (Höhe)", MINIME_LOOK, 96.0, 40.0, 400.0, PX, None),
        number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 12.0, 0.0, 300.0, PX, None),
        choice("minimeDefault", "Typ ohne Wahl (alle aus)", MINIME_LOOK, "doener", &DISH_TYPES),
        flag("minimeCounter", "Thekenlinie unten", MINIME_LOOK, true),
        flag("minimeLabels", "Namensschilder als Bestellzettel", MINIME_LOOK, true),
        number("minimeLabelSize", "Namensschild: Schriftgrösse", MINIME_LOOK, 16.0, 8.0, 48.0, PX, None),
        number("minimeSpinWeight", "Drehen (Döner): Häufigkeit", MINIME_MOVES, 5.0, 0.0, 100.0, None, None),
        number("minimeSpinMs", "Drehen (Döner): Dauer", MINIME_MOVES, 1600.0, 300.0, 10_000.0, MS, None),
        number("minimeRollWeight", "Aufrollen (Dürüm): Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeRollMs", "Aufrollen (Dürüm): Dauer", MINIME_MOVES, 2000.0, 300.0, 10_000.0, MS, None),
        number("minimeFoldWeight", "Falten (Lahmacun): Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeFoldMs", "Falten (Lahmacun): Dauer", MINIME_MOVES, 1800.0, 300.0, 10_000.0, MS, None),
        number("minimeFriesWeight", "Stäbchen werfen (Pommes): Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("minimeFriesMs", "Stäbchen werfen (Pommes): Dauer", MINIME_MOVES, 1400.0, 300.0, 10_000.0, MS, None),
        number("minimeWaveWeight", "Winken: Häufigkeit", MINIME_MOVES, 3.0, 0.0, 100.0, None, None),
        number("minimeWaveMs", "Winken: Dauer", MINIME_MOVES, 1500.0, 300.0, 10_000.0, MS, None),
        number(
            "minimeJumpMs",
            "Reaktion auf Chat (Sprung mit Dampf): Dauer",
            MINIME_MOVES,
            700.0,
            200.0,
            5000.0,
            MS,
            None,
        ),
    ]);
    fields
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
        (ALERTS.to_owned(), vec![SceneName::Alerts]),
        (CHAT.to_owned(), vec![SceneName::Chat]),
        (CAM.to_owned(), vec![SceneName::Cam]),
        (MUSIC.to_owned(), vec![SceneName::Music]),
        (FX.to_owned(), vec![SceneName::Fx]),
        (INFO_GROUP.to_owned(), vec![SceneName::Info]),
        (STINGER.to_owned(), vec![]),
        (PROFILE_BANNER.to_owned(), vec![]),
        (OFFLINE_BANNER.to_owned(), vec![]),
        (MINIME_COMMANDS.to_owned(), vec![SceneName::Minimes]),
        (MINIME_RULES.to_owned(), vec![SceneName::Minimes]),
        (MINIME_MOTION.to_owned(), vec![SceneName::Minimes]),
        (MINIME_HOP.to_owned(), vec![SceneName::Minimes]),
        (MINIME_VARIANTS.to_owned(), vec![SceneName::Minimes]),
        (MINIME_LOOK.to_owned(), vec![SceneName::Minimes]),
        (MINIME_MOVES.to_owned(), vec![SceneName::Minimes]),
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
    "brbTicker",
    "endingTitle",
    "endingNext",
    "closingTitle",
    "closingLines",
    "stampText",
    "alertStyle",
    "followLine",
    "subLine",
    "raidLine",
    "cheerLine",
    "alertStampText",
    "chatStyle",
    "chatBadges",
    "camStyle",
    "camLabel",
    "musicStyle",
    "musicLabel",
    "musicIdle",
    "fxText",
    "minimeDefault",
    "minimeLabels",
];

#[must_use]
pub fn kebab() -> Theme {
    let info = with_defaults(info_fields(), &[("infoTitle", SettingValue::Text("Speisekarte".to_owned()))]);
    let mut fields = [
        general(),
        chef(),
        starting(),
        brb(),
        ending(),
        closing(),
        alerts(),
        alert_sound_fields(ALERTS),
        chat(),
        badge_fields(CHAT),
        cam_music_fx(),
        info,
    ]
    .concat();
    fields.push(number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900.0, 400.0, 1600.0, PX, None));
    fields.extend(clips());
    fields.extend(minimes());
    fields.extend(minime_variant_fields(&variants()));
    let schema = ThemeSchema {
        id: "kebab".to_owned(),
        name: "Kebab".to_owned(),
        fields: mark_basic(with_stinger_fields(fields, STINGER, 60.0, 0.0), BASIC),
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
