// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_INFO_TUNING = [
  number("kfDrawFromStrokeDashoffset", "Zeichnen (Start): Strichversatz", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
