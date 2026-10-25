// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_MUSIC_TUNING = [
  number("progressZigzagWidth", "Fortschritt Zickzack: Breite", "Feinschliff: Starting, Musik", 640, 0, 2560, "px"),
  number("progressZigzagHeight", "Fortschritt Zickzack: Höhe", "Feinschliff: Starting, Musik", 36, 0, 144, "px"),
  number("progressZigzagPathStrokeWidth", "Fortschritt Zickzack Linie: Linienstärke", "Feinschliff: Starting, Musik", 6, 0, 40, "px"),
  inherits(color("progressTrackStroke", "Fortschritt Titelanzeige: Linienfarbe Farbe (Violett hell)", "Feinschliff: Starting, Musik", ""), "violetLight"),
  number("progressTrackStroke2", "Fortschritt Titelanzeige: Linienfarbe Farbanteil", "Feinschliff: Starting, Musik", 55, 0, 100, "%"),
  inherits(color("progressDoneStroke", "Fortschritt fertig: Linienfarbe Farbe (Signatur Magenta)", "Feinschliff: Starting, Musik", ""), "accent"),
  number("progressDoneStrokeDasharray", "Fortschritt fertig: Strichmuster", "Feinschliff: Starting, Musik", 1, 0, 4, undefined, 0.01),
  inherits(color("progressDoneFilter", "Fortschritt fertig: Filter Farbe (Signatur Magenta)", "Feinschliff: Starting, Musik", ""), "accent"),
  number("progressDoneFilter2", "Fortschritt fertig: Filter Schlagschatten", "Feinschliff: Starting, Musik", 10, 0, 40, "px"),
] as const satisfies readonly SettingField[];
