// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Starting, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_MUSIC_TUNING = [
  inherits(color("dimStroke", "Mass: Linienfarbe Farbe (Plan-Linien und Text)", "Feinschliff: Starting, Musik", ""), "line"),
  number("dimStrokeWidth", "Mass: Linienstärke", "Feinschliff: Starting, Musik", 1.5, 0, 6, undefined, 0.01),
  number("dimOpacity", "Mass: Deckkraft", "Feinschliff: Starting, Musik", 0.7, 0, 1, undefined, 0.01),
  number("tickOpacity", "Haken: Deckkraft", "Feinschliff: Starting, Musik", 0.4, 0, 1, undefined, 0.01),
  inherits(color("dimDoneStroke", "Mass fertig: Linienfarbe Farbe (Signatur Terrakotta)", "Feinschliff: Starting, Musik", ""), "accent"),
  number("dimDoneStrokeWidth", "Mass fertig: Linienstärke", "Feinschliff: Starting, Musik", 3, 0, 12),
  inherits(color("dimDoneFilter", "Mass fertig: Filter Farbe (Signatur Terrakotta)", "Feinschliff: Starting, Musik", ""), "accent"),
  number("dimDoneFilter2", "Mass fertig: Filter Schlagschatten Anteil von „Text-Leuchten (0 = aus)“ (%)", "Feinschliff: Starting, Musik", 100, 0, 400),
  number("dimDoneFilter3", "Mass fertig: Filter Schlagschatten", "Feinschliff: Starting, Musik", 10, 0, 40, "px"),
] as const satisfies readonly SettingField[];
