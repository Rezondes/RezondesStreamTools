// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_TUNING = [
  number("shapePartLineStrokeWidth", "Form Linie: Linienstärke", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", 4, 0, 16),
] as const satisfies readonly SettingField[];
