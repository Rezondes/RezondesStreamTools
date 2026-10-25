// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  inherits(color("pandaFur2", "Panda: --fur Farbe (Panda: weisses Fell)", "Feinschliff: Ending", ""), "pandaFur"),
  inherits(color("pandaShade2", "Panda: --shade Farbe (Panda: Schattenton auf Weiss)", "Feinschliff: Ending", ""), "pandaShade"),
  inherits(color("pandaLimb", "Panda: --limb Farbe (Panda: schwarzes Fell)", "Feinschliff: Ending", ""), "pandaPatch"),
  inherits(color("pandaPartPadFill", "Panda Pfote: Füllfarbe Farbe (Panda: Schattenton auf Schwarz)", "Feinschliff: Ending", ""), "pandaPatchShade"),
] as const satisfies readonly SettingField[];
