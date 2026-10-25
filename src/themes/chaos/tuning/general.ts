// Fine-tuning fields of the Chaos theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.25, 0.5, 3, undefined, 0.01),
] as const satisfies readonly SettingField[];
