// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite, Minimes" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_CHAT_CAM_MUSIC_INFO_MINIMES_TUNING = [
  number("kfBlink0p96pTransform", "Blinzeln (0 %, 96 %): Verformung Grösse y", "Feinschliff: Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite, Minimes", 1, -4, 4, undefined, 0.01),
  number("kfBlink97p99pTransform", "Blinzeln (97 %, 99 %): Verformung Grösse y", "Feinschliff: Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite, Minimes", 0.1, -2, 2, undefined, 0.01),
] as const satisfies readonly SettingField[];
