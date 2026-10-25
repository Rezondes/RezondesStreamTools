// Fine-tuning fields of the Matrix theme, group "Feinschliff: BRB" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_TUNING = [
  number("retryMinHeight", "Neuer Versuch: Mindesthöhe (em)", "Feinschliff: BRB", 1.2, 0, 4.8, undefined, 0.01),
  inherits(color("retryColor", "Neuer Versuch: Textfarbe", "Feinschliff: BRB", ""), "highlight"),
] as const satisfies readonly SettingField[];
