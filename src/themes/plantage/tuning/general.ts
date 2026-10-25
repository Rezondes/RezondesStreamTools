// Fine-tuning fields of the Plantage theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.3, 0.5, 3, undefined, 0.01),
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("kfFadeOutFromOpacity", "Ausblenden (Start): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
