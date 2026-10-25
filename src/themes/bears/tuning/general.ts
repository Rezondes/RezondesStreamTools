// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.3, 0.5, 3, undefined, 0.01),
  inherits(color("flashBackground", "Blitz: Hintergrund Farbe (Text hell)", "Feinschliff: Allgemein", ""), "textColor"),
  number("nameBottom", "Name: Lage unten", "Feinschliff: Allgemein", 54, -216, 216, "px"),
  number("nameFontSize", "Name: Schriftgrösse", "Feinschliff: Allgemein", 24, 0, 96, "px"),
  inherits(color("nameColor", "Name: Textfarbe", "Feinschliff: Allgemein", ""), "textDark"),
  inherits(font("nameFont", "Name: Schrift", "Feinschliff: Allgemein", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("kfFadeOutFromOpacity", "Ausblenden (Start): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
