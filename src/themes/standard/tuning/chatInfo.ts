// Fine-tuning fields of the Standard theme, group "Feinschliff: Chat, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_INFO_TUNING = [
  number("chipMarginRight", "Chip: Abstand rechts", "Feinschliff: Chat, Befehlsseite", 8, -40, 40, "px"),
  number("chipPadding", "Chip: Innenabstand oben/unten", "Feinschliff: Chat, Befehlsseite", 2, 0, 40, "px"),
  number("chipPadding2", "Chip: Innenabstand links/rechts", "Feinschliff: Chat, Befehlsseite", 10, 0, 40, "px"),
  number("chipBorderRadius", "Chip: Eckenradius", "Feinschliff: Chat, Befehlsseite", 999, 0, 999, "px"),
  inherits(color("chipBackground", "Chip: Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Chat, Befehlsseite", ""), "accent"),
  inherits(color("chipBackground2", "Chip: Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Chat, Befehlsseite", ""), "accent2"),
  number("chipBackground3", "Chip: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Chat, Befehlsseite", 135, -360, 360),
  inherits(color("chipColor", "Chip: Textfarbe", "Feinschliff: Chat, Befehlsseite", ""), "textColor"),
  number("chipFontSize", "Chip: Schriftgrösse (em)", "Feinschliff: Chat, Befehlsseite", 0.7, 0, 2.8, undefined, 0.01),
  number("chipFontWeight", "Chip: Schriftstärke", "Feinschliff: Chat, Befehlsseite", 600, 100, 900, undefined, 100),
  number("chipLetterSpacing", "Chip: Zeichenabstand (em)", "Feinschliff: Chat, Befehlsseite", 0.04, -2, 2, undefined, 0.01),
  inherits(font("chipFont", "Chip: Schrift", "Feinschliff: Chat, Befehlsseite", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
] as const satisfies readonly SettingField[];
