// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CAM_INFO_TUNING = [
  number("kfFlicker0p100pOpacity", "Neon flackert (0 %, 100 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
  number("kfFlicker41pOpacity", "Neon flackert (41 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
  number("kfFlicker41pOpacity2", "Neon flackert (41 %): Deckkraft (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 0.7, 0, 1, undefined, 0.01),
  number("kfFlicker43pOpacity", "Neon flackert (43 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
  number("kfFlicker71pOpacity", "Neon flackert (71 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
  number("kfFlicker71pOpacity2", "Neon flackert (71 %): Deckkraft (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 0.5, 0, 1, undefined, 0.01),
  number("kfFlicker72pOpacity", "Neon flackert (72 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
