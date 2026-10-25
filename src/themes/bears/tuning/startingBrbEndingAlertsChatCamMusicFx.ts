// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_TUNING = [
  number("kfPlopp0pScale", "Plopp-Einblendung (0 %): Grösse", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte", 0.7, 0, 2.8, undefined, 0.01),
  number("kfPlopp70pScale", "Plopp-Einblendung (70 %): Grösse", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte", 1.05, 0, 4.2, undefined, 0.01),
  number("kfPlopp70pOpacity", "Plopp-Einblendung (70 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfPlopp100pScale", "Plopp-Einblendung (100 %): Grösse", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
