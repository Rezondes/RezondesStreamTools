// Fine-tuning fields of the Chaos theme, group "Feinschliff: Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const MUSIC_INFO_TUNING = [
  inherits(color("mutedColor2", "Gedämpfter Text: Textfarbe", "Feinschliff: Musik, Befehlsseite", ""), "mutedColor"),
] as const satisfies readonly SettingField[];
