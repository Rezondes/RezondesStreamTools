// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Chat, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CHAT_MUSIC_TUNING = [
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Chat, Musik", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
