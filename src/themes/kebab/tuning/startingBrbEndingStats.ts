// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB, Ending, Statistik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_TUNING = [
  inherits(font("bonTitleFont", "Bon Titel: Schrift", "Feinschliff: Starting, BRB, Ending, Statistik", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("bonTitleFontSize", "Bon Titel: Schriftgrösse (em)", "Feinschliff: Starting, BRB, Ending, Statistik", 1.35, 0, 5.4, undefined, 0.01),
  number("bonTitleLineHeight", "Bon Titel: Zeilenhöhe", "Feinschliff: Starting, BRB, Ending, Statistik", 1.1, 0.5, 3, undefined, 0.01),
  inherits(color("bonTitleColor", "Bon Titel: Textfarbe", "Feinschliff: Starting, BRB, Ending, Statistik", ""), "redText"),
  number("bonTitleMarginTop", "Bon Titel: Abstand oben", "Feinschliff: Starting, BRB, Ending, Statistik", 10, -40, 40, "px"),
] as const satisfies readonly SettingField[];
