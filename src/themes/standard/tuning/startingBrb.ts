// Fine-tuning fields of the Standard theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  inherits(color("stDigitBBackground", "Countdown-Ziffer (Glyphe): Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Starting, BRB", ""), "accent"),
  inherits(color("stDigitBBackground2", "Countdown-Ziffer (Glyphe): Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Starting, BRB", ""), "accent2"),
  number("stDigitBBackground3", "Countdown-Ziffer (Glyphe): Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB", 90, -360, 360),
  inherits(color("stColonBackground", "Countdown-Doppelpunkt: Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Starting, BRB", ""), "accent"),
  inherits(color("stColonBackground2", "Countdown-Doppelpunkt: Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Starting, BRB", ""), "accent2"),
  number("stColonBackground3", "Countdown-Doppelpunkt: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB", 90, -360, 360),
  number("stCountMarginTop", "Countdown: Abstand oben", "Feinschliff: Starting, BRB", 18, -72, 72, "px"),
  number("stCountFontSize", "Countdown: Schriftgrösse", "Feinschliff: Starting, BRB", 132, 0, 528, "px"),
  number("stCountFontWeight", "Countdown: Schriftstärke", "Feinschliff: Starting, BRB", 800, 100, 900, undefined, 100),
  number("stCountLetterSpacing", "Countdown: Zeichenabstand (em)", "Feinschliff: Starting, BRB", -0.02, -2, 2, undefined, 0.01),
  number("stCountLineHeight", "Countdown: Zeilenhöhe", "Feinschliff: Starting, BRB", 1.1, 0.5, 3, undefined, 0.01),
  inherits(color("stCountColor", "Countdown: Textfarbe", "Feinschliff: Starting, BRB", ""), "textColor"),
  inherits(font("stCountFont", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("stDigitWidth", "Countdown-Ziffer: Breite (em)", "Feinschliff: Starting, BRB", 0.62, 0, 2.48, undefined, 0.01),
  number("stDigitHeight", "Countdown-Ziffer: Höhe (em)", "Feinschliff: Starting, BRB", 1.1, 0, 4.4, undefined, 0.01),
  number("stDigitBBackgroundSize", "Countdown-Ziffer (Glyphe): Hintergrund-Grösse x", "Feinschliff: Starting, BRB", 400, 0, 1200, "%"),
  number("stColonWidth", "Countdown-Doppelpunkt: Breite (em)", "Feinschliff: Starting, BRB", 0.32, 0, 2, undefined, 0.01),
  number("stColonBackgroundSize", "Countdown-Doppelpunkt: Hintergrund-Grösse x", "Feinschliff: Starting, BRB", 400, 0, 1200, "%"),
  number("kfRollInFromTranslate", "Ziffer rollt herein (Start): Verschiebung y", "Feinschliff: Starting, BRB", 110, -330, 330, "%"),
  number("kfRollOutToTranslate", "Ziffer rollt hinaus (Ende): Verschiebung y", "Feinschliff: Starting, BRB", -110, -330, 330, "%"),
  number("screenAtRest", "Vollbild-Ablauf: Countdown und Rest ab", "Feinschliff: Starting, BRB", 1.6, 0, 10, "s", 0.05),
  number("screenFromRest", "Vollbild-Einflug: Countdown und Rest steigen um", "Feinschliff: Starting, BRB", 20, -80, 80, "px"),
  number("screenTimeRest", "Vollbild-Einflug: Countdown und Rest (Dauer)", "Feinschliff: Starting, BRB", 0.8, 0, 10, "s", 0.05),
  number("screenRestStagger", "Vollbild-Einflug: Abstand zwischen den Teilen", "Feinschliff: Starting, BRB", 0.15, 0, 2, "s", 0.05),
] as const satisfies readonly SettingField[];
