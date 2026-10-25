// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Alerts, Kamera-Rahmen, Musik, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_CAM_MUSIC_FX_TUNING = [
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Alerts, Kamera-Rahmen, Musik, Effekte", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
