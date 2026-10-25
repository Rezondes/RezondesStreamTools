// Fine-tuning fields of the Dogs theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  number("endTitleTop", "Ending Titel: Lage oben", "Feinschliff: Ending", 60, -240, 240, "px"),
  number("endTitleFontSize", "Ending Titel: Schriftgrösse", "Feinschliff: Ending", 1.16, 0, 4.64, undefined, 0.01),
  inherits(color("endTitleColor", "Ending Titel: Textfarbe", "Feinschliff: Ending", ""), "cream"),
  inherits(font("endTitleFont", "Ending Titel: Schrift", "Feinschliff: Ending", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("endSubTop", "Ending Unterzeile: Lage oben", "Feinschliff: Ending", 196, -784, 784, "px"),
  inherits(color("endSubColor", "Ending Unterzeile: Textfarbe", "Feinschliff: Ending", ""), "nightSub"),
  inherits(color("endSubTextShadow", "Ending Unterzeile: Textschatten Farbe (Tinte (Kontur))", "Feinschliff: Ending", ""), "ink"),
  number("endSubTextShadow2", "Ending Unterzeile: Textschatten y", "Feinschliff: Ending", 5, -40, 40, "px"),
  number("endSubTextShadow3", "Ending Unterzeile: Textschatten Farbanteil", "Feinschliff: Ending", 35, 0, 100, "%"),
  number("endByeTop", "Ending Tschüss: Lage oben", "Feinschliff: Ending", 268, -1072, 1072, "px"),
  number("endByePillFontSize", "Ending: Tschüss-Pille: Schriftgrösse", "Feinschliff: Ending", 1.15, 0, 4.6, undefined, 0.01),
  inherits(color("endByePillColor", "Ending: Tschüss-Pille: Textfarbe", "Feinschliff: Ending", ""), "onAccent"),
  inherits(font("endByePillFont", "Ending: Tschüss-Pille: Schrift", "Feinschliff: Ending", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("endTitleAt", "Ending-Titel: kommt bei", "Feinschliff: Ending", 0.2, 0, 20, "s", 0.01),
  number("endTitleTime", "Ending-Titel: fällt in", "Feinschliff: Ending", 0.7, 0, 20, "s", 0.01),
  number("endTitleFrom", "Ending-Titel: fällt aus Höhe", "Feinschliff: Ending", -60, -400, 400, "px"),
  number("endTitleFade", "Ending-Titel: blendet ein in", "Feinschliff: Ending", 0.3, 0, 20, "s", 0.01),
  number("endSubtitleAt", "Ending-Unterzeile: kommt bei", "Feinschliff: Ending", 0.8, 0, 20, "s", 0.01),
  number("endSubtitleTime", "Ending-Unterzeile: blendet ein in", "Feinschliff: Ending", 0.5, 0, 20, "s", 0.01),
  number("endByeAt", "Ending-Pille: kommt bei", "Feinschliff: Ending", 1.2, 0, 20, "s", 0.01),
  number("endByeTime", "Ending-Pille: wächst in", "Feinschliff: Ending", 0.5, 0, 20, "s", 0.01),
] as const satisfies readonly SettingField[];
