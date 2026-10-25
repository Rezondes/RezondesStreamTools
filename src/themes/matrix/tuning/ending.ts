// Fine-tuning fields of the Matrix theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  number("afterOffFontSize", "Text nach dem Ausschalten: Schriftgrösse", "Feinschliff: Ending", 48, 0, 192, "px"),
  number("afterOffLetterSpacing", "Text nach dem Ausschalten: Zeichenabstand", "Feinschliff: Ending", 4, -40, 40, "px"),
  inherits(color("afterOffColor", "Text nach dem Ausschalten: Textfarbe", "Feinschliff: Ending", ""), "accent"),
  inherits(font("afterOffFont", "Text nach dem Ausschalten: Schrift", "Feinschliff: Ending", "", ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]), "font"),
] as const satisfies readonly SettingField[];
