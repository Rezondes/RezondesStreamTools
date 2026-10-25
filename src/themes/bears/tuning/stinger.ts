// Fine-tuning fields of the Bärenbande theme, group "Stinger" (tuning.ts puts the groups together).
import { font, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(font("stingerFont", "Text: Schrift", "Stinger", "", ["Sniglet", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
] as const satisfies readonly SettingField[];
