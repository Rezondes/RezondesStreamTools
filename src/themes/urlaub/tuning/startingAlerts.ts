// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, Alerts" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_ALERTS_TUNING = [
  number("kfBobFromRotate", "Schaukeln (Start): Drehung (Grad)", "Feinschliff: Starting, Alerts", -6, -360, 360),
  number("kfBobToTranslate", "Schaukeln (Ende): Verschiebung y", "Feinschliff: Starting, Alerts", 5, -40, 40, "px"),
  number("kfBobToRotate", "Schaukeln (Ende): Drehung (Grad)", "Feinschliff: Starting, Alerts", 6, -360, 360),
  number("kfBobFromRotate2", "Schaukeln (Start): Drehung (Grad)", "Feinschliff: Starting, Alerts", -2, -360, 360),
  number("kfBobToTranslate2", "Schaukeln (Ende): Verschiebung y", "Feinschliff: Starting, Alerts", 6, -40, 40, "px"),
  number("kfBobToRotate2", "Schaukeln (Ende): Drehung (Grad)", "Feinschliff: Starting, Alerts", 2, -360, 360),
] as const satisfies readonly SettingField[];
