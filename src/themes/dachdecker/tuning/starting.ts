// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Starting" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_TUNING = [
  number("progressBoxLeft", "Fortschritt Kasten: Lage links", "Feinschliff: Starting", 50, -150, 150, "%"),
  number("progressBoxBottom", "Fortschritt Kasten: Lage unten", "Feinschliff: Starting", 18, -72, 72, "px"),
  number("progressBoxWidth", "Fortschritt Kasten: Breite", "Feinschliff: Starting", 640, 0, 2560, "px"),
  number("progressBoxTransform", "Fortschritt Kasten: Verformung Verschiebung x", "Feinschliff: Starting", -50, -150, 150, "%"),
  number("tickerHeight", "Lauftext: Höhe", "Feinschliff: Starting", 40, 0, 160, "px"),
  inherits(color("tickerBorderTop", "Lauftext: Rand oben Farbe (Plan-Linien und Text)", "Feinschliff: Starting", ""), "line"),
  number("tickerBorderTop2", "Lauftext: Rand oben Stärke", "Feinschliff: Starting", 1.5, 0, 40, "px", 0.5),
  number("tickerBorderTop3", "Lauftext: Rand oben Farbanteil", "Feinschliff: Starting", 85, 0, 100, "%"),
  number("tickerFontSize", "Lauftext: Schriftgrösse", "Feinschliff: Starting", 20, 0, 80, "px"),
  number("tickerLetterSpacing", "Lauftext: Zeichenabstand", "Feinschliff: Starting", 6, -40, 40, "px"),
  inherits(color("tickerColor", "Lauftext: Textfarbe", "Feinschliff: Starting", ""), "copper"),
  inherits(font("tickerFont", "Lauftext: Schrift", "Feinschliff: Starting", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  number("tickerSpanTop", "Lauftext: Text: Lage oben", "Feinschliff: Starting", 50, -150, 150, "%"),
  number("kfTickerFromTransform", "Lauftext (Start): Verformung Verschiebung x (vw)", "Feinschliff: Starting", 100, -400, 400, undefined, 0.01),
  number("kfTickerFromTransform2", "Lauftext (Start): Verformung Verschiebung y", "Feinschliff: Starting", -50, -150, 150, "%"),
  number("kfTickerToTransform", "Lauftext (Ende): Verformung Verschiebung x", "Feinschliff: Starting", -100, -300, 300, "%"),
  number("kfTickerToTransform2", "Lauftext (Ende): Verformung Verschiebung y", "Feinschliff: Starting", -50, -150, 150, "%"),
  number("lightPlanSky", "Licht Starting: Himmel", "Feinschliff: Starting", 0.9, 0, 10, undefined, 0.05),
  number("lightPlanMain", "Licht Starting: Hauptlicht", "Feinschliff: Starting", 1.1, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
