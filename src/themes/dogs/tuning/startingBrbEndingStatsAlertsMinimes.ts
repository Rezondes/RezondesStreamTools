// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Minimes" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_ALERTS_MINIMES_TUNING = [
  number("endingLie", "Ending: legt sich bei", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Minimes", 2.8, 0, 20, "s", 0.01),
] as const satisfies readonly SettingField[];
