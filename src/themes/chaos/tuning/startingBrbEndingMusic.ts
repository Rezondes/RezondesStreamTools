// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_MUSIC_TUNING = [
  number("progressBarWidth", "Fortschritt Balken: Breite", "Feinschliff: Starting, BRB, Ending, Musik", 640, 0, 2560, "px"),
  number("progressBarHeight", "Fortschritt Balken: Höhe", "Feinschliff: Starting, BRB, Ending, Musik", 14, 0, 56, "px"),
  inherits(color("progressBarBackground", "Fortschritt Balken: Hintergrund Farbe (Violett hell)", "Feinschliff: Starting, BRB, Ending, Musik", ""), "violetLight"),
  number("progressBarBackground2", "Fortschritt Balken: Hintergrund Farbanteil", "Feinschliff: Starting, BRB, Ending, Musik", 55, 0, 100, "%"),
  number("progressBarBorderRadius", "Fortschritt Balken: Eckenradius oben", "Feinschliff: Starting, BRB, Ending, Musik", 3, 0, 40, "px"),
  number("progressBarBorderRadius2", "Fortschritt Balken: Eckenradius rechts", "Feinschliff: Starting, BRB, Ending, Musik", 9, 0, 40, "px"),
  number("progressBarBorderRadius3", "Fortschritt Balken: Eckenradius unten", "Feinschliff: Starting, BRB, Ending, Musik", 4, 0, 40, "px"),
  number("progressBarBorderRadius4", "Fortschritt Balken: Eckenradius links", "Feinschliff: Starting, BRB, Ending, Musik", 7, 0, 40, "px"),
  inherits(color("progressBarSpanBackground", "Fortschritt: Füllung: Hintergrund Farbe (Signatur Magenta)", "Feinschliff: Starting, BRB, Ending, Musik", ""), "accent"),
  inherits(color("progressBarSpanBoxShadow", "Fortschritt: Füllung: Schatten Farbe (Signatur Magenta)", "Feinschliff: Starting, BRB, Ending, Musik", ""), "accent"),
  number("progressBarSpanBoxShadow2", "Fortschritt: Füllung: Schatten Unschärfe", "Feinschliff: Starting, BRB, Ending, Musik", 10, 0, 40, "px"),
] as const satisfies readonly SettingField[];
