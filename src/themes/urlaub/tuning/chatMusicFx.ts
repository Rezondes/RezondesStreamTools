// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Chat, Musik, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_MUSIC_FX_TUNING = [
  number("kfFadeOutFromOpacity", "Ausblenden (Start): Deckkraft", "Feinschliff: Chat, Musik, Effekte", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
