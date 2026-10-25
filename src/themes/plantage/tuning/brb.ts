// Fine-tuning fields of the Plantage theme, group "Feinschliff: BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_TUNING = [
  number("brbStCountMinWidth", "BRB: Countdown-Karte: Mindestbreite", "Feinschliff: BRB", 520, 0, 2080, "px"),
  number("brbStCountTranslate", "BRB: Countdown-Karte: Verschiebung x", "Feinschliff: BRB", -50, -150, 150, "%"),
  number("brbStCountPaddingInline", "BRB: Countdown-Karte: padding-inline", "Feinschliff: BRB", 44, 0, 176, "px"),
  number("brbStCountBFontSize", "BRB: Countdown-Zahl: Schriftgrösse", "Feinschliff: BRB", 64, 0, 256, "px"),
  inherits(color("brbStCountBColor", "BRB: Countdown-Zahl: Textfarbe", "Feinschliff: BRB", ""), ""),
  inherits(font("brbStCountBFont", "BRB: Countdown-Zahl: Schrift", "Feinschliff: BRB", "", ["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
