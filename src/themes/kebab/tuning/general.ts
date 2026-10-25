// Fine-tuning fields of the Kebab theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.25, 0.5, 3, undefined, 0.01),
  number("onCounterKbFloor", "auf Theke: Abstand zum Boden Anteil von „Abstand zum unteren Rand“ (%)", "Feinschliff: Allgemein", 100, 0, 400),
  number("onCounterKbFloor2", "auf Theke: Abstand zum Boden", "Feinschliff: Allgemein", 4, 0, 40, "px"),
] as const satisfies readonly SettingField[];
