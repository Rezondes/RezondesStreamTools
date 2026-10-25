// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB, Ending, Musik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_MUSIC_TUNING = [
  number("kfInFromTransform", "Einblenden (Start): Verformung Verschiebung y", "Feinschliff: Starting, BRB, Ending, Musik", 6, -40, 40, "px"),
  number("kfInToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Starting, BRB, Ending, Musik", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
