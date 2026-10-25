// Fine-tuning fields of the Standard theme, group "Feinschliff: Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const MUSIC_INFO_TUNING = [
  inherits(color("eyebrowColor", "Überzeile: Textfarbe", "Feinschliff: Musik, Befehlsseite", ""), "accent2"),
  number("eyebrowFontSize", "Überzeile: Schriftgrösse (em)", "Feinschliff: Musik, Befehlsseite", 0.7, 0, 2.8, undefined, 0.01),
  number("eyebrowFontWeight", "Überzeile: Schriftstärke", "Feinschliff: Musik, Befehlsseite", 600, 100, 900, undefined, 100),
  number("eyebrowLetterSpacing", "Überzeile: Zeichenabstand (em)", "Feinschliff: Musik, Befehlsseite", 0.12, -2, 2, undefined, 0.01),
  inherits(font("eyebrowFont", "Überzeile: Schrift", "Feinschliff: Musik, Befehlsseite", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("lineFontWeight", "Hauptzeile: Schriftstärke", "Feinschliff: Musik, Befehlsseite", 700, 100, 900, undefined, 100),
  inherits(color("lineColor", "Hauptzeile: Textfarbe", "Feinschliff: Musik, Befehlsseite", ""), "textColor"),
  inherits(font("lineFont", "Hauptzeile: Schrift", "Feinschliff: Musik, Befehlsseite", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
] as const satisfies readonly SettingField[];
