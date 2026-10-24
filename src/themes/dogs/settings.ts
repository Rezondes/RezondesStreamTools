// Settings schema of the Dogs theme (DESIGN-DOGS.md, PLAN-DOGS.md): pixel art dogs on a sunny meadow. The only place of
// the theme with fixed colors, texts and numbers. The coat colors of the 18 variants come from one table (COAT_COLORS,
// keys like corgiRotweissBase, coats.ts); server-rs/.../themes/dogs.rs builds the same fields from the same table.
// DogsValues is the type of the resolved values that the scenes read via useDogs.
import { choice, color, flag, font, inScene, markBasic, number, sound, text, withDefaults } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { BREED_IDS, BREEDS } from "./breeds.ts";
import { COATS, coatKey, type Coat } from "./coats.ts";

const FONTS = ["Pixelify Sans", "VT323", "Silkscreen"] as const;
const BARK_VOICES = ["klein", "mittel", "gross"] as const;
const COAT_IDS = [...new Set(COATS.map(variant => variant.id))];

const GENERAL = "Allgemein";
const DOG = "Hund";
const SOUNDS = "Töne";
const WORLD = "Welt";
const STARTING = "Starting";
const STINGER = "Stinger";

// Per variant: base, mark, dark, nose (defaults of the prototypes, refs/dog.js)
const COAT_COLORS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  corgiRotweiss: ["#cc7633", "#fbf6ee", "#a85a22", "#1d1715"], corgiZobel: ["#bd7a3c", "#fbf6ee", "#4e3322", "#1d1715"], corgiTricolor: ["#c27c40", "#fbf6ee", "#1f1b1a", "#111111"],
  shibaRot: ["#c9763a", "#f6e8d2", "#a85c27", "#1d1715"], shibaSesam: ["#c27a42", "#f4e5cf", "#3a2a20", "#1d1715"], shibaSchwarzloh: ["#231d1a", "#f3e3cc", "#c18750", "#111111"], shibaCreme: ["#ead6b4", "#fbf3e5", "#d7bd94", "#2a1d18"],
  labradorGelb: ["#e3bf86", "#f2dcb4", "#c99a5e", "#2a1d18"], labradorSchwarz: ["#1e1b1a", "#2a2523", "#141212", "#111111"], labradorBraun: ["#6a3f27", "#7a4b31", "#4a2a19", "#3d2419"],
  dalmatinerSchwarz: ["#f8f4ee", "#ffffff", "#1e1b1a", "#111111"], dalmatinerLeber: ["#f8f4ee", "#ffffff", "#6b3a22", "#5a3020"],
  dackelRot: ["#b4602f", "#c2743f", "#7f3e1c", "#1d1715"], dackelSchwarzrot: ["#1f1917", "#b5683a", "#141110", "#111111"], dackelSchokorot: ["#55301f", "#c07a45", "#3a2015", "#3a2218"],
  mopsBeige: ["#d9bb8b", "#e6cda2", "#231c19", "#111111"], mopsApricot: ["#d49b5d", "#e0b07a", "#251c16", "#111111"], mopsSchwarz: ["#1e1b1a", "#4a423d", "#141212", "#0a0a0a"],
};
const PART_LABELS = { Base: "Grundfarbe", Mark: "Abzeichen", Dark: "dunkel", Nose: "Nase" } as const;
const coatGroup = (variant: Coat) => `Fell: ${BREEDS[variant.breed].name}`;

// The four color fields of every variant, in the group of its breed
export function coatFields(): SettingField[] {
  return COATS.flatMap(variant => {
    const defaults = COAT_COLORS[coatKey(variant, "Base").replace(/Base$/, "")];
    return (["Base", "Mark", "Dark", "Nose"] as const).map((part, index) => color(coatKey(variant, part), `${variant.name}: ${PART_LABELS[part]}`, coatGroup(variant), defaults[index]));
  });
}

const volume = (value: number) => ({ file: "", volume: value });
const barkVoiceOf = (id: string) => (["labrador", "dalmatiner"].includes(id) ? "gross" : id === "shiba" ? "mittel" : "klein");

const FIELDS = [
  text("channelName", "Kanalname ({channel})", GENERAL, "RUDEL-STREAM", 40),
  font("font", "Schrift", GENERAL, "Pixelify Sans", FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 26, 10, 60, "px"),
  number("titleSize", "Titel: Grösse", GENERAL, 100, 40, 200, "px"),
  color("cream", "Schild", GENERAL, "#fff6e6"),
  color("edge", "Schild: Kante unten", GENERAL, "#e9d2bd"),
  color("ink", "Tinte (Kontur)", GENERAL, "#2e1d14"),
  color("textColor", "Text", GENERAL, "#4a3426"),
  color("muted", "Text gedämpft", GENERAL, "#7a5a46"),
  color("accent", "Signatur (Halsband-Rot)", GENERAL, "#c24535"),
  color("onAccent", "Schrift auf der Signatur", GENERAL, "#fff6e6"),
  color("ball", "Ball-Gelb", GENERAL, "#ffd23f"),
  color("light", "Licht (Augen, Wolken, Zaun)", GENERAL, "#ffffff"),
  number("boxShadow", "Schatten der Schilder", GENERAL, 28, 0, 100, "%"),
  qualityField(GENERAL),
  number("pixelScale", "Pixelgrösse", GENERAL, 5, 3, 8, "px"),

  choice("dog", "Hund des Streamers: Rasse", DOG, "corgi", BREED_IDS),
  choice("coat", "Hund des Streamers: Fell (passend zur Rasse)", DOG, "rotweiss", COAT_IDS),
  text("dogName", "Name des Hundes ({dog})", DOG, "Bello", 30),
  color("dogEye", "Augen", DOG, "#1d1412"),
  color("dogTongue", "Zunge und Ohren innen", DOG, "#e98a95"),
  number("blinkEvery", "Blinzeln: alle (0 = nie)", DOG, 3.3, 0, 30, "s", 0.1),
  number("wagSpeed", "Wedeln: Tempo", DOG, 10, 0, 30, undefined, 0.5),
  number("walkFps", "Laufen: Bilder pro Sekunde", DOG, 9, 2, 30),
  flag("pant", "Hecheln", DOG, true),
  ...BREED_IDS.map(id => choice(`barkVoice_${id}`, `Bellstimme: ${BREEDS[id].name}`, DOG, barkVoiceOf(id), BARK_VOICES)),

  number("soundMaxVoices", "Töne gleichzeitig höchstens", SOUNDS, 8, 1, 32),
  ...withDefaults([
    sound("soundStartingLand", "Starting: Hund landet", SOUNDS),
    sound("soundStartingHop", "Starting: Marker hüpft", SOUNDS),
    sound("soundStartingChosen", "Starting: Hund gewählt", SOUNDS),
    sound("soundStartingCard", "Starting: Karte", SOUNDS),
    sound("soundBark", "Bellen", SOUNDS),
  ], { soundStartingLand: volume(0.4), soundStartingHop: volume(0.4), soundStartingChosen: volume(0.6), soundStartingCard: volume(0.5), soundBark: volume(0.7) }),
  flag("startingBarkSound", "Starting: Hunde bellen hörbar", SOUNDS, true),

  ...coatFields(),
  number("dalmatinerSpots", "Dalmatiner: Anteil der Flecken", "Fell: Dalmatiner", 42, 0, 100, "%"),
  number("spotSeed", "Dalmatiner: Startwert der Flecken", "Fell: Dalmatiner", 1, 1, 9999),

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
  number("clouds", "Wolken", WORLD, 6, 0, 20),
  number("cloudSpeed", "Wolken: Tempo", WORLD, 4, 0, 60, undefined, 0.5),
  flag("trees", "Bäume", WORLD, true),
  number("flowers", "Blumen und Grasbüschel", WORLD, 56, 0, 300),
  color("flowerColor1", "Blumen: Farbe 1", WORLD, "#ffffff"),
  color("flowerColor2", "Blumen: Farbe 2", WORLD, "#ffd23f"),
  color("flowerColor3", "Blumen: Farbe 3", WORLD, "#f7a6c1"),
  color("flowerColor4", "Blumen: Farbe 4", WORLD, "#c9b6ff"),

  inScene("starting", text("startingPill", "Pille oben ({channel})", STARTING, "{channel}", 40)),
  inScene("starting", text("startingTitle", "Titel", STARTING, "Gleich geht's los!", 60)),
  inScene("starting", text("startingSubtitle", "Unterzeile", STARTING, "Wer begleitet uns heute?", 80)),
  inScene("starting", number("countdown", "Countdown: Dauer", STARTING, 300, 0, 86400, "s")),
  inScene("starting", text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", 5)),
  inScene("starting", text("countdownLabel", "Countdown: Beschriftung", STARTING, "LOS GEHT'S IN", 40)),
  inScene("starting", text("cardLabel", "Karte: Überzeile", STARTING, "HEUTE AN MEINER SEITE", 40)),
  inScene("starting", text("cardBreed", "Karte: Rasse ({breed}, {coat})", STARTING, "{breed} · {coat}", 60)),
  inScene("starting", text("bark", "Sprechblase", STARTING, "Wuff!", 20)),
  inScene("starting", color("cushionColor1", "Kissen 1", STARTING, "#bfe8d4")),
  inScene("starting", color("cushionColor2", "Kissen 2", STARTING, "#d8ccff")),
  inScene("starting", color("cushionColor3", "Kissen 3", STARTING, "#ffd2b8")),
  inScene("starting", color("cushionColor4", "Kissen 4", STARTING, "#bfe0ff")),
  inScene("starting", color("cushionColor5", "Kissen 5", STARTING, "#fff0a8")),
  inScene("starting", color("cushionColor6", "Kissen 6", STARTING, "#ffc9d9")),
  inScene("starting", color("rugColor", "Teppich", STARTING, "#c24535")),
  inScene("starting", number("dropEvery", "Hunde fallen: Abstand", STARTING, 0.2, 0, 2, "s", 0.05)),
  inScene("starting", number("markerStart", "Marker startet nach", STARTING, 2.6, 0, 20, "s", 0.1)),
  inScene("starting", number("markerHop", "Marker: Dauer je Sprung", STARTING, 0.45, 0.1, 3, "s", 0.05)),
  inScene("starting", number("hearts", "Herzen", STARTING, 7, 0, 30)),
  inScene("starting", number("walkSpeed", "Lauf zum Teppich: Tempo", STARTING, 48, 5, 300)),
  inScene("starting", number("barkEvery", "Bellen: alle", STARTING, 7, 1, 120, "s", 0.5)),
  inScene("starting", flag("labels", "Etiketten unter den Kissen", STARTING, true)),
  inScene("starting", text("ticker", "Laufband (leer = aus)", STARTING, "", 300)),
  inScene("starting", number("tickerSpeed", "Laufband: Tempo (px pro Sekunde)", STARTING, 90, 10, 400)),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { DogsValues } from "../../generated/themes/dogs.ts";

const GROUP_SCENES = {
  [WORLD]: ["starting"],
  [STARTING]: ["starting"],
  [STINGER]: [],
} as const;

const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: per area the texts, main colors and switches most streamers change
const BASIC = ["quality", "channelName", "accent", "cream", "dog", "coat", "dogName", "startingTitle", "startingSubtitle", "countdownLabel", "cardLabel", "ticker"];

export const dogsSettings: ThemeSchema = { id: "dogs", name: "Dogs", fields: markBasic(withStingerFields(FIELDS, STINGER), BASIC), groupScenes: GROUP_SCENES, personalize };
