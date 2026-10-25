// Fine-tuning fields of the Standard theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerAccent", "Verlaufskante: Farbe 1", "Stinger", ""), "accent"),
  inherits(color("stingerAccent2", "Verlaufskante: Farbe 2", "Stinger", ""), "accent2"),
  inherits(color("stingerBackground", "Streifen: Hintergrund", "Stinger", ""), "background"),
  inherits(color("stingerTextColor", "Text: Farbe", "Stinger", ""), "textColor"),
  inherits(font("stingerFont", "Text: Schrift", "Stinger", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("stingerTextSize", "Text: Grösse", "Stinger", 120, 10, 400, "px"),
  number("stingerTextWeight", "Text: Schriftstärke", "Stinger", 800, 100, 900, undefined, 100),
  number("stingerTextRise", "Text: steigt um", "Stinger", 40, -400, 400, "px"),
  number("stingerTextWindow", "Text: sichtbar um den Übergang (Anteil)", "Stinger", 0.5, 0, 1, undefined, 0.01),
  number("stingerFront", "Verlaufskante: Breite", "Stinger", 28, 0, 400, "px"),
  number("stingerInShare", "Streifen: Einfahrt (Anteil bis zum Übergang)", "Stinger", 0.7, 0, 1, undefined, 0.01),
  number("stingerOutShare", "Streifen: Ausfahrt (Anteil nach dem Übergang)", "Stinger", 0.7, 0, 1, undefined, 0.01),
  number("stingerStagger", "Streifen: Versatz (Anteil)", "Stinger", 0.3, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
