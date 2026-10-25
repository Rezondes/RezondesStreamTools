// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: BRB" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_TUNING = [
  inherits(color("eisbaerFur", "Eisbär: --fur Farbe (Eisbär: Fell)", "Feinschliff: BRB", ""), "iceFur"),
  inherits(color("eisbaerShade", "Eisbär: --shade Farbe (Eisbär: Schattenton)", "Feinschliff: BRB", ""), "iceShade"),
  inherits(color("eisbaerLimb", "Eisbär: --limb Farbe (Eisbär: Fell)", "Feinschliff: BRB", ""), "iceFur"),
] as const satisfies readonly SettingField[];
