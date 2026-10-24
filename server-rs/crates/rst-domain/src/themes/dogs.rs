//! Settings schema of the Dogs theme: pixel art dogs on a sunny meadow (template: `src/themes/dogs/settings.ts`).
//! Labels, groups and defaults are the German UI texts and stay equal to the TypeScript schema (fixture test). The
//! coat fields come from one table of the 18 variants, like `coatFields` in TypeScript.

#![allow(clippy::too_many_lines, reason = "schema data: one line per field")]

use std::collections::BTreeMap;

use crate::identity::values::Login;
use crate::settings::field::{
    SettingField, SettingValue, SettingValues, SoundValue, Unit, choice, color, flag, font, in_scene, lines,
    mark_basic, number, sound, text, with_defaults,
};
use crate::themes::graphics_fields::quality_field;
use crate::themes::registry::Theme;
use crate::themes::schema::{SceneName, ThemeSchema};
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
const STINGER: &str = "Stinger";

const PX: Option<Unit> = Some(Unit::Px);
const PERCENT: Option<Unit> = Some(Unit::Percent);
const S: Option<Unit> = Some(Unit::S);

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
fn coat_ids() -> Vec<&'static str> {
    let mut ids: Vec<&str> = Vec::new();
    for (_, id, _, _) in COATS {
        if !ids.contains(&id) {
            ids.push(id);
        }
    }
    ids
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
        choice("coat", "Hund des Streamers: Fell (passend zur Rasse)", DOG, "rotweiss", &coat_ids()),
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

fn group_scenes() -> BTreeMap<String, Vec<SceneName>> {
    BTreeMap::from([
        (WORLD.to_owned(), vec![SceneName::Starting, SceneName::Brb]),
        (STARTING.to_owned(), vec![SceneName::Starting]),
        (BRB.to_owned(), vec![SceneName::Brb]),
        (ENDING.to_owned(), vec![SceneName::Ending]),
        (STINGER.to_owned(), vec![]),
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
];

#[must_use]
pub fn dogs() -> Theme {
    let fields = [general(), dog(), sounds(), coats(), world(), starting(), brb(), ending()].concat();
    let schema = ThemeSchema {
        id: "dogs".to_owned(),
        name: "Dogs".to_owned(),
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
