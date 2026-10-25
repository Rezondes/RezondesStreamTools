// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Chat, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_MUSIC_TUNING = [
  number("kfRiseInFromTranslate", "Aufsteigen (Start): Verschiebung y", "Feinschliff: Chat, Musik", 20, -80, 80, "px"),
  number("kfRiseInFromScale", "Aufsteigen (Start): Grösse", "Feinschliff: Chat, Musik", 0.96, 0, 3.84, undefined, 0.01),
  number("kfRiseInToOpacity", "Aufsteigen (Ende): Deckkraft", "Feinschliff: Chat, Musik", 1, 0, 1, undefined, 0.01),
  number("kfRiseInToScale", "Aufsteigen (Ende): Grösse", "Feinschliff: Chat, Musik", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
