// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite, Minimes" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_MINIMES_TUNING = [
  inherits(color("poseSelfiePartPropFill", "Pose Selfie Gegenstand: Füllfarbe Farbe (Handy: Hülle)", "Feinschliff: Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite, Minimes", ""), "phoneCase"),
] as const satisfies readonly SettingField[];
