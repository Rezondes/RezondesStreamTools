// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Alerts, Kamera-Rahmen, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_CAM_MUSIC_TUNING = [
  number("iconPartLineStrokeWidth", "Symbol Linie: Linienstärke", "Feinschliff: Alerts, Kamera-Rahmen, Musik", 6, 0, 24),
] as const satisfies readonly SettingField[];
