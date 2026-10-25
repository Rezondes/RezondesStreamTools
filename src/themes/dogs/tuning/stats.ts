// Fine-tuning fields of the Dogs theme, group "Feinschliff: Statistik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_TUNING = [
  number("statsGap", "Statistik: Abstand", "Feinschliff: Statistik", 18, 0, 72, "px"),
  number("statsPadding", "Statistik: Innenabstand oben", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("statsPadding2", "Statistik: Innenabstand links/rechts", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("statsPadding3", "Statistik: Innenabstand unten", "Feinschliff: Statistik", 24, 0, 96, "px"),
  number("statsRowGap", "Statistik Zeile: Abstand", "Feinschliff: Statistik", 14, 0, 56, "px"),
  number("statsRowPadding", "Statistik Zeile: Innenabstand oben", "Feinschliff: Statistik", 8, 0, 40, "px"),
  number("statsRowPadding2", "Statistik Zeile: Innenabstand links/rechts", "Feinschliff: Statistik", 18, 0, 72, "px"),
  number("statsRowPadding3", "Statistik Zeile: Innenabstand unten", "Feinschliff: Statistik", 12, 0, 48, "px"),
  number("statsNumberFontSize", "Statistik Zahl: Schriftgrösse (em)", "Feinschliff: Statistik", 1.6, 0, 6.4, undefined, 0.01),
  inherits(color("statsNumberColor", "Statistik Zahl: Textfarbe", "Feinschliff: Statistik", ""), "accent"),
  inherits(font("statsNumberFont", "Statistik Zahl: Schrift", "Feinschliff: Statistik", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("statsLabelFontWeight", "Statistik Schild: Schriftstärke", "Feinschliff: Statistik", 600, 100, 900, undefined, 100),
  inherits(color("statsLabelColor", "Statistik Schild: Textfarbe", "Feinschliff: Statistik", ""), ""),
  inherits(font("statsLabelFont", "Statistik Schild: Schrift", "Feinschliff: Statistik", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
