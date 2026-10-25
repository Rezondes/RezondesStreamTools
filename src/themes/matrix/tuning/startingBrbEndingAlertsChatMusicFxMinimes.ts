// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Effekte, Minimes" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING = [
  number("kfFadeInToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Effekte, Minimes", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
