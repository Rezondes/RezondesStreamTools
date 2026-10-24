//! Settings schema of the Dogs theme: pixel art dogs on a sunny meadow (template: `src/themes/dogs/settings.ts`).
//! Labels, groups and defaults are the German UI texts and stay equal to the TypeScript schema (fixture test). The
//! coat fields come from one table of the 18 variants, like `coatFields` in TypeScript.

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, SoundValue, Unit, choice, choice_by, color, flag, font, in_scene, lines,
    mark_basic, number, sound, text, with_defaults,
};
use crate::themes::core_fields::{alert_sound_fields, badge_fields};
use crate::themes::graphics_fields::quality_field;
use crate::themes::info_fields::{INFO_GROUP, info_fields};
use crate::themes::minime_fields::{
    MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minime_base_fields, minime_variant_fields,
};
use crate::themes::registry::Theme;
use crate::themes::schema::{MinimeVariantInfo, MinimeVariantSet, SceneName, ThemeSchema};
use crate::themes::stinger_fields::with_stinger_fields;

const FONTS: [&str; 3] = ["Pixelify Sans", "VT323", "Silkscreen"];
const BARK_VOICES: [&str; 3] = ["klein", "mittel", "gross"];

const GENERAL: &str = "Allgemein";
const DOG: &str = "Hund";
const SOUNDS: &str = "Töne";
const WORLD: &str = "Welt";
const STARTING: &str = "Starting";
const BRB: &str = "BRB";
const ENDING: &str = "Ending";
const ALERTS: &str = "Alerts";
const RAID: &str = "Raid";
const TOYS: [&str; 4] = ["ball", "knochen", "frisbee", "leckerli"];
const STINGER: &str = "Stinger";
const BANNER: &str = "Banner";
const MINIME_DOGS: &str = "Minimes: Hunde";
const MINIME_SOUNDS: &str = "Minimes: Töne";
const CHAT: &str = "Chat";
const CAM: &str = "Kamera-Rahmen";
const MUSIC: &str = "Musik";
const FX: &str = "Effekte";
const CHAT_STYLES: [&str; 3] = ["hund", "schilder", "schlicht"];
const MUSIC_STYLES: [&str; 3] = ["hund", "schild", "schlicht"];
const INFO_BACKGROUNDS: [&str; 2] = ["wiese", "creme"];

const PX: Option<Unit> = Some(Unit::Px);
const PERCENT: Option<Unit> = Some(Unit::Percent);
const S: Option<Unit> = Some(Unit::S);
const MS: Option<Unit> = Some(Unit::Ms);

/// The breeds with their names, in the order of the row in the Starting scene (template: `BREEDS` in `breeds.ts`)
const BREEDS: [(&str, &str); 6] = [
    ("corgi", "Corgi"),
    ("shiba", "Shiba"),
    ("labrador", "Labrador"),
    ("dalmatiner", "Dalmatiner"),
    ("dackel", "Dackel"),
    ("mops", "Mops"),
];

/// Per coat variant: breed, id, name and the colors base, mark, dark, nose (template: `COATS` and `COAT_COLORS`)
const COATS: [(&str, &str, &str, [&str; 4]); 18] = [
    ("corgi", "rotweiss", "Rot-Weiss", ["#cc7633", "#fbf6ee", "#a85a22", "#1d1715"]),
    ("corgi", "zobel", "Zobel-Weiss", ["#bd7a3c", "#fbf6ee", "#4e3322", "#1d1715"]),
    ("corgi", "tricolor", "Tricolor", ["#c27c40", "#fbf6ee", "#1f1b1a", "#111111"]),
    ("shiba", "rot", "Rot", ["#c9763a", "#f6e8d2", "#a85c27", "#1d1715"]),
    ("shiba", "sesam", "Sesam", ["#c27a42", "#f4e5cf", "#3a2a20", "#1d1715"]),
    ("shiba", "schwarzloh", "Schwarz-Loh", ["#231d1a", "#f3e3cc", "#c18750", "#111111"]),
    ("shiba", "creme", "Creme", ["#ead6b4", "#fbf3e5", "#d7bd94", "#2a1d18"]),
    ("labrador", "gelb", "Gelb", ["#e3bf86", "#f2dcb4", "#c99a5e", "#2a1d18"]),
    ("labrador", "schwarz", "Schwarz", ["#1e1b1a", "#2a2523", "#141212", "#111111"]),
    ("labrador", "braun", "Schokobraun", ["#6a3f27", "#7a4b31", "#4a2a19", "#3d2419"]),
    ("dalmatiner", "schwarz", "Schwarz getupft", ["#f8f4ee", "#ffffff", "#1e1b1a", "#111111"]),
    ("dalmatiner", "leber", "Leberbraun getupft", ["#f8f4ee", "#ffffff", "#6b3a22", "#5a3020"]),
    ("dackel", "rot", "Rot", ["#b4602f", "#c2743f", "#7f3e1c", "#1d1715"]),
    ("dackel", "schwarzrot", "Schwarz-Rot", ["#1f1917", "#b5683a", "#141110", "#111111"]),
    ("dackel", "schokorot", "Schoko-Rot", ["#55301f", "#c07a45", "#3a2015", "#3a2218"]),
    ("mops", "beige", "Beige", ["#d9bb8b", "#e6cda2", "#231c19", "#111111"]),
    ("mops", "apricot", "Apricot", ["#d49b5d", "#e0b07a", "#251c16", "#111111"]),
    ("mops", "schwarz", "Schwarz", ["#1e1b1a", "#4a423d", "#141212", "#0a0a0a"]),
];
const COAT_PARTS: [(&str, &str); 4] =
    [("Base", "Grundfarbe"), ("Mark", "Abzeichen"), ("Dark", "dunkel"), ("Nose", "Nase")];

fn breed_name(id: &str) -> &'static str {
    BREEDS.iter().find(|(breed, _)| *breed == id).map_or("", |(_, name)| name)
}

/// Settings key of a coat color, e.g. `corgiRotweissBase` (template: `coatKey` in `coats.ts`)
fn coat_key(breed: &str, id: &str, part: &str) -> String {
    let mut chars = id.chars();
    let capital = chars.next().map(|first| first.to_uppercase().chain(chars).collect::<String>()).unwrap_or_default();
    format!("{breed}{capital}{part}")
}

/// The four color fields of every coat variant, in the group of its breed
fn coat_fields() -> Vec<SettingField> {
    COATS
        .iter()
        .flat_map(|(breed, id, name, colors)| {
            let group = format!("Fell: {}", breed_name(breed));
            COAT_PARTS.iter().zip(colors).map(move |((part, label), value)| {
                color(&coat_key(breed, id, part), &format!("{name}: {label}"), &group, value)
            })
        })
        .collect()
}

/// The coat ids of all breeds, each once, in table order
/// The coat ids per breed in the order of the table (the coat choice offers only those of the chosen breed)
fn coats_by_breed() -> Vec<(&'static str, Vec<&'static str>)> {
    BREEDS
        .iter()
        .map(|(breed, _)| (*breed, COATS.iter().filter(|coat| coat.0 == *breed).map(|coat| coat.1).collect()))
        .collect()
}

fn general() -> Vec<SettingField> {
    vec![
        text("channelName", "Kanalname ({channel})", GENERAL, "RUDEL-STREAM", Some(40)),
        font("font", "Schrift", GENERAL, "Pixelify Sans", &FONTS),
        number("fontSize", "Schriftgrösse", GENERAL, 26.0, 10.0, 60.0, PX, None),
        number("titleSize", "Titel: Grösse", GENERAL, 100.0, 40.0, 200.0, PX, None),
        color("cream", "Schild", GENERAL, "#fff6e6"),
        color("edge", "Schild: Kante unten", GENERAL, "#e9d2bd"),
        color("ink", "Tinte (Kontur)", GENERAL, "#2e1d14"),
        color("textColor", "Text", GENERAL, "#4a3426"),
        color("muted", "Text gedämpft", GENERAL, "#7a5a46"),
        color("accent", "Signatur (Halsband-Rot)", GENERAL, "#c24535"),
        color("onAccent", "Schrift auf der Signatur", GENERAL, "#fff6e6"),
        color("ball", "Ball-Gelb", GENERAL, "#ffd23f"),
        color("light", "Licht (Augen, Wolken, Zaun)", GENERAL, "#ffffff"),
        number("boxShadow", "Schatten der Schilder", GENERAL, 28.0, 0.0, 100.0, PERCENT, None),
        quality_field(GENERAL),
        number("pixelScale", "Pixelgrösse", GENERAL, 5.0, 3.0, 8.0, PX, None),
    ]
}

fn bark_voice(id: &str) -> &'static str {
    match id {
        "labrador" | "dalmatiner" => "gross",
        "shiba" => "mittel",
        _ => "klein",
    }
}

fn dog() -> Vec<SettingField> {
    let breeds: Vec<&str> = BREEDS.iter().map(|(id, _)| *id).collect();
    let mut fields = vec![
        choice("dog", "Hund des Streamers: Rasse", DOG, "corgi", &breeds),
        {
            let by = coats_by_breed();
            let by: Vec<(&str, &[&str])> = by.iter().map(|(breed, coats)| (*breed, coats.as_slice())).collect();
            choice_by("coat", "Hund des Streamers: Fell (passend zur Rasse)", DOG, "rotweiss", "dog", &by)
        },
        text("dogName", "Name des Hundes ({dog})", DOG, "Bello", Some(30)),
        color("dogEye", "Augen", DOG, "#1d1412"),
        color("dogTongue", "Zunge und Ohren innen", DOG, "#e98a95"),
        number("blinkEvery", "Blinzeln: alle (0 = nie)", DOG, 3.3, 0.0, 30.0, S, Some(0.1)),
        number("wagSpeed", "Wedeln: Tempo", DOG, 10.0, 0.0, 30.0, None, Some(0.5)),
        number("walkFps", "Laufen: Bilder pro Sekunde", DOG, 9.0, 2.0, 30.0, None, None),
        flag("pant", "Hecheln", DOG, true),
    ];
    for (id, name) in BREEDS {
        fields.push(choice(
            &format!("barkVoice_{id}"),
            &format!("Bellstimme: {name}"),
            DOG,
            bark_voice(id),
            &BARK_VOICES,
        ));
    }
    fields
}

fn volume(value: f64) -> SettingValue {
    SettingValue::Sound(SoundValue { file: String::new(), volume: value })
}

fn sounds() -> Vec<SettingField> {
    let mut fields = vec![number("soundMaxVoices", "Töne gleichzeitig höchstens", SOUNDS, 8.0, 1.0, 32.0, None, None)];
    fields.extend(with_defaults(
        vec![
            sound("soundStartingLand", "Starting: Hund landet", SOUNDS),
            sound("soundStartingHop", "Starting: Marker hüpft", SOUNDS),
            sound("soundStartingChosen", "Starting: Hund gewählt", SOUNDS),
            sound("soundStartingCard", "Starting: Karte", SOUNDS),
            sound("soundBark", "Bellen", SOUNDS),
            sound("soundBrbSniff", "BRB: Schnüffeln", SOUNDS),
            sound("soundBrbSteps", "BRB: Schritte", SOUNDS),
            sound("soundEndingLie", "Ending: Hinlegen", SOUNDS),
            sound("soundEndingLamp", "Ending: Lampe", SOUNDS),
            sound("soundEndingSnore", "Ending: Schnarchen", SOUNDS),
        ],
        &[
            ("soundStartingLand", volume(0.4)),
            ("soundStartingHop", volume(0.4)),
            ("soundStartingChosen", volume(0.6)),
            ("soundStartingCard", volume(0.5)),
            ("soundBark", volume(0.7)),
            ("soundBrbSniff", volume(0.0)),
            ("soundBrbSteps", volume(0.0)),
            ("soundEndingLie", volume(0.5)),
            ("soundEndingLamp", volume(0.4)),
            ("soundEndingSnore", volume(0.3)),
        ],
    ));
    fields.push(flag("startingBarkSound", "Starting: Hunde bellen hörbar", SOUNDS, true));
    fields.push(number("snoreEvery", "Ending: Schnarchen alle", SOUNDS, 4.0, 1.0, 60.0, S, Some(0.5)));
    fields
}

fn coats() -> Vec<SettingField> {
    let mut fields = coat_fields();
    fields.push(number(
        "dalmatinerSpots",
        "Dalmatiner: Anteil der Flecken",
        "Fell: Dalmatiner",
        42.0,
        0.0,
        100.0,
        PERCENT,
        None,
    ));
    fields.push(number(
        "spotSeed",
        "Dalmatiner: Startwert der Flecken",
        "Fell: Dalmatiner",
        1.0,
        1.0,
        9999.0,
        None,
        None,
    ));
    fields
}

fn world() -> Vec<SettingField> {
    vec![
        color("sky", "Himmel oben", WORLD, "#9fd6ff"),
        color("skyLow", "Himmel unten", WORLD, "#e3f5ff"),
        color("grass", "Wiese", WORLD, "#86c45f"),
        color("grassLight", "Wiese: Oberkante", WORLD, "#a3d97a"),
        color("hillColor1", "Hügel links", WORLD, "#93d26e"),
        color("hillColor2", "Hügel rechts", WORLD, "#86c862"),
        color("hillColor3", "Hügel Mitte", WORLD, "#7cbf5a"),
        color("treeTrunk", "Baumstamm", WORLD, "#a8754a"),
        color("treeLeaf", "Baumkrone", WORLD, "#6fbf5a"),
        color("appleColor", "Äpfel", WORLD, "#f25c54"),
        flag("fence", "Zaun", WORLD, true),
        number("clouds", "Wolken", WORLD, 6.0, 0.0, 20.0, None, None),
        number("cloudSpeed", "Wolken: Tempo", WORLD, 4.0, 0.0, 60.0, None, Some(0.5)),
        flag("trees", "Bäume", WORLD, true),
        number("flowers", "Blumen und Grasbüschel", WORLD, 56.0, 0.0, 300.0, None, None),
        color("flowerColor1", "Blumen: Farbe 1", WORLD, "#ffffff"),
        color("flowerColor2", "Blumen: Farbe 2", WORLD, "#ffd23f"),
        color("flowerColor3", "Blumen: Farbe 3", WORLD, "#f7a6c1"),
        color("flowerColor4", "Blumen: Farbe 4", WORLD, "#c9b6ff"),
    ]
}

fn starting() -> Vec<SettingField> {
    let mut fields = vec![
        text("startingPill", "Pille oben ({channel})", STARTING, "{channel}", Some(40)),
        text("startingTitle", "Titel", STARTING, "Gleich geht's los!", Some(60)),
        text("startingSubtitle", "Unterzeile", STARTING, "Wer begleitet uns heute?", Some(80)),
        number("countdown", "Countdown: Dauer", STARTING, 300.0, 0.0, 86400.0, S, None),
        text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", Some(5)),
        text("countdownLabel", "Countdown: Beschriftung", STARTING, "LOS GEHT'S IN", Some(40)),
        text("cardLabel", "Karte: Überzeile", STARTING, "HEUTE AN MEINER SEITE", Some(40)),
        text("cardBreed", "Karte: Rasse ({breed}, {coat})", STARTING, "{breed} · {coat}", Some(60)),
        text("bark", "Sprechblase", STARTING, "Wuff!", Some(20)),
    ];
    let cushions = ["#bfe8d4", "#d8ccff", "#ffd2b8", "#bfe0ff", "#fff0a8", "#ffc9d9"];
    for (index, value) in cushions.iter().enumerate() {
        fields.push(color(&format!("cushionColor{}", index + 1), &format!("Kissen {}", index + 1), STARTING, value));
    }
    fields.extend([
        color("rugColor", "Teppich", STARTING, "#c24535"),
        number("dropEvery", "Hunde fallen: Abstand", STARTING, 0.2, 0.0, 2.0, S, Some(0.05)),
        number("markerStart", "Marker startet nach", STARTING, 2.6, 0.0, 20.0, S, Some(0.1)),
        number("markerHop", "Marker: Dauer je Sprung", STARTING, 0.45, 0.1, 3.0, S, Some(0.05)),
        number("hearts", "Herzen", STARTING, 7.0, 0.0, 30.0, None, None),
        number("walkSpeed", "Lauf zum Teppich: Tempo", STARTING, 48.0, 5.0, 300.0, None, None),
        number("barkEvery", "Bellen: alle", STARTING, 7.0, 1.0, 120.0, S, Some(0.5)),
        flag("labels", "Etiketten unter den Kissen", STARTING, true),
        text("ticker", "Laufband (leer = aus)", STARTING, "", Some(300)),
        number("tickerSpeed", "Laufband: Tempo (px pro Sekunde)", STARTING, 90.0, 10.0, 400.0, None, None),
    ]);
    fields.into_iter().map(|field| in_scene(SceneName::Starting, field)).collect()
}

fn brb() -> Vec<SettingField> {
    let fields = vec![
        text("brbPill", "Pille", BRB, "GASSI-PAUSE", Some(40)),
        text("brbTitle", "Titel", BRB, "Bin gleich zurück!", Some(60)),
        text("brbSubtitle", "Unterzeile ({dog})", BRB, "{dog} und ich drehen eine Runde.", Some(80)),
        text("brbPauseLabel", "Pausenzeit: Beschriftung", BRB, "PAUSE SEIT", Some(40)),
        text("brbStepsLabel", "Schritte: Beschriftung", BRB, "SCHRITTE", Some(40)),
        text("brbSniff", "Sprechblase beim Schnüffeln", BRB, "Schnüff!", Some(20)),
        number("walkPxPerSecond", "Gehen: Tempo", BRB, 24.0, 1.0, 200.0, None, None),
        number("walkPeriod", "Runde: Dauer bis zum nächsten Schnüffeln", BRB, 9.0, 3.0, 120.0, S, Some(0.5)),
        number("sniffSeconds", "Schnüffeln: Dauer", BRB, 2.0, 0.0, 30.0, S, Some(0.5)),
        number("stepPx", "Schritt: Länge (Pixel)", BRB, 3.0, 1.0, 50.0, None, None),
        flag("leash", "Leine", BRB, true),
        color("leashColor", "Leine: Farbe", BRB, "#c24535"),
        number("leashSag", "Leine: Durchhang beim Gehen (stehend doppelt)", BRB, 8.0, 0.0, 40.0, None, None),
        flag("butterfly", "Schmetterling", BRB, true),
        color("butterflyColor", "Schmetterling: Farbe", BRB, "#f7a6c1"),
        color("pathColor", "Weg", BRB, "#e3c49a"),
        flag("parallax", "Parallaxe (ferne Ebenen langsamer)", BRB, true),
    ];
    fields.into_iter().map(|field| in_scene(SceneName::Brb, field)).collect()
}

fn ending() -> Vec<SettingField> {
    let fields = vec![
        text("endingTitle", "Titel", ENDING, "Gute Nacht!", Some(60)),
        text("endingSubtitle", "Unterzeile ({dog})", ENDING, "Danke fürs Zuschauen. {dog} schläft schon.", Some(80)),
        text("endingBye", "Pille", ENDING, "Bis zum nächsten Mal!", Some(40)),
        text("endingCardLabel", "Karte: Überzeile", ENDING, "HEUTE IM RUDEL", Some(40)),
        lines(
            "endingStats",
            "Zahlen (Schlüssel|Text)",
            ENDING,
            &["follows|neue Follower", "subs|Abos", "raids|Raids"],
            Some(6),
        ),
        color("night", "Wand bei Nacht", ENDING, "#3b3a63"),
        color("nightSub", "Unterzeile auf der Wand", ENDING, "#f1dcc0"),
        color("windowSky", "Nachthimmel im Fenster", ENDING, "#1b2547"),
        color("floor", "Dielen", ENDING, "#7d5233"),
        color("rug", "Teppich", ENDING, "#8f6fc7"),
        color("lamp", "Lampe und Mond", ENDING, "#ffe9a8"),
        color("basket", "Körbchen", ENDING, "#c48a4f"),
        color("pillow", "Kissen im Körbchen", ENDING, "#ffc9d9"),
        number("stars", "Sterne im Fenster", ENDING, 16.0, 0.0, 60.0, None, None),
        flag("moon", "Mond", ENDING, true),
        number("lampDim", "Lampe: Helligkeit am Ende", ENDING, 35.0, 0.0, 100.0, PERCENT, None),
        number("lampDimFrom", "Lampe: dimmt ab", ENDING, 5.0, 0.0, 120.0, S, Some(0.5)),
        number("lampDimTo", "Lampe: gedimmt bei", ENDING, 7.5, 0.0, 120.0, S, Some(0.5)),
        flag("zzz", "Z beim Schlafen", ENDING, true),
        number("zzzEvery", "Z: Dauer je Aufstieg", ENDING, 1.8, 0.5, 10.0, S, Some(0.1)),
    ];
    fields.into_iter().map(|field| in_scene(SceneName::Ending, field)).collect()
}

fn alerts() -> Vec<SettingField> {
    let mut fields = vec![
        text("followTag", "Follow: Kopfzeile", ALERTS, "NEUER FOLLOWER", None),
        text("followLine", "Follow: Zeile", ALERTS, "gehört jetzt zum Rudel!", None),
        text("subTag", "Sub: Kopfzeile", ALERTS, "NEUES ABO", None),
        text("subLine", "Sub: Zeile", ALERTS, "ist jetzt Teil des Rudels!", None),
        text("resubTag", "Resub: Kopfzeile", ALERTS, "ABO x{amount}", None),
        text("resubLine", "Resub: Zeile", ALERTS, "seit {amount} Monaten im Rudel!", None),
        text("giftTag", "Gift: Kopfzeile", ALERTS, "ABOS VERSCHENKT", None),
        text("giftLine", "Gift: Zeile", ALERTS, "verschenkt {amount} Abos ans Rudel!", None),
        text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID", None),
        text("raidLine", "Raid: Zeile", ALERTS, "kommt mit {amount} Hunden vorbei!", None),
        text("raidLineOne", "Raid: Zeile bei einem Hund", ALERTS, "kommt mit einem Hund vorbei!", None),
        text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS", None),
        text("cheerLine", "Bits: Zeile", ALERTS, "Danke für die Frisbee-Runde!", None),
        text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "KANALPUNKTE", None),
        text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "löst {detail} ein!", None),
        text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN", None),
        text("hypeBeginLine", "Hype Train: Start", ALERTS, "Das ganze Rudel rennt los!", None),
        text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!", None),
        flag("alertQuote", "Nachricht statt Zeile zeigen", ALERTS, true),
        text("quoteFormat", "Nachricht ({text})", ALERTS, "„{text}“", None),
        number("alertDuration", "Dauer (ohne Raid)", ALERTS, 8.2, 6.0, 60.0, S, Some(0.1)),
        text("alertBark", "Sprechblase", ALERTS, "Wuff!", Some(20)),
        choice("toyFollow", "Spielzeug: Follow", ALERTS, "ball", &TOYS),
        choice("toySub", "Spielzeug: Sub und Resub", ALERTS, "knochen", &TOYS),
        choice("toyGift", "Spielzeug: Gift", ALERTS, "knochen", &TOYS),
        choice("toyRaid", "Spielzeug: Raid", ALERTS, "ball", &TOYS),
        choice("toyCheer", "Spielzeug: Bits", ALERTS, "frisbee", &TOYS),
        choice("toyRedeem", "Spielzeug: Kanalpunkte", ALERTS, "leckerli", &TOYS),
        choice("toyHype", "Spielzeug: Hype Train", ALERTS, "frisbee", &TOYS),
        color("toyBoneColor", "Knochen: Farbe", ALERTS, "#fff6e6"),
        color("toyFrisbeeColor", "Frisbee: Farbe", ALERTS, "#c24535"),
        color("toyTreatColor", "Leckerli: Farbe", ALERTS, "#a8754a"),
        number("dropBounce", "Spielzeug: Sprunghöhe", ALERTS, 14.0, 0.0, 60.0, None, None),
        number("cardTop", "Karte: Abstand von oben", ALERTS, 440.0, 0.0, 900.0, PX, None),
    ];
    fields.extend(with_defaults(
        vec![
            sound("soundAlertRun", "Eingebaut: Hereinrennen", ALERTS),
            sound("soundAlertToy", "Eingebaut: Spielzeug", ALERTS),
            sound("soundAlertCard", "Eingebaut: Karte", ALERTS),
            sound("soundAlertLeave", "Eingebaut: Hinausrennen", ALERTS),
        ],
        &[
            ("soundAlertRun", volume(0.5)),
            ("soundAlertToy", volume(0.5)),
            ("soundAlertCard", volume(0.5)),
            ("soundAlertLeave", volume(0.4)),
        ],
    ));
    fields.extend(with_defaults(alert_sound_fields(ALERTS), &[("soundRaid", volume(0.5))]));
    fields
}

fn raid() -> Vec<SettingField> {
    let mut fields = vec![
        flag("raidPack", "Ein Hund je Raider", RAID, true),
        number("raidMaxOnScreen", "Hunde gleichzeitig höchstens", RAID, 12.0, 1.0, 40.0, None, None),
        number("raidMaxDogs", "Hunde insgesamt höchstens", RAID, 300.0, 0.0, 1000.0, None, None),
        number("raidCrossMs", "Lauf durchs Bild: Dauer", RAID, 2400.0, 800.0, 10_000.0, MS, None),
        number("raidSpeedSpread", "Tempo: Streuung", RAID, 20.0, 0.0, 60.0, PERCENT, None),
        number("raidLanes", "Spuren", RAID, 4.0, 1.0, 8.0, None, None),
        number("raidLaneGap", "Abstand der Spuren", RAID, 3.0, 0.0, 10.0, None, None),
        number("raidBarkEvery", "Bellen beim Warten: alle", RAID, 5.0, 1.0, 60.0, S, Some(0.5)),
        number("raidSeed", "Startwert", RAID, 1.0, 1.0, 9999.0, None, None),
        number("raidBarkShare", "Anteil der Läufe, die beim Erscheinen bellen", RAID, 25.0, 0.0, 100.0, PERCENT, None),
    ];
    for (id, name) in BREEDS {
        fields.push(flag(&format!("raidBreed_{id}"), &format!("Rudel: {name}"), RAID, true));
    }
    fields
}

fn chat() -> Vec<SettingField> {
    let mut fields = vec![
        choice("chatStyle", "Darstellung", CHAT, "hund", &CHAT_STYLES),
        number("chatMax", "Max. Nachrichten", CHAT, 6.0, 1.0, 50.0, None, None),
        number("chatLifetime", "Ausblenden nach (0 = nie)", CHAT, 30.0, 0.0, 3600.0, S, None),
        number("chatWidth", "Breite", CHAT, 480.0, 200.0, 1900.0, PX, None),
        color("chatNameColor", "Farbe der Namen", CHAT, "#c24535"),
        number("emoteSize", "Emote-Grösse", CHAT, 28.0, 8.0, 120.0, PX, None),
        flag("chatBadges", "Badges zeigen", CHAT, true),
    ];
    fields.extend(badge_fields(CHAT));
    for (id, name) in BREEDS {
        fields.push(flag(&format!("chatBreed_{id}"), &format!("Hunde im Chat: {name}"), CHAT, true));
    }
    fields
}

fn cam_music_fx() -> Vec<SettingField> {
    vec![
        flag("camRoof", "Hundehütten-Dach", CAM, true),
        color("camRoofColor", "Dach: Farbe", CAM, "#c24535"),
        flag("camDog", "Hund an der Ecke", CAM, true),
        text("camLabel", "Namensschild ({channel}, {dog})", CAM, "{channel}", None),
        number("camBorder", "Rahmenstärke", CAM, 5.0, 0.0, 30.0, PX, None),
        choice("musicStyle", "Darstellung", MUSIC, "hund", &MUSIC_STYLES),
        text("musicLabel", "Überzeile", MUSIC, "JETZT LÄUFT", None),
        text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Gerade keine Musik", None),
        flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
        flag("musicCover", "Cover zeigen", MUSIC, true),
        flag("musicPaws", "Fortschritt als Pfotenspur", MUSIC, true),
        number("musicBob", "Hund wippt (pro Sekunde, 0 = still)", MUSIC, 2.0, 0.0, 6.0, None, Some(0.5)),
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

fn info() -> Vec<SettingField> {
    let mut fields = with_defaults(info_fields(), &[("infoTitle", SettingValue::Text("Befehle im Rudel".to_owned()))]);
    fields.push(choice("infoBackground", "Befehlsseite: Hintergrund", INFO_GROUP, "wiese", &INFO_BACKGROUNDS));
    fields.push(number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900.0, 400.0, 1600.0, PX, None));
    fields
}

fn clips() -> Vec<SettingField> {
    vec![
        number("stingerDuration", "Länge", STINGER, 2.4, 0.5, 5.0, S, Some(0.05)),
        number("stingerCut", "Übergangspunkt", STINGER, 1.2, 0.1, 5.0, S, Some(0.05)),
        number("stingerSweep", "Wischen: Dauer", STINGER, 0.82, 0.2, 3.0, S, Some(0.01)),
        number("stingerPawSpacing", "Pfoten: Abstand (Pixel)", STINGER, 30.0, 12.0, 80.0, None, None),
        number("stingerSlant", "Kante: Neigung", STINGER, 0.45, 0.0, 1.5, None, Some(0.05)),
        number("stingerStep", "Kante: Stufenhöhe (Pixel)", STINGER, 6.0, 1.0, 30.0, None, None),
        flag("stingerDog", "Hund läuft mit", STINGER, true),
        flag("stingerBadge", "Plakette am Übergang", STINGER, true),
        text("stingerText", "Name auf der Plakette ({dog}, {channel})", STINGER, "{dog}", Some(30)),
        color("stingerCover", "Fläche", STINGER, "#fff6e6"),
        text("bannerTitle", "Titel ({channel})", BANNER, "{channel}", Some(40)),
        text("bannerProfileText", "Profilbanner: Zeile", BANNER, "Willkommen im Rudel!", Some(80)),
        text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "OFFLINE", Some(40)),
        text("bannerOfflineText", "Offline-Banner: Zeile ({dog})", BANNER, "{dog} schläft. Bis bald!", Some(80)),
    ]
}

/// The six breeds as minime variants (template: `DOG_SET` in `src/themes/dogs/minimes.ts`)
fn variants() -> MinimeVariantSet {
    let names: [(&str, &[&str]); 6] = [
        ("corgi", &["corgi", "welsh"]),
        ("shiba", &["shiba", "inu"]),
        ("labrador", &["labrador", "lab"]),
        ("dalmatiner", &["dalmatiner", "dalmi"]),
        ("dackel", &["dackel", "dachshund"]),
        ("mops", &["mops", "pug"]),
    ];
    MinimeVariantSet {
        command: "!rasse".to_owned(),
        label: "Rasse".to_owned(),
        variants: names
            .iter()
            .map(|(id, chat)| MinimeVariantInfo {
                id: (*id).to_owned(),
                label: breed_name(id).to_owned(),
                names: chat.iter().map(|name| (*name).to_owned()).collect(),
                color: None,
            })
            .collect(),
    }
}

/// Minimes: core fields plus the look and the own actions of the dogs, and their sounds
fn minimes() -> Vec<SettingField> {
    let mut fields = minime_base_fields();
    fields.extend(vec![
        number("minimeScale", "Grösse (Bildschirmpixel je Pixel)", MINIME_DOGS, 3.0, 2.0, 8.0, None, None),
        flag("minimeGrass", "Grasstreifen unten", MINIME_DOGS, true),
        flag("minimeNameTag", "Namensschild", MINIME_DOGS, true),
        number("minimeBarkWeight", "Bellen: Häufigkeit", MINIME_DOGS, 3.0, 0.0, 100.0, None, None),
        number("minimeBarkMs", "Bellen: Dauer", MINIME_DOGS, 900.0, 200.0, 10_000.0, MS, None),
        number("minimeSniffWeight", "Schnüffeln: Häufigkeit", MINIME_DOGS, 3.0, 0.0, 100.0, None, None),
        number("minimeSniffMs", "Schnüffeln: Dauer", MINIME_DOGS, 2000.0, 200.0, 10_000.0, MS, None),
        number("minimeLieWeight", "Liegen: Häufigkeit", MINIME_DOGS, 2.0, 0.0, 100.0, None, None),
        number("minimeLieMs", "Liegen: Dauer", MINIME_DOGS, 4000.0, 200.0, 30_000.0, MS, None),
        number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_DOGS, 1.0, 0.0, 100.0, None, None),
        number("minimeSleepMs", "Schlafen: Dauer", MINIME_DOGS, 6000.0, 200.0, 60_000.0, MS, None),
        number(
            "minimeWagMs",
            "Reaktion auf Chat (schnelles Wedeln): Dauer",
            MINIME_DOGS,
            1200.0,
            200.0,
            5000.0,
            MS,
            None,
        ),
    ]);
    fields.extend(with_defaults(
        vec![
            sound("soundMinimeBark", "Bellen", MINIME_SOUNDS),
            sound("soundMinimeSniff", "Schnüffeln", MINIME_SOUNDS),
            sound("soundMinimeWag", "Wedeln bei Chat", MINIME_SOUNDS),
        ],
        &[("soundMinimeBark", volume(0.3)), ("soundMinimeSniff", volume(0.0)), ("soundMinimeWag", volume(0.2))],
    ));
    fields
}

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    BTreeMap::from([
        (WORLD.to_owned(), vec![SceneName::Starting, SceneName::Brb]),
        (STARTING.to_owned(), vec![SceneName::Starting]),
        (BRB.to_owned(), vec![SceneName::Brb]),
        (ENDING.to_owned(), vec![SceneName::Ending, SceneName::Stats]),
        (ALERTS.to_owned(), vec![SceneName::Alerts]),
        (RAID.to_owned(), vec![SceneName::Alerts]),
        (CHAT.to_owned(), vec![SceneName::Chat]),
        (CAM.to_owned(), vec![SceneName::Cam]),
        (MUSIC.to_owned(), vec![SceneName::Music]),
        (FX.to_owned(), vec![SceneName::Fx]),
        (INFO_GROUP.to_owned(), vec![SceneName::Info]),
        (STINGER.to_owned(), vec![]),
        (BANNER.to_owned(), vec![]),
        (MINIME_COMMANDS.to_owned(), vec![SceneName::Minimes]),
        (MINIME_RULES.to_owned(), vec![SceneName::Minimes]),
        (MINIME_MOTION.to_owned(), vec![SceneName::Minimes]),
        (MINIME_VARIANTS.to_owned(), vec![SceneName::Minimes]),
        (MINIME_DOGS.to_owned(), vec![SceneName::Minimes]),
        (MINIME_SOUNDS.to_owned(), vec![SceneName::Minimes]),
    ])
}

fn personalize(login: &Login) -> SettingValues {
    BTreeMap::from([("channelName".to_owned(), SettingValue::Text(login.as_str().to_uppercase()))])
}

/// Simple view of the dashboard (template: `BASIC` in `src/themes/dogs/settings.ts`)
const BASIC: &[&str] = &[
    "quality",
    "channelName",
    "accent",
    "cream",
    "dog",
    "coat",
    "dogName",
    "startingTitle",
    "startingSubtitle",
    "countdownLabel",
    "cardLabel",
    "ticker",
    "brbTitle",
    "brbSubtitle",
    "endingTitle",
    "endingSubtitle",
    "endingStats",
    "followLine",
    "subLine",
    "raidLine",
    "cheerLine",
    "alertBark",
    "chatStyle",
    "chatBadges",
    "camLabel",
    "musicStyle",
    "musicLabel",
    "fxText",
    "minimeNameTag",
];

#[must_use]
pub fn dogs() -> Theme {
    let fields = [
        general(),
        dog(),
        sounds(),
        coats(),
        world(),
        starting(),
        brb(),
        ending(),
        alerts(),
        raid(),
        chat(),
        cam_music_fx(),
        info(),
        clips(),
        minimes(),
        minime_variant_fields(&variants()),
    ]
    .concat();
    let schema = ThemeSchema {
        id: "dogs".to_owned(),
        name: "Dogs".to_owned(),
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
        assert_same_as_fixture(&dogs(), include_str!("../../tests/fixtures/dogs.json"));
    }

    #[test]
    fn personalize_sets_channel_name() {
        let neo = Login::parse("neo").expect("valid login");
        assert_eq!(
            personalize(&neo),
            BTreeMap::from([("channelName".to_owned(), SettingValue::Text("NEO".to_owned()))])
        );
    }

    #[test]
    fn coat_fields_for_every_variant() {
        let fields = coat_fields();
        assert_eq!(fields.len(), 18 * 4);
        assert!(fields.iter().any(|field| field.key == "corgiRotweissBase"));
        assert!(fields.iter().any(|field| field.key == "mopsSchwarzNose"));
    }
}
