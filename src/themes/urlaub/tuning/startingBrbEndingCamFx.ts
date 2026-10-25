// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CAM_FX_TUNING = [
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Effekte", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
