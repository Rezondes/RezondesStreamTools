// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Alerts, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_MUSIC_TUNING = [
  number("shapePartLineStrokeWidth", "Formen: Linie: Linienstärke", "Feinschliff: Alerts, Musik", 4, 0, 16),
] as const satisfies readonly SettingField[];
