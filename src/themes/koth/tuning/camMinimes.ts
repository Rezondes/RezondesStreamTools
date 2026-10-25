// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Kamera-Rahmen, Minimes" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CAM_MINIMES_TUNING = [
  number("kfBlink0p100pOpacity", "Blinken (0 %, 100 %): Deckkraft", "Feinschliff: Kamera-Rahmen, Minimes", 1, 0, 1, undefined, 0.01),
  number("kfBlink50pOpacity", "Blinken (50 %): Deckkraft", "Feinschliff: Kamera-Rahmen, Minimes", 0.15, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
