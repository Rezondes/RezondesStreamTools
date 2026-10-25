// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Starting, BRB, Ending, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_MUSIC_TUNING = [
  number("headFontSize", "Kopfzeile: Schriftgrösse (em)", "Feinschliff: Starting, BRB, Ending, Musik", 0.72, 0, 2.88, undefined, 0.01),
  number("headFontWeight", "Kopfzeile: Schriftstärke", "Feinschliff: Starting, BRB, Ending, Musik", 700, 100, 900, undefined, 100),
  number("headLetterSpacing", "Kopfzeile: Zeichenabstand (em)", "Feinschliff: Starting, BRB, Ending, Musik", 0.18, -2, 2, undefined, 0.01),
  inherits(color("headColor", "Kopfzeile: Textfarbe", "Feinschliff: Starting, BRB, Ending, Musik", ""), "accent"),
] as const satisfies readonly SettingField[];
