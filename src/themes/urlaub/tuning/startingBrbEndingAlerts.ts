// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, BRB, Ending, Alerts" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_TUNING = [
  number("kfUnrollFromScale", "Entrollen (Start): Grösse x", "Feinschliff: Starting, BRB, Ending, Alerts", 0.2, 0, 2, undefined, 0.01),
  number("kfUnrollFromScale2", "Entrollen (Start): Grösse y", "Feinschliff: Starting, BRB, Ending, Alerts", 1, 0, 4, undefined, 0.01),
  number("kfUnrollToOpacity", "Entrollen (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts", 1, 0, 1, undefined, 0.01),
  number("kfUnrollToScale", "Entrollen (Ende): Grösse x", "Feinschliff: Starting, BRB, Ending, Alerts", 1, 0, 4, undefined, 0.01),
  number("kfUnrollToScale2", "Entrollen (Ende): Grösse y", "Feinschliff: Starting, BRB, Ending, Alerts", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
