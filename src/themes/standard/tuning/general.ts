// Fine-tuning fields of the Standard theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("dustBannerScale", "Lichtstaub in Stinger und Bannern: Grösse (Anteil)", "Feinschliff: Allgemein", 0.25, 0, 2, undefined, 0.01),
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.35, 0.5, 3, undefined, 0.01),
] as const satisfies readonly SettingField[];
