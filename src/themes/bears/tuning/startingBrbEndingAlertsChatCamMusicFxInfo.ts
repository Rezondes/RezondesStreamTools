// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_TUNING = [
  number("facingRechtsHeroScale", "blickt rechts Bär: Grösse x", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite", -1, -4, 4, undefined, 0.01),
  number("facingRechtsHeroScale2", "blickt rechts Bär: Grösse y", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite", 1, 0, 4, undefined, 0.01),
  number("facingRechtsPartSignTextTransform", "blickt rechts Schild Text: Verformung Grösse x", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite", -1, -4, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
