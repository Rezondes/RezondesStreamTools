// Fine-tuning fields of the Dogs theme, group "Feinschliff: Chat, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_MUSIC_TUNING = [
  number("kfPopFromTransform", "Ploppen (Start): Verformung Verschiebung y", "Feinschliff: Chat, Musik", 20, -80, 80, "px"),
] as const satisfies readonly SettingField[];
