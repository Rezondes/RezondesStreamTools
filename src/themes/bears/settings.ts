// Settings schema of the Bärenbande theme: three bear brothers (Eisbär, Grizzly, Panda) as cartoons with a clear outline in
// front of a watercolor world of forest, cave and a far city. One bear per scene (or the tower of all three), chosen
// per scene. The only place of the theme with fixed colors, texts and numbers. BearsValues is the type of the resolved
// values (useBears).
import { choice, color, flag, font, inScene, lines, number, text } from "../../core/fields.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { BEAR_CHOICES } from "./bears.ts";

export const FONTS = ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"] as const;
const TITLE_FONTS = ["Sniglet", "Fredoka", "Baloo 2", "Nunito"] as const;
const TIMES = ["morgen", "mittag", "abend", "nacht"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const SIDES = ["links", "rechts"] as const;

const GENERAL = "Allgemein";
const BEARS = "Bären";
const WORLD = "Welt";
const SCREENS = "Starting, BRB, Ending";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "Bärenbande", 40),
  font("font", "Schrift", GENERAL, "Nunito", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Sniglet", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 24, 10, 60, "px"),
  color("outline", "Kontur", GENERAL, "#1c1a19"),
  number("outlineWidth", "Kontur: Stärke", GENERAL, 4.5, 0, 20, undefined, 0.5),
  color("textColor", "Text hell", GENERAL, "#ffffff"),
  color("textDark", "Text auf Papier", GENERAL, "#2b2522"),
  color("textDim", "Text gedämpft", GENERAL, "#6b5d55"),
  color("paper", "Papier (Karten, Schilder)", GENERAL, "#fbf3e0"),
  color("paperShade", "Papier: Schattenton", GENERAL, "#e9dcc0"),
  color("accent", "Akzent (Ziegelrot)", GENERAL, "#e2573f"),
  color("accentText", "Akzent für Text", GENERAL, "#b83c28"),
  color("accent2", "Akzent 2 (Himmelblau)", GENERAL, "#4d9de0"),
  number("radius", "Eckenradius", GENERAL, 22, 0, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500, 0, 3000, "ms"),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),
  choice("facing", "Blickrichtung der Bären", GENERAL, "links", SIDES),

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
  number("blinkEvery", "Blinzeln alle (0 = nie)", BEARS, 5000, 0, 30000, "ms"),
  flag("breathe", "Atmen", BEARS, true),
  number("breatheMs", "Atmen: Dauer eines Atemzugs", BEARS, 3600, 1000, 10000, "ms"),
  number("towerSway", "Bärenturm: Wanken (Grad)", BEARS, 2, 0, 10),
  number("towerSwayMs", "Bärenturm: Wanken (Dauer)", BEARS, 2400, 500, 10000, "ms"),

  inScene("starting", choice("timeStarting", "Tageszeit Starting", WORLD, "morgen", TIMES)),
  inScene("brb", choice("timeBrb", "Tageszeit BRB", WORLD, "mittag", TIMES)),
  inScene("ending", choice("timeEnding", "Tageszeit Ending", WORLD, "abend", TIMES)),
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
  number("cloudCount", "Anzahl Wolken", WORLD, 4, 0, 8),
  number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", WORLD, 140, 10, 600, "s"),
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
  number("paperGrain", "Aquarell: Papierstruktur", WORLD, 0.5, 0, 1, undefined, 0.05),
  number("sketchLines", "Aquarell: Skizzenlinien", WORLD, 0.5, 0, 1, undefined, 0.05),

  inScene("starting", choice("bearStarting", "Starting: Bär", SCREENS, "grizzly", BEAR_CHOICES)),
  inScene("brb", choice("bearBrb", "BRB: Bär", SCREENS, "eisbaer", BEAR_CHOICES)),
  inScene("ending", choice("bearEnding", "Ending: Bär", SCREENS, "panda", BEAR_CHOICES)),
  number("bearSize", "Bär: Grösse (Höhe)", SCREENS, 520, 100, 1000, "px"),
  choice("bearSide", "Bär: Seite", SCREENS, "links", SIDES),
  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("starting", text("startingNote", "Starting: Untertitel", SCREENS, "Die Bande sammelt sich noch.")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", text("brbNote", "BRB: Untertitel", SCREENS, "Hier wird gerade gekocht.")),
  inScene("brb", text("brbSign", "BRB: Schild des Grizzly", SCREENS, "Gleich zurück!", 24)),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  inScene("ending", text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Mal!")),
  number("signWidth", "Schild: Breite", SCREENS, 1000, 400, 1800, "px"),
  number("titleSize", "Titelgrösse", SCREENS, 104, 30, 240, "px"),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "weg", ["weg", "balken", "aus"])),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", lines("startingLines", "Sprüche Starting", SCREENS, ["Snacks werden verteilt ...", "Das Handy wird aufgeladen ...", "Die Höhle wird aufgeräumt ...", "Die Begrüssung wird geübt ..."])),
  inScene("brb", lines("brbLines", "Sprüche BRB", SCREENS, ["Es wird etwas Feines gekocht ...", "Kurz die Höhle fegen ...", "Nachrichten werden gecheckt ..."])),
  inScene("ending", lines("endingLines", "Sprüche Ending", SCREENS, ["Die Bande winkt zum Abschied ...", "Zeit für ein Nickerchen in der Höhle ...", "Bis bald!"])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 6, 2, 120, "s"),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 300),
  number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30, 5, 300, "s"),
  choice("powerOn", "Einschalten", SCREENS, "aquarell", ["aquarell", "blenden", "keins"]),
  number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1600, 0, 10000, "ms"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { BearsValues } from "../../generated/themes/bears.ts";

const SCREEN_SCENES = ["starting", "brb", "ending"] as const;
const GROUP_SCENES = {
  [BEARS]: SCREEN_SCENES,
  [WORLD]: SCREEN_SCENES,
  [SCREENS]: SCREEN_SCENES,
} as const;

const capital = (login: string) => login[0].toUpperCase() + login.slice(1);
// On first login: channel name from the Twitch login (first letter upper case)
const personalize = (login: string) => ({ channelName: capital(login) });

export const bearsSettings: ThemeSchema = {
  id: "bears",
  name: "Bärenbande",
  fields: FIELDS,
  groupScenes: GROUP_SCENES,
  personalize,
};
