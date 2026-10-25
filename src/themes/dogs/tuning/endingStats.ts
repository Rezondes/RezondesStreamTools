// Fine-tuning fields of the Dogs theme, group "Feinschliff: Ending, Statistik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_STATS_TUNING = [
  number("endingWalk", "Ending: Hund läuft herein in", "Feinschliff: Ending, Statistik", 2.2, 0, 20, "s", 0.01),
  number("endingEnter", "Ending: kommt von rechts aussen (Pixel)", "Feinschliff: Ending, Statistik", 8, 0, 200),
  number("endingSleep", "Ending: schläft ab", "Feinschliff: Ending, Statistik", 4, 0, 20, "s", 0.01),
  number("endingWag", "Ending: Wedeln je Sekunde", "Feinschliff: Ending, Statistik", 10, 0, 60),
  number("endingLyingWag", "Ending: Wedeln im Liegen je Sekunde", "Feinschliff: Ending, Statistik", 2, 0, 60),
  number("endingSink", "Ending: sinkt ins Körbchen (Pixel)", "Feinschliff: Ending, Statistik", 5, 0, 40),
  number("zzzRise", "Zzz: steigt (Pixel)", "Feinschliff: Ending, Statistik", 34, 0, 400),
  number("zzzDrift", "Zzz: driftet nach links (Pixel)", "Feinschliff: Ending, Statistik", 16, -400, 400),
  number("zzzFade", "Zzz: Ausblenden (Faktor)", "Feinschliff: Ending, Statistik", 2.5, 0, 20, undefined, 0.1),
  number("endingDarkness", "Ending: Raum dunkelt bis", "Feinschliff: Ending, Statistik", 0.35, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
