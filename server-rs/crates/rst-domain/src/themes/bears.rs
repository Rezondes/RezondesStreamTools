//! Settings schema of the Bärenbande theme: three bear brothers (Eisbär, Grizzly, Panda) as cartoons with a clear outline
//! in front of a watercolor world, one bear (or the tower of all three) per scene (template:
//! `src/themes/bears/settings.ts`). Labels, groups and defaults are the German UI texts and stay equal to the TypeScript
//! schema (fixture test).

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, Unit, choice, color, flag, font, in_scene, lines, number, text,
};
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{
    MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_STACK, MINIME_VARIANTS, minime_base_fields,
    minime_stack_fields, minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};

const PX: Option<Unit> = Some(Unit::Px);
const MS: Option<Unit> = Some(Unit::Ms);
const S: Option<Unit> = Some(Unit::S);
const PERCENT: Option<Unit> = Some(Unit::Percent);

const GENERAL: &str = "Allgemein";
/// The bears themselves (fur, face, blinking, tower) apply everywhere, so their fields are general
const BEARS: &str = GENERAL;
const WORLD: &str = "Welt";
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
const BEAR_IDS: [&str; 3] = ["eisbaer", "grizzly", "panda"];

/// The three bears as minime variants (template: `src/themes/bears/minimeBears.ts`)
fn variants() -> MinimeVariantSet {
    let variant = |id: &str, label: &str, names: &[&str]| MinimeVariantInfo {
        id: id.to_owned(),
        label: label.to_owned(),
        names: names.iter().map(|name| (*name).to_owned()).collect(),
        color: None,
    };
    MinimeVariantSet {
        command: "!baer".to_owned(),
        label: "Bär".to_owned(),
        variants: vec![
            variant("eisbaer", "Eisbär", &["eisbaer", "eis", "polar", "ice"]),
            variant("grizzly", "Grizzly", &["grizzly", "braunbaer", "brown"]),
            variant("panda", "Panda", &["panda"]),
        ],
    }
}

fn minime_fields() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend(vec![
        number("minimeBearSize", "Grösse (Höhe)", MINIME_LOOK, 120.0, 40.0, 400.0, PX, None),
        number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 16.0, 0.0, 300.0, PX, None),
        number("minimeShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0.0, 1.0, None, Some(0.05)),
        choice("minimeDefault", "Bär ohne Wahl (alle aus)", MINIME_LOOK, "grizzly", &BEAR_IDS),
        flag("minimeNames", "Namen zeigen", MINIME_LOOK, true),
        number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15.0, 8.0, 48.0, PX, None),
        number("waddleAngle", "Watscheln: Kippen (Grad)", MINIME_LOOK, 6.0, 0.0, 20.0, None, None),
        number("waddleMs", "Watscheln: Dauer eines Schritts", MINIME_LOOK, 600.0, 200.0, 3000.0, MS, None),
        choice("minimeEnter", "Erscheinen", MINIME_LOOK, "watscheln", &["watscheln", "plopp"]),
        choice("minimeExit", "Verschwinden", MINIME_LOOK, "watscheln", &["watscheln", "plopp"]),
        number("selfieWeight", "Selfie: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("selfieMs", "Selfie: Dauer", MINIME_MOVES, 2400.0, 300.0, 10_000.0, MS, None),
        number("snackWeight", "Snack: Häufigkeit", MINIME_MOVES, 8.0, 0.0, 100.0, None, None),
        number("snackMs", "Snack: Dauer", MINIME_MOVES, 3000.0, 300.0, 10_000.0, MS, None),
        number("waveWeight", "Winken: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("waveMs", "Winken: Dauer", MINIME_MOVES, 1600.0, 300.0, 10_000.0, MS, None),
        number("danceWeight", "Tanzen: Häufigkeit", MINIME_MOVES, 6.0, 0.0, 100.0, None, None),
        number("danceMs", "Tanzen: Dauer", MINIME_MOVES, 2600.0, 300.0, 10_000.0, MS, None),
        number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 10.0, 0.0, 100.0, None, None),
        number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2200.0, 300.0, 10_000.0, MS, None),
        number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4.0, 0.0, 100.0, None, None),
        number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000.0, 1000.0, 60_000.0, MS, None),
        text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", Some(4)),
        number("waveReactMs", "Reaktion auf Chat (Winken): Dauer", MINIME_MOVES, 1200.0, 200.0, 5000.0, MS, None),
    ]);
    // Towers: on, Eisbär at the bottom, Panda in the middle, Grizzly on top; every level stands on the back below (from
    // the model), stackFit corrects each level by hand
    let level = |id: &str| SettingValue::Text(id.to_owned());
    fields.extend(minime_stack_fields(
        &variants(),
        &[
            ("minimeStack", SettingValue::Flag(true)),
            ("minimeStackLevel1", level("eisbaer")),
            ("minimeStackLevel2", level("panda")),
            ("minimeStackLevel3", level("grizzly")),
        ],
    ));
    fields.extend(vec![
        number("stackFit", "Turm: Feinkorrektur je Stufe", MINIME_LOOK, 0.0, -60.0, 60.0, PX, None),
        number("stackSway", "Turm: Wanken (Grad)", MINIME_LOOK, 2.0, 0.0, 10.0, None, None),
        number("stackSwayMs", "Turm: Wanken (Dauer)", MINIME_LOOK, 2400.0, 500.0, 10_000.0, MS, None),
        number("stackNameOffset", "Turm: Namen seitlich versetzt", MINIME_LOOK, 40.0, 0.0, 300.0, PX, None),
        number("minimeOutlineWidth", "Kontur: Stärke", MINIME_LOOK, 4.5, 0.0, 20.0, None, Some(0.5)),
    ]);
    fields
}

fn fields() -> Vec<SettingField> {
    let mut fields = Vec::new();
    fields.extend(vec![
        text("channelName", "Kanal-Name", GENERAL, "Bärenbande", Some(40)),
        font("font", "Schrift", GENERAL, "Nunito", &["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]),
        font("titleFont", "Titelschrift", GENERAL, "Sniglet", &["Sniglet", "Fredoka", "Baloo 2", "Nunito"]),
        number("fontSize", "Schriftgrösse", GENERAL, 24.0, 10.0, 60.0, PX, None),
        color("outline", "Kontur", GENERAL, "#1c1a19"),
        number("outlineWidth", "Kontur: Stärke", GENERAL, 4.5, 0.0, 20.0, None, Some(0.5)),
        color("textColor", "Text hell", GENERAL, "#ffffff"),
        color("textDark", "Text auf Papier", GENERAL, "#2b2522"),
        color("textDim", "Text gedämpft", GENERAL, "#6b5d55"),
        color("paper", "Papier (Karten, Schilder)", GENERAL, "#fbf3e0"),
        color("paperShade", "Papier: Schattenton", GENERAL, "#e9dcc0"),
        color("accent", "Akzent (Ziegelrot)", GENERAL, "#e2573f"),
        color("accentText", "Akzent für Text", GENERAL, "#b83c28"),
        color("accent2", "Akzent 2 (Himmelblau)", GENERAL, "#4d9de0"),
        number("radius", "Eckenradius", GENERAL, 22.0, 0.0, 60.0, PX, None),
        number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500.0, 0.0, 3000.0, MS, None),
        choice(
            "locale",
            "Uhrzeit-Format",
            GENERAL,
            "de-DE",
            &["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"],
        ),
        choice("facing", "Blickrichtung der Bären", GENERAL, "links", &["links", "rechts"]),
        color("iceFur", "Eisbär: Fell", BEARS, "#ffffff"),
        color("iceShade", "Eisbär: Schattenton", BEARS, "#d5dcda"),
        color("grizzlyFur", "Grizzly: Fell", BEARS, "#96693f"),
        color("grizzlyShade", "Grizzly: Schattenton", BEARS, "#7d5533"),
        color("pandaFur", "Panda: weisses Fell", BEARS, "#f3eeeb"),
        color("pandaShade", "Panda: Schattenton auf Weiss", BEARS, "#d9d2ce"),
        color("pandaPatch", "Panda: schwarzes Fell", BEARS, "#64615c"),
        color("pandaPatchShade", "Panda: Schattenton auf Schwarz", BEARS, "#4e4b47"),
        color("bearEye", "Augen", BEARS, "#111111"),
        color("bearNose", "Nase", BEARS, "#111111"),
        color("grizzlyMouth", "Grizzly: Mund innen", BEARS, "#6b3833"),
        color("grizzlyTongue", "Grizzly: Zunge", BEARS, "#e0868a"),
        color("bearTeeth", "Zähne", BEARS, "#ffffff"),
        color("phoneCase", "Handy: Hülle", BEARS, "#f4a493"),
        color("phoneScreen", "Handy: Bildschirm", BEARS, "#2d2926"),
        color("prop", "Pfanne und Geräte", BEARS, "#4a4542"),
        color("food", "Essen in der Pfanne", BEARS, "#f6c945"),
        number("blinkEvery", "Blinzeln alle (0 = nie)", BEARS, 5000.0, 0.0, 30000.0, MS, None),
        flag("breathe", "Atmen", BEARS, true),
        number("breatheMs", "Atmen: Dauer eines Atemzugs", BEARS, 3600.0, 1000.0, 10000.0, MS, None),
        number("towerSway", "Bärenturm: Wanken (Grad)", BEARS, 2.0, 0.0, 10.0, None, None),
        number("towerSwayMs", "Bärenturm: Wanken (Dauer)", BEARS, 2400.0, 500.0, 10000.0, MS, None),
        in_scene(
            SceneName::Starting,
            choice("timeStarting", "Tageszeit Starting", WORLD, "morgen", &["morgen", "mittag", "abend", "nacht"]),
        ),
        in_scene(
            SceneName::Brb,
            choice("timeBrb", "Tageszeit BRB", WORLD, "mittag", &["morgen", "mittag", "abend", "nacht"]),
        ),
        in_scene(
            SceneName::Ending,
            choice("timeEnding", "Tageszeit Ending", WORLD, "abend", &["morgen", "mittag", "abend", "nacht"]),
        ),
        color("skyMorningTop", "Himmel Morgen oben", WORLD, "#f6b38a"),
        color("skyMorningBottom", "Himmel Morgen unten", WORLD, "#fde4c6"),
        color("skyDayTop", "Himmel Mittag oben", WORLD, "#7fc3e8"),
        color("skyDayBottom", "Himmel Mittag unten", WORLD, "#cfe9f5"),
        color("skyEveningTop", "Himmel Abend oben", WORLD, "#e8846a"),
        color("skyEveningBottom", "Himmel Abend unten", WORLD, "#f7c99a"),
        color("skyNightTop", "Himmel Nacht oben", WORLD, "#1f2d4f"),
        color("skyNightBottom", "Himmel Nacht unten", WORLD, "#4a5a7c"),
        color("sun", "Sonne", WORLD, "#fff1b8"),
        color("moon", "Mond", WORLD, "#f4f0dc"),
        color("cloud", "Wolken", WORLD, "#ffffff"),
        number("cloudCount", "Anzahl Wolken", WORLD, 4.0, 0.0, 8.0, None, None),
        number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", WORLD, 140.0, 10.0, 600.0, S, None),
        color("meadow", "Wiese", WORLD, "#b9cf63"),
        color("meadowDark", "Wiese dunkel", WORLD, "#8fb24a"),
        color("fir", "Tannen", WORLD, "#5e8f6a"),
        color("firDark", "Tannen dunkel", WORLD, "#3f6b52"),
        color("treeLeaf", "Laubbäume", WORLD, "#7fae5a"),
        color("hills", "Hügel in der Ferne", WORLD, "#a9c7b9"),
        color("city", "Stadt", WORLD, "#d8dde3"),
        color("cityWindow", "Stadt: Fenster", WORLD, "#9fb0c0"),
        color("bridge", "Brücke", WORLD, "#d9573b"),
        color("water", "Wasser", WORLD, "#9cc9d9"),
        color("road", "Weg", WORLD, "#a3a5a6"),
        color("cave", "Höhlenhügel", WORLD, "#8b6352"),
        color("caveDark", "Höhleneingang", WORLD, "#4a3128"),
        color("wood", "Holz", WORLD, "#9a6a44"),
        color("flower", "Blumen", WORLD, "#fff7e8"),
        flag("flowers", "Blumen und Gras", WORLD, true),
        flag("showCity", "Stadt in der Ferne", WORLD, true),
        flag("showBridge", "Brücke in der Ferne", WORLD, true),
        flag("showCave", "Höhle", WORLD, true),
        number("paperGrain", "Aquarell: Papierstruktur", WORLD, 0.5, 0.0, 1.0, None, Some(0.05)),
        number("sketchLines", "Aquarell: Skizzenlinien", WORLD, 0.5, 0.0, 1.0, None, Some(0.05)),
        in_scene(
            SceneName::Starting,
            choice("bearStarting", "Starting: Bär", SCREENS, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        in_scene(
            SceneName::Brb,
            choice("bearBrb", "BRB: Bär", SCREENS, "eisbaer", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        in_scene(
            SceneName::Ending,
            choice("bearEnding", "Ending: Bär", SCREENS, "panda", &["eisbaer", "grizzly", "panda", "turm"]),
        ),
        number("bearSize", "Bär: Grösse (Höhe)", SCREENS, 520.0, 100.0, 1000.0, PX, None),
        choice("bearSide", "Bär: Seite", SCREENS, "links", &["links", "rechts"]),
        in_scene(
            SceneName::Starting,
            text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los", None),
        ),
        in_scene(SceneName::Starting, text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich", None)),
        in_scene(
            SceneName::Starting,
            text("startingNote", "Starting: Untertitel", SCREENS, "Die Bande sammelt sich noch.", None),
        ),
        in_scene(SceneName::Brb, text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause", None)),
        in_scene(SceneName::Brb, text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück", None)),
        in_scene(SceneName::Brb, text("brbNote", "BRB: Untertitel", SCREENS, "Hier wird gerade gekocht.", None)),
        in_scene(SceneName::Brb, text("brbSign", "BRB: Schild des Grizzly", SCREENS, "Gleich zurück!", Some(24))),
        in_scene(SceneName::Ending, text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen", None)),
        in_scene(SceneName::Ending, text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet", None)),
        in_scene(SceneName::Ending, text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Mal!", None)),
        number("signWidth", "Schild: Breite", SCREENS, 1000.0, 400.0, 1800.0, PX, None),
        number("titleSize", "Titelgrösse", SCREENS, 104.0, 30.0, 240.0, PX, None),
        in_scene(SceneName::Starting, number("countdown", "Countdown-Standard", SCREENS, 300.0, 0.0, 86400.0, S, None)),
        in_scene(SceneName::Starting, text("countdownPrefix", "Countdown-Präfix", SCREENS, "", None)),
        in_scene(SceneName::Starting, text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!", None)),
        in_scene(
            SceneName::Starting,
            choice("progressStyle", "Fortschritt", SCREENS, "weg", &["weg", "balken", "aus"]),
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
                    "Snacks werden verteilt ...",
                    "Das Handy wird aufgeladen ...",
                    "Die Höhle wird aufgeräumt ...",
                    "Die Begrüssung wird geübt ...",
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
                &["Es wird etwas Feines gekocht ...", "Kurz die Höhle fegen ...", "Nachrichten werden gecheckt ..."],
                None,
            ),
        ),
        in_scene(
            SceneName::Ending,
            lines(
                "endingLines",
                "Sprüche Ending",
                SCREENS,
                &["Die Bande winkt zum Abschied ...", "Zeit für ein Nickerchen in der Höhle ...", "Bis bald!"],
                None,
            ),
        ),
        number("linesEvery", "Sprüche wechseln alle", SCREENS, 6.0, 2.0, 120.0, S, None),
        text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", Some(300)),
        number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30.0, 5.0, 300.0, S, None),
        choice("powerOn", "Einschalten", SCREENS, "aquarell", &["aquarell", "blenden", "keins"]),
        number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1600.0, 0.0, 10000.0, MS, None),
        choice("bearAlerts", "Bär", ALERTS, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        number("alertBearSize", "Bär: Grösse (Höhe)", ALERTS, 300.0, 80.0, 800.0, PX, None),
        text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower", None),
        text("followLine", "Follow: Zeile", ALERTS, "{user} gehört jetzt zur Bande!", None),
        choice(
            "followIcon",
            "Follow: Symbol",
            ALERTS,
            "pfote",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo", None),
        text("subLine", "Sub: Zeile", ALERTS, "{user} zieht mit in die Höhle!", None),
        choice(
            "subIcon",
            "Sub: Symbol",
            ALERTS,
            "herz",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten dabei!", None),
        choice(
            "resubIcon",
            "Resub: Symbol",
            ALERTS,
            "honig",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt", None),
        text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!", None),
        choice(
            "giftIcon",
            "Gift: Symbol",
            ALERTS,
            "stern",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid", None),
        text("raidLine", "Raid: Zeile", ALERTS, "{user} kommt mit {amount} Gästen zu Besuch!", None),
        choice(
            "raidIcon",
            "Raid: Symbol",
            ALERTS,
            "blatt",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "{user} spendiert {amount} Bits für Snacks!", None),
        choice(
            "cheerIcon",
            "Bits: Symbol",
            ALERTS,
            "fisch",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein.", None),
        choice(
            "redeemIcon",
            "Kanalpunkte: Symbol",
            ALERTS,
            "handy",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rollt los!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
        choice(
            "hypeIcon",
            "Hype Train: Symbol",
            ALERTS,
            "muetze",
            &["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"],
        ),
        flag("alertQuote", "Nachricht zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\"", None),
        number("alertDuration", "Dauer", ALERTS, 7000.0, 2000.0, 60000.0, MS, None),
        number("alertScale", "Grösse", ALERTS, 1.0, 0.3, 2.0, None, Some(0.05)),
        number("alertTop", "Abstand oben", ALERTS, 80.0, 0.0, 1000.0, PX, None),
        choice("alertAlign", "Position", ALERTS, "center", &["left", "center", "right"]),
        number("alertWidth", "Breite", ALERTS, 760.0, 300.0, 1800.0, PX, None),
        choice("alertIn", "Einblenden", ALERTS, "plopp", &["watscheln", "plopp", "gleiten", "blenden", "keins"]),
        choice("alertOut", "Ausblenden", ALERTS, "blenden", &["watscheln", "plopp", "gleiten", "blenden", "keins"]),
        flag("alertTimer", "Restzeit als Balken", ALERTS, true),
        flag("confetti", "Konfetti aus Pfoten und Blättern", ALERTS, true),
        number("confettiCount", "Anzahl Konfetti", ALERTS, 14.0, 0.0, 40.0, None, None),
        flag("alertSound", "Töne", ALERTS, true),
    ]);
    fields.extend(alert_sound_fields(ALERTS));
    fields.extend(vec![
        choice("bearChat", "Bär", CHAT, "panda", &["eisbaer", "grizzly", "panda"]),
        choice("chatStyle", "Stil", CHAT, "handy", &["handy", "zettel", "blasen"]),
    ]);
    fields.extend(badge_fields(CHAT));
    fields.extend(vec![
        flag("chatBadges", "Badges zeigen", CHAT, true),
        number("chatFontSize", "Schriftgrösse", CHAT, 20.0, 8.0, 60.0, PX, None),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatMax", "Max. Nachrichten", CHAT, 8.0, 1.0, 100.0, None, None),
        choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", &["bottom", "top"]),
        number("chatGap", "Abstand", CHAT, 10.0, 0.0, 40.0, PX, None),
        number("chatBearSize", "Bär: Grösse (Höhe)", CHAT, 240.0, 60.0, 800.0, PX, None),
        number("chatPhoneWidth", "Handy: Breite", CHAT, 440.0, 200.0, 1200.0, PX, None),
        choice("bearCam", "Bär", CAM, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        choice("camStyle", "Rahmen", CAM, "papier", &["papier", "holz", "polaroid"]),
        choice("camBearSpot", "Bär: Platz", CAM, "rechts", &["links", "rechts", "oben"]),
        number("camBearSize", "Bär: Grösse (Höhe)", CAM, 260.0, 60.0, 800.0, PX, None),
        number("camFrameWidth", "Rahmenbreite", CAM, 18.0, 2.0, 60.0, PX, None),
        number("camRadius", "Eckenradius", CAM, 22.0, 0.0, 80.0, PX, None),
        text("camLabel", "Namensschild ({channel})", CAM, "{channel}", None),
        flag("camLive", "Live-Anzeige", CAM, true),
        text("camLiveText", "Live-Text", CAM, "LIVE", None),
        choice("bearMusic", "Bär", MUSIC, "panda", &["eisbaer", "grizzly", "panda", "turm"]),
        choice("musicStyle", "Stil", MUSIC, "kopfhoerer", &["kopfhoerer", "kofferradio", "schlicht"]),
        text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Läuft gerade", None),
        text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause", None),
        text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik", None),
        text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Vogelgezwitscher", None),
        flag("musicAlbum", "Album zeigen", MUSIC, false),
        flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
        flag("equalizer", "Equalizer", MUSIC, true),
        number("equalizerBars", "Equalizer: Balken", MUSIC, 7.0, 1.0, 16.0, None, None),
        choice("coverShape", "Cover-Form", MUSIC, "eckig", &["rund", "eckig"]),
        number("coverSize", "Cover-Grösse", MUSIC, 120.0, 40.0, 400.0, PX, None),
        number("musicTitleSize", "Titelgrösse", MUSIC, 26.0, 10.0, 80.0, PX, None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
        number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40.0, 5.0, 400.0, None, None),
        number("musicBearSize", "Bär: Grösse (Höhe)", MUSIC, 220.0, 60.0, 800.0, PX, None),
        number("bopStrength", "Bär: Wippen im Takt (Grad)", MUSIC, 4.0, 0.0, 20.0, None, None),
        choice("bearFx", "Bär", FX, "grizzly", &["eisbaer", "grizzly", "panda"]),
        choice("fxStyle", "Text", FX, "schild", &["schild", "blase"]),
        number("fxBearSize", "Bär: Grösse (Höhe)", FX, 240.0, 60.0, 800.0, PX, None),
        number("fxDuration", "Standarddauer", FX, 4.0, 0.5, 120.0, S, Some(0.5)),
        number("fxSize", "Standardgrösse", FX, 360.0, 20.0, 1920.0, PX, None),
        number("fxTextSize", "Textgrösse", FX, 40.0, 8.0, 300.0, PX, None),
        number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20.0, 0.0, 50.0, PERCENT, None),
        number("fxMax", "Max. gleichzeitig", FX, 8.0, 1.0, 30.0, None, None),
        choice("fxIn", "Einblenden", FX, "plopp", &["watscheln", "plopp", "gleiten", "blenden", "keins"]),
        choice("fxOut", "Ausblenden", FX, "blenden", &["watscheln", "plopp", "gleiten", "blenden", "keins"]),
        choice("stingerBear", "Bär", STINGER, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5.0, S, Some(0.05)),
        text("stingerText", "Text ({channel})", STINGER, "{channel}", None),
        number("stingerWaddle", "Watscheln (Grad)", STINGER, 6.0, 0.0, 20.0, None, None),
        choice("bannerProfileBear", "Profilbanner: Bär", BANNER, "turm", &["eisbaer", "grizzly", "panda", "turm"]),
        choice("bannerOfflineBear", "Offline-Banner: Bär", BANNER, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", None),
        text("bannerProfileText", "Profilbanner: Text", BANNER, "Gemütliche Streams mit der Bande", None),
        text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Gerade nicht live", None),
        text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Die Bande macht ein Nickerchen in der Höhle.", None),
        lines(
            "bannerOfflineLines",
            "Offline-Banner: Zeilen",
            BANNER,
            &["Bald wieder live", "Folgen nicht vergessen"],
            None,
        ),
        flag("fairyLights", "Offline-Banner: Lichterkette", BANNER, true),
        text("bannerSleepText", "Offline-Banner: Schlafzeichen", BANNER, "z", Some(4)),
        number("bannerLoop", "Schleifenlänge", BANNER, 6.0, 1.0, 20.0, S, None),
        number("bannerProfileFps", "Profilbanner: Bildrate", BANNER, 12.0, 1.0, 30.0, None, None),
        number("bannerOfflineFps", "Offline-Banner: Bildrate", BANNER, 10.0, 1.0, 30.0, None, None),
    ]);
    fields.extend(minime_fields());
    fields.extend(info_fields());
    fields.extend(vec![
        choice("bearInfo", "Befehlsseite: Bär", INFO_GROUP, "grizzly", &["eisbaer", "grizzly", "panda", "turm"]),
        choice("timeInfo", "Befehlsseite: Tageszeit", INFO_GROUP, "mittag", &["morgen", "mittag", "abend", "nacht"]),
    ]);
    fields.extend(minime_variant_fields(&variants()));
    fields
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    use SceneName::{Alerts, Brb, Cam, Chat, Ending, Fx, Info, Minimes, Music, Starting};
    [
        (WORLD, vec![Starting, Brb, Ending, Info]),
        (SCREENS, vec![Starting, Brb, Ending]),
        (ALERTS, vec![Alerts]),
        (CHAT, vec![Chat]),
        (CAM, vec![Cam]),
        (MUSIC, vec![Music]),
        (FX, vec![Fx]),
        (STINGER, vec![]),
        (BANNER, vec![]),
        (MINIME_COMMANDS, vec![Minimes]),
        (MINIME_RULES, vec![Minimes]),
        (MINIME_MOTION, vec![Minimes]),
        (MINIME_VARIANTS, vec![Minimes]),
        (MINIME_STACK, vec![Minimes]),
        (MINIME_LOOK, vec![Minimes]),
        (MINIME_MOVES, vec![Minimes]),
        (INFO_GROUP, vec![Info]),
    ]
    .into_iter()
    .map(|(group, scenes)| (group.to_owned(), scenes))
    .collect()
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

#[must_use]
pub fn bears() -> Theme {
    let schema = ThemeSchema {
        id: "bears".to_owned(),
        name: "Bärenbande".to_owned(),
        fields: fields(),
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
        assert_same_as_fixture(&bears(), include_str!("../../tests/fixtures/bears.json"));
    }

    #[test]
    fn personalize_sets_channel() {
        let values = personalize(&Login::parse("neo_42").expect("valid login"));
        assert_eq!(values.get("channelName"), Some(&SettingValue::Text("Neo_42".to_owned())));
    }
}
