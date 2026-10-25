// Fine-tuning fields of the Plantage theme, group "Feinschliff: Starting, BRB, Ending, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_INFO_TUNING = [
  number("sunX", "Sonne: von links", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 520, -400, 2400, "px"),
  number("sunLow", "Sonne: tiefster Stand von oben", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 700, -400, 1500, "px"),
  number("sunRise", "Sonne: steigt um", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 330, -1000, 1000, "px"),
  number("sunSize", "Sonne: Radius", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 70, 0, 400, "px"),
  number("sunGlowSize", "Sonne: Schein", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 620, 0, 3000, "px"),
  number("sunRays", "Sonne: Strahlen", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 14, 0, 60),
  number("sunRayWidth", "Sonne: Strahlbreite (Bogenmass)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 0.06, 0, 1, undefined, 0.01),
  number("sunRayLength", "Sonne: Strahllänge", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 900, 0, 4000, "px"),
  number("sunRayAlpha", "Sonne: Strahlen Deckkraft", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 0.09, 0, 1, undefined, 0.01),
  number("sunTurn", "Sonne: Strahlen drehen (Bogenmass pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 0.03, 0, 2, undefined, 0.01),
] as const satisfies readonly SettingField[];
