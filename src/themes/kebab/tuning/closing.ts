// Fine-tuning fields of the Kebab theme, group "Feinschliff: Tagesabschluss" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CLOSING_TUNING = [
  number("statsBonBoxLeft", "Tagesabschluss: Bon-Kasten: Lage links", "Feinschliff: Tagesabschluss", 50, -150, 150, "%"),
  number("statsBonBoxTop", "Tagesabschluss: Bon-Kasten: Lage oben", "Feinschliff: Tagesabschluss", 8, -40, 40, "px"),
  number("statsBonBoxTransform", "Tagesabschluss: Bon-Kasten: Verformung Verschiebung x", "Feinschliff: Tagesabschluss", -50, -150, 150, "%"),
  number("closingPrinterAt", "Drucker: ab", "Feinschliff: Tagesabschluss", 0.1, 0, 10, "s", 0.01),
  number("closingBonAt", "Bon: wird gedruckt ab", "Feinschliff: Tagesabschluss", 0.4, 0, 10, "s", 0.01),
  number("closingPrintedAt", "Bon: gedruckt ab", "Feinschliff: Tagesabschluss", 1.5, 0, 10, "s", 0.01),
  number("closingRowGap", "Zeilen: Versatz je Zeile", "Feinschliff: Tagesabschluss", 0.25, 0, 3, "s", 0.01),
  number("closingSteps", "Bon: Druckschritte", "Feinschliff: Tagesabschluss", 16, 0, 100),
  number("closingDropFrom", "Drucker: fällt aus Höhe", "Feinschliff: Tagesabschluss", -200, -2000, 2000, "px"),
  number("closingDropTime", "Drucker: fällt in", "Feinschliff: Tagesabschluss", 0.45, 0, 3, "s", 0.01),
  number("closingFeedTime", "Bon: wird gedruckt in", "Feinschliff: Tagesabschluss", 1, 0, 10, "s", 0.01),
  number("closingHitScale", "Stempel: trifft aus Grösse", "Feinschliff: Tagesabschluss", 2.6, 0, 10, undefined, 0.05),
  number("closingHitTime", "Stempel: trifft in", "Feinschliff: Tagesabschluss", 0.18, 0, 3, "s", 0.01),
  number("closingShake", "Bon: wackelt um", "Feinschliff: Tagesabschluss", 6, -100, 100, "px"),
  number("closingShakeTime", "Bon: Wackler dauert", "Feinschliff: Tagesabschluss", 0.04, 0, 1, "s", 0.01),
  number("closingShakes", "Bon: Wackler", "Feinschliff: Tagesabschluss", 3, 0, 20),
] as const satisfies readonly SettingField[];
