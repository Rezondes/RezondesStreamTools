// Settings schema of the Dachdecker theme: a roof frame of glowing plan lines on blueprint, drawn, covered and celebrated
// in terracotta, copper and slate (src/themes/dachdecker/docs/DESIGN-DACHDECKER.md). The only place of the theme with
// fixed colors, texts and numbers; the Rust schema (server-rs/crates/rst-domain/src/themes/dachdecker.rs) stays equal to
// it. DachdeckerValues is the type of the resolved values that the scenes read via useDachdecker.
import { choice, color, flag, font, lines, markBasic, number, text } from "../../core/fields.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { QUALITIES } from "../../core/three/quality.ts";

const FONTS = ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"] as const;
const PROGRESS = ["masskette", "aus"] as const;

const GENERAL = "Allgemein";
const FRAME = "Dachstuhl";
const STARTING = "Starting";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "DACHDECKER", 40),
  font("font", "Schrift", GENERAL, "Roboto Mono", FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 26, 12, 60, "px"),
  number("titleSize", "Titelgrösse", GENERAL, 72, 32, 160, "px"),
  number("countSize", "Countdown-Grösse", GENERAL, 104, 32, 220, "px"),
  color("blueprint", "Blaupause (Hintergrund)", GENERAL, "#192a56"),
  color("page", "Blaupause dunkel (Verlauf unten)", GENERAL, "#121e40"),
  color("accent", "Signatur Terrakotta", GENERAL, "#e67e22"),
  color("brick", "Ziegelrot (Flächen und Leuchten)", GENERAL, "#d35400"),
  color("copper", "Kupfer", GENERAL, "#d4a373"),
  color("slate", "Schiefer", GENERAL, "#2c3e50"),
  color("line", "Plan-Linien und Text", GENERAL, "#ffffff"),
  color("muted", "Gedämpfter Text und Füllung", GENERAL, "#b4c2e0"),
  choice("quality", "Leistungsstufe 3D", GENERAL, "mittel", QUALITIES),
  flag("bloom", "Leuchten (Bloom)", GENERAL, true),
  number("bloomStrength", "Leuchten: Stärke", GENERAL, 0.42, 0, 2, undefined, 0.02),
  number("glow", "Text-Leuchten (0 = aus)", GENERAL, 0.8, 0, 1, undefined, 0.05),
  flag("scramble", "Texte entschlüsseln sich", GENERAL, true),
  number("scrambleMs", "Entschlüsseln: Dauer", GENERAL, 1400, 100, 5000, "ms"),
  flag("flicker", "Titel flackert wie eine Lampe", GENERAL, true),
  number("flickerEvery", "Flackern alle", GENERAL, 5, 1, 60, "s"),

  number("span", "Spannweite in Metern", FRAME, 8.4, 4, 14, undefined, 0.1),
  number("rise", "Firsthöhe in Metern", FRAME, 3.25, 1.5, 6, undefined, 0.05),
  number("trusses", "Binder", FRAME, 5, 2, 9),
  number("trussGap", "Binderabstand in Metern", FRAME, 1.5, 0.8, 3, undefined, 0.1),
  number("overhang", "Sparren-Überstand", FRAME, 12, 0, 30, "%"),
  number("lineOpacity", "Plan-Linien: Deckkraft", FRAME, 0.62, 0, 1, undefined, 0.02),
  number("fillOpacity", "Balken: Füllung", FRAME, 0.1, 0, 0.5, undefined, 0.02),
  flag("grid", "Raster am Boden", FRAME, true),
  number("gridOpacity", "Raster: Deckkraft", FRAME, 0.13, 0, 0.5, undefined, 0.01),
  flag("fog", "Nebel in der Ferne", FRAME, true),
  number("tileCopperShare", "Anteil Kupferziegel", FRAME, 15, 0, 50, "%"),
  number("seed", "Zufall: Startwert", FRAME, 7, 1, 9999),
  number("cameraRadius", "Kamera: Abstand", FRAME, 17, 8, 40, undefined, 0.5),
  number("cameraHeight", "Kamera: Höhe", FRAME, 6.4, 1, 20, undefined, 0.1),
  number("cameraSpeed", "Kamera: Tempo beim Kreisen", FRAME, 0.07, 0, 0.5, undefined, 0.01),
  flag("cameraIntro", "Kamera fährt am Anfang heraus", FRAME, true),
  number("buildSpeed", "Aufbau: Tempo (Faktor)", FRAME, 1, 0.25, 4, undefined, 0.05),

  // Placeholders: {channel}, {login}; in the title block also {date}
  text("startingHead", "Kopfzeile (// trennt Abschnitte)", STARTING, "BAUPLAN 01 // DACHSTUHL 3D // {channel}"),
  text("startingTitle", "Titel", STARTING, "STREAM STARTET GLEICH"),
  text("startingSubtitle", "Unterzeile (leer = aus)", STARTING, ""),
  lines("startingLines", "Wechselnde Zeilen", STARTING, ["Sparren stehen, gleich wird gedeckt", "Kaffee ist durch, die Leiter steht", "Erst messen, dann sägen", "Der Polier zählt noch die Ziegel"]),
  number("linesEvery", "Zeilen wechseln alle", STARTING, 8, 2, 120, "s"),
  number("countdown", "Countdown-Standard", STARTING, 300, 0, 86400, "s"),
  text("countdownPrefix", "Text vor dem Countdown", STARTING, ""),
  text("countdownDone", "Text nach dem Countdown", STARTING, "GLEICH GEHT'S LOS"),
  flag("startingTiles", "Erste Ziegelreihen", STARTING, true),
  number("startingTileRows", "Ziegelreihen", STARTING, 4, 1, 11),
  choice("startingProgress", "Fortschritt", STARTING, "masskette", PROGRESS),
  flag("startingBlock", "Schriftfeld unten rechts", STARTING, true),
  lines("startingBlockLines", "Schriftfeld: Zeilen (| trennt Spalten)", STARTING, ["PROJEKT: STREAM", "M 1:50 | BLATT 1/3", "GEZ. {channel} | {date}"], 6),
  text("ticker", "Ticker als Masskette unten (leer = aus)", STARTING, "", 300),
  number("tickerSpeed", "Ticker: Dauer eines Durchlaufs", STARTING, 30, 5, 300, "s"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { DachdeckerValues } from "../../generated/themes/dachdecker.ts";

const GROUP_SCENES = {
  [FRAME]: ["starting"],
  [STARTING]: ["starting"],
} as const;

// On first login: channel name from the Twitch login instead of the sample
const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: the texts, main colors and switches most streamers change
const BASIC = [
  "channelName", "font", "blueprint", "accent", "copper", "quality", "bloom",
  "startingHead", "startingTitle", "startingLines", "countdownDone", "startingTiles", "startingBlockLines", "ticker",
];

export const dachdeckerSettings: ThemeSchema = { id: "dachdecker", name: "Dachdecker", fields: markBasic(FIELDS, BASIC), groupScenes: GROUP_SCENES, personalize };
