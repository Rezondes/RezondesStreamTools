// Fine-tuning fields of the Standard theme, group "Feinschliff: BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_TUNING = [
  number("stNoteFontSize", "Untertitel: Schriftgrösse", "Feinschliff: BRB", 32, 0, 128, "px"),
  inherits(color("stNoteColor", "Untertitel: Textfarbe", "Feinschliff: BRB", ""), "mutedColor"),
  inherits(font("stNoteFont", "Untertitel: Schrift", "Feinschliff: BRB", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
] as const satisfies readonly SettingField[];
