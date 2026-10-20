// Settings schema of the Chaos theme: neon graffiti at night, magenta and cyan scribble, spray and glow on almost black
// (src/themes/chaos/docs/DESIGN-CHAOS.md). The only place of the theme with fixed colors, texts and numbers; the Rust
// schema (server-rs/crates/rst-domain/src/themes/chaos.rs) stays equal to it. ChaosValues is the type of the resolved
// values that the scenes read via useChaos.
import { choice, color, flag, font, inScene, lines, markBasic, number, text } from "../../core/fields.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

const FONTS = ["Space Grotesk", "Inter", "Manrope", "DM Sans"] as const;
const TITLE_FONTS = ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"] as const;
const GESTURES = ["zweix", "x", "strich", "keine"] as const;
const GESTURE_COLORS = ["cyan", "magenta"] as const;

const GENERAL = "Allgemein";
const SCRIBBLES = "Kritzeleien";
const SCREENS = "Starting, BRB, Ending";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "CHAOS", 40),
  font("font", "Schrift", GENERAL, "Space Grotesk", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Permanent Marker", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 30, 12, 60, "px"),
  number("titleSize", "Titelgrösse", GENERAL, 150, 40, 260, "px"),
  color("ground", "Grund (Wand aussen)", GENERAL, "#120910"),
  color("wall", "Wand (Mitte)", GENERAL, "#22182f"),
  color("accent", "Signatur Magenta", GENERAL, "#d123a0"),
  color("accentText", "Magenta für Text", GENERAL, "#ff5ccb"),
  color("accent2", "Zweiter Akzent Cyan", GENERAL, "#09d0fe"),
  color("onAccent2", "Schrift auf Cyan und Klebeband", GENERAL, "#120910"),
  color("violet", "Violett (Flecken, Schatten)", GENERAL, "#502a5f"),
  color("violetLight", "Violett hell", GENERAL, "#986ea9"),
  color("lilac", "Flieder (Klebeband)", GENERAL, "#d39dd4"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#b8a6c4"),
  number("grain", "Körnung (0 = aus)", GENERAL, 0.55, 0, 1, undefined, 0.05),
  number("jitter", "Zittern der Linien (0 = glatt)", GENERAL, 0.5, 0, 1, undefined, 0.05),
  number("glow", "Leuchten (0 = aus)", GENERAL, 0.6, 0, 1, undefined, 0.05),
  number("flicker", "Neon-Flackern (0 = aus)", GENERAL, 0.2, 0, 1, undefined, 0.05),
  number("glitch", "Glitch-Stärke (0 = aus)", GENERAL, 0.3, 0, 1, undefined, 0.05),
  number("glitchEvery", "Glitch alle", GENERAL, 9, 2, 120, "s"),

  number("scribbleCount", "Anzahl", SCRIBBLES, 340, 0, 600),
  number("scribbleWidth", "Strichstärke (Faktor)", SCRIBBLES, 1, 0.3, 3, undefined, 0.1),
  color("scribbleColor1", "Farbe 1", SCRIBBLES, "#d123a0"),
  color("scribbleColor2", "Farbe 2", SCRIBBLES, "#09d0fe"),
  color("scribbleColor3", "Farbe 3", SCRIBBLES, "#986ea9"),
  color("scribbleColor4", "Farbe 4", SCRIBBLES, "#d39dd4"),
  flag("scribbleWhite", "Ab und zu weiss", SCRIBBLES, true),
  number("drawMs", "Zeichnen: Dauer je Zeichen", SCRIBBLES, 700, 0, 5000, "ms"),
  number("drawGapMs", "Zeichnen: Abstand zwischen Zeichen", SCRIBBLES, 8, 0, 200, "ms"),
  flag("drips", "Laufnasen", SCRIBBLES, true),

  inScene("starting", choice("gestureStarting", "Starting: Pinselstriche", SCREENS, "zweix", GESTURES)),
  inScene("starting", choice("gestureColorStarting", "Starting: Farbe bei einem X oder Strich", SCREENS, "cyan", GESTURE_COLORS)),
  number("haze", "Dunkler Dunst hinter dem Text", SCREENS, 0.78, 0, 1, undefined, 0.05),
  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Stream startet")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Gleich geht's los")),
  inScene("starting", lines("startingLines", "Starting: Sprüche", SCREENS, ["... vielleicht.", "Snacks holen, Chaos vorbereiten.", "Kabel sortieren? Niemals.", "Ordnung ist was für Anfänger."])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 8, 0, 600, "s"),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Text vor dem Countdown", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "zickzack", ["zickzack", "balken", "aus"])),
  text("ticker", "Klebeband unten (leer = aus)", SCREENS, "", 300),
  number("tickerSpeed", "Klebeband: Dauer eines Durchlaufs", SCREENS, 25, 5, 200, "s"),
  choice("powerOn", "Einschalten", SCREENS, "spray", ["spray", "blende", "keins"]),
  number("powerOnDuration", "Einschalten: Dauer", SCREENS, 2500, 0, 10000, "ms"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { ChaosValues } from "../../generated/themes/chaos.ts";

const GROUP_SCENES = {
  [SCREENS]: ["starting", "brb", "ending"],
} as const;

// On first login: channel name from the Twitch login instead of the sample
const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: the texts, main colors and switches most streamers change
const BASIC = [
  "channelName", "font", "titleFont", "accent", "accent2", "textColor", "scribbleColor1", "gestureStarting",
  "startingEyebrow", "startingTitle", "startingLines", "countdownDone", "ticker",
];

export const chaosSettings: ThemeSchema = { id: "chaos", name: "Chaos", fields: markBasic(FIELDS, BASIC), groupScenes: GROUP_SCENES, personalize };
