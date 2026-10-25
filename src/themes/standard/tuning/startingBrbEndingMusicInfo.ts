// Fine-tuning fields of the Standard theme, group "Feinschliff: Starting, BRB, Ending, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_MUSIC_INFO_TUNING = [
  inherits(color("mutedColor2", "Gedämpfter Text: Textfarbe", "Feinschliff: Starting, BRB, Ending, Musik, Befehlsseite", ""), "mutedColor"),
] as const satisfies readonly SettingField[];
