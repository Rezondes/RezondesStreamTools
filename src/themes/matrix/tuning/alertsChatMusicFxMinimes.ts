// Fine-tuning fields of the Matrix theme, group "Feinschliff: Alerts, Chat, Musik, Effekte, Minimes" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING = [
  number("kfFadeOutFromOpacity", "Ausblenden (Start): Deckkraft", "Feinschliff: Alerts, Chat, Musik, Effekte, Minimes", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
