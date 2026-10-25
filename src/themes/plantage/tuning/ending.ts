// Fine-tuning fields of the Plantage theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  number("endingStCountMinWidth", "Ending: Countdown-Karte: Mindestbreite", "Feinschliff: Ending", 520, 0, 2080, "px"),
  number("endingStCountTranslate", "Ending: Countdown-Karte: Verschiebung x", "Feinschliff: Ending", -50, -150, 150, "%"),
  number("endingStCountPaddingInline", "Ending: Countdown-Karte: padding-inline", "Feinschliff: Ending", 44, 0, 176, "px"),
  number("endingStCountBFontSize", "Ending: Countdown-Zahl: Schriftgrösse", "Feinschliff: Ending", 64, 0, 256, "px"),
  inherits(color("endingStCountBColor", "Ending: Countdown-Zahl: Textfarbe", "Feinschliff: Ending", ""), ""),
  inherits(font("endingStCountBFont", "Ending: Countdown-Zahl: Schrift", "Feinschliff: Ending", "", ["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
