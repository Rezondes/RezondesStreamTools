// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  inherits(font("bigFont", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"]), "titleFont"),
  inherits(font("bigFont2", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Space Grotesk", "Inter", "Manrope", "DM Sans"]), "font"),
  number("bigFontWeight", "Countdown: Schriftstärke", "Feinschliff: Starting, BRB", 400, 100, 900, undefined, 100),
  number("bigFontSize", "Countdown: Schriftgrösse", "Feinschliff: Starting, BRB", 0.74, 0, 2.96, undefined, 0.01),
  number("bigLineHeight", "Countdown: Zeilenhöhe", "Feinschliff: Starting, BRB", 1, 0.5, 3, undefined, 0.01),
  inherits(color("bigColor", "Countdown: Textfarbe", "Feinschliff: Starting, BRB", ""), "accent2"),
  number("bigColor2", "Countdown: Textfarbe Farbanteil", "Feinschliff: Starting, BRB", 90, 0, 100, "%"),
  inherits(color("bigWebkitTextStroke", "Countdown: Textkontur Farbe (Zweiter Akzent Cyan)", "Feinschliff: Starting, BRB", ""), "accent2"),
  number("bigWebkitTextStroke2", "Countdown: Textkontur Wert 1", "Feinschliff: Starting, BRB", 3, 0, 40, "px"),
  inherits(color("bigTextShadow", "Countdown: Textschatten Farbe (Zweiter Akzent Cyan)", "Feinschliff: Starting, BRB", ""), "accent2"),
  inherits(color("bigTextShadow2", "Countdown: Textschatten Farbe (Zweiter Akzent Cyan) (2)", "Feinschliff: Starting, BRB", ""), "accent2"),
  number("bigTextShadow3", "Countdown: Textschatten Unschärfe (Teil 1)", "Feinschliff: Starting, BRB", 44, 0, 176, "px"),
  number("bigTextShadow4", "Countdown: Textschatten Unschärfe (Teil 2)", "Feinschliff: Starting, BRB", 12, 0, 48, "px"),
] as const satisfies readonly SettingField[];
