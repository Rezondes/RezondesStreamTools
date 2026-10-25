// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CAM_TUNING = [
  number("blinkAnimation", "Blinkender Text: Animation Dauer", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 1, 0, 5, "s", 0.05),
  number("blinkAnimation2", "Blinkender Text: Animation Schritte", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 1, 0, 4, undefined, 0.01),
  number("kfRollFromTop", "Röhrenbalken wandert (Start): Lage oben", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", -25, -100, 100, "%"),
] as const satisfies readonly SettingField[];
