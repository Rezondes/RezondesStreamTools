// Fine-tuning fields of the Chaos theme, group "Feinschliff: Alerts, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_MUSIC_TUNING = [
  number("kfSlap0pScale", "Aufklatschen (0 %): Grösse", "Feinschliff: Alerts, Musik", 1.25, 0, 5, undefined, 0.01),
  number("kfSlap60pOpacity", "Aufklatschen (60 %): Deckkraft", "Feinschliff: Alerts, Musik", 1, 0, 1, undefined, 0.01),
  number("kfSlap60pScale", "Aufklatschen (60 %): Grösse", "Feinschliff: Alerts, Musik", 0.97, 0, 3.88, undefined, 0.01),
  number("kfSlap100pScale", "Aufklatschen (100 %): Grösse", "Feinschliff: Alerts, Musik", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
