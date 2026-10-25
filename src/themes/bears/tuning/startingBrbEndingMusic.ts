// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_MUSIC_TUNING = [
  number("progressBarWidth", "Fortschritt Balken: Breite", "Feinschliff: Starting, BRB, Ending, Musik", 380, 0, 1520, "px"),
  number("progressBarHeight", "Fortschritt Balken: Höhe", "Feinschliff: Starting, BRB, Ending, Musik", 22, 0, 88, "px"),
  inherits(color("progressBarBorder", "Fortschritt Balken: Rand Farbe (Kontur)", "Feinschliff: Starting, BRB, Ending, Musik", ""), "outline"),
  number("progressBarBorder2", "Fortschritt Balken: Rand Stärke", "Feinschliff: Starting, BRB, Ending, Musik", 4, 0, 40, "px"),
  number("progressBarBorderRadius", "Fortschritt Balken: Eckenradius", "Feinschliff: Starting, BRB, Ending, Musik", 999, 0, 999, "px"),
  inherits(color("progressBarBackground", "Fortschritt Balken: Hintergrund Farbe (Papier: Schattenton)", "Feinschliff: Starting, BRB, Ending, Musik", ""), "paperShade"),
  inherits(color("progressBarSpanBackground", "Fortschritt: Füllung: Hintergrund Farbe (Akzent (Ziegelrot))", "Feinschliff: Starting, BRB, Ending, Musik", ""), "accent"),
  number("progressBarSpanTransition", "Fortschritt: Füllung: Übergang Dauer Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Starting, BRB, Ending, Musik", 100, 0, 400),
] as const satisfies readonly SettingField[];
