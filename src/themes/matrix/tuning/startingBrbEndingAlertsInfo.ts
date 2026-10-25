// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_INFO_TUNING = [
  number("rainGlyphScale", "Regen: Zeichen in der Zelle (Anteil)", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 1.05, 0, 3, undefined, 0.01),
  number("rainHeadScale", "Regen: Kopfzeichen (Anteil der Zelle)", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 1.6, 0, 4, undefined, 0.01),
  number("rainHeadAlpha", "Regen: Leuchten des Kopfs (Deckkraft)", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 0.55, 0, 1, undefined, 0.01),
  number("rainFade", "Regen: Spur blendet aus (Stärke)", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 1.6, 0, 6, undefined, 0.05),
  number("rainShake", "Regen: Wackeln beim Glitch", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 40, 0, 400, "px"),
  number("rainShaken", "Regen: Anteil wackelnder Zeilen", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 0.3, 0, 1, undefined, 0.01),
  number("rainMidBlur", "Regen Mitte: Anteil der Unschärfe der fernen Ebene", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 0.33, 0, 1, undefined, 0.01),
  inherits(color("rainHeadColor", "Regen: Farbe des Kopfs", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", ""), "flash"),
  inherits(color("rainFarColor", "Regen fern: Farbe", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", ""), "dim"),
  inherits(color("rainNearColor", "Regen nah: Farbe", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", ""), "accent"),
  number("rainMidMix", "Regen Mitte: Farbe zwischen fern und nah (Anteil)", "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite", 0.5, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
