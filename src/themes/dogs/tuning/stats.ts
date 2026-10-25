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
  number("captionFontSize", "Unterschrift: Schriftgrösse", "Feinschliff: Statistik", 0.85, 0, 3.4, undefined, 0.01),
  number("captionFontWeight", "Unterschrift: Schriftstärke", "Feinschliff: Statistik", 600, 100, 900, undefined, 100),
  number("captionLetterSpacing", "Unterschrift: Zeichenabstand", "Feinschliff: Statistik", 3, -40, 40, "px"),
  inherits(color("captionColor", "Unterschrift: Textfarbe", "Feinschliff: Statistik", ""), "muted"),
  inherits(font("captionFont", "Unterschrift: Schrift", "Feinschliff: Statistik", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("statPadding", "Wert: Innenabstand oben", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("statPadding2", "Wert: Innenabstand links/rechts", "Feinschliff: Statistik", 26, 0, 104, "px"),
  number("statPadding3", "Wert: Innenabstand unten", "Feinschliff: Statistik", 22, 0, 88, "px"),
  number("statValueMarginTop", "Wert Wert: Abstand oben", "Feinschliff: Statistik", 8, -40, 40, "px"),
  number("statValueFontSize", "Wert Wert: Schriftgrösse", "Feinschliff: Statistik", 2.75, 0, 11, undefined, 0.01),
  number("statValueFontWeight", "Wert Wert: Schriftstärke", "Feinschliff: Statistik", 700, 100, 900, undefined, 100),
  number("statValueLineHeight", "Wert Wert: Zeilenhöhe", "Feinschliff: Statistik", 1, 0.5, 3, undefined, 0.01),
  inherits(color("statValueColor", "Wert Wert: Textfarbe", "Feinschliff: Statistik", ""), "accent"),
  inherits(font("statValueFont", "Wert Wert: Schrift", "Feinschliff: Statistik", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
