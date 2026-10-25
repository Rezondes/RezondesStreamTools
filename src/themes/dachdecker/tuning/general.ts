// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  inherits(color("toneCopperColor", "Ton Kupfer: Textfarbe", "Feinschliff: Allgemein", ""), "copper"),
  inherits(color("toneAccentColor", "Ton Akzent: Textfarbe", "Feinschliff: Allgemein", ""), "accent"),
  inherits(color("toneRainColor", "Ton Regen: Textfarbe", "Feinschliff: Allgemein", ""), "rain"),
  inherits(color("toneLineColor", "Ton Linie: Textfarbe", "Feinschliff: Allgemein", ""), "line"),
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.2, 0.5, 3, undefined, 0.01),
] as const satisfies readonly SettingField[];
