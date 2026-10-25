// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  number("countGap", "Countdown: Abstand", "Feinschliff: Starting, BRB", 12, 0, 48, "px"),
  number("countMinWidth", "Countdown: Mindestbreite", "Feinschliff: Starting, BRB", 420, 0, 1680, "px"),
  inherits(font("bigFont", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Sniglet", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("bigFont2", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), "font"),
  number("bigFontSize", "Countdown: Schriftgrösse", "Feinschliff: Starting, BRB", 76, 0, 304, "px"),
  inherits(color("bigColor", "Countdown: Textfarbe", "Feinschliff: Starting, BRB", ""), "accentText"),
  number("bigLineHeight", "Countdown: Zeilenhöhe", "Feinschliff: Starting, BRB", 1, 0.5, 3, undefined, 0.01),
  number("cardsAtCount", "Countdown: nach", "Feinschliff: Starting, BRB", 2, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
