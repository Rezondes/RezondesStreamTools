// Fine-tuning fields of the Plantage theme, group "Feinschliff: Starting, Kamera-Rahmen" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_CAM_TUNING = [
  number("kfPlopFromTranslate", "Mango plumpst (Start): Verschiebung y", "Feinschliff: Starting, Kamera-Rahmen", 260, -1040, 1040, "px"),
  number("kfPlopToOpacity", "Mango plumpst (Ende): Deckkraft", "Feinschliff: Starting, Kamera-Rahmen", 1, 0, 1, undefined, 0.01),
  number("kfPlopFromScale", "Mango plumpst (Start): Grösse", "Feinschliff: Starting, Kamera-Rahmen", 0.6, 0, 2.4, undefined, 0.01),
  number("kfPlopToScale", "Mango plumpst (Ende): Grösse", "Feinschliff: Starting, Kamera-Rahmen", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
