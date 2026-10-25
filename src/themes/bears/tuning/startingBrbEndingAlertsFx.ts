// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_FX_TUNING = [
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Effekte", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
