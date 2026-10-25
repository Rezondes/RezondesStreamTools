// Fine-tuning fields of the Kebab theme, group "Feinschliff: Statistik" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_TUNING = [
  number("statsBonBoxLeft", "Tagesabschluss: Bon-Kasten: Lage links", "Feinschliff: Statistik", 50, -150, 150, "%"),
  number("statsBonBoxTop", "Tagesabschluss: Bon-Kasten: Lage oben", "Feinschliff: Statistik", 8, -40, 40, "px"),
  number("statsBonBoxTransform", "Tagesabschluss: Bon-Kasten: Verformung Verschiebung x", "Feinschliff: Statistik", -50, -150, 150, "%"),
  number("closingPrinterAt", "Drucker: ab", "Feinschliff: Statistik", 0.1, 0, 10, "s", 0.01),
  number("closingBonAt", "Bon: wird gedruckt ab", "Feinschliff: Statistik", 0.4, 0, 10, "s", 0.01),
  number("closingPrintedAt", "Bon: gedruckt ab", "Feinschliff: Statistik", 1.5, 0, 10, "s", 0.01),
  number("closingRowGap", "Zeilen: Versatz je Zeile", "Feinschliff: Statistik", 0.25, 0, 3, "s", 0.01),
  number("closingSteps", "Bon: Druckschritte", "Feinschliff: Statistik", 16, 0, 100),
  number("closingDropFrom", "Drucker: fällt aus Höhe", "Feinschliff: Statistik", -200, -2000, 2000, "px"),
  number("closingDropTime", "Drucker: fällt in", "Feinschliff: Statistik", 0.45, 0, 3, "s", 0.01),
  number("closingFeedTime", "Bon: wird gedruckt in", "Feinschliff: Statistik", 1, 0, 10, "s", 0.01),
  number("closingHitScale", "Stempel: trifft aus Grösse", "Feinschliff: Statistik", 2.6, 0, 10, undefined, 0.05),
  number("closingHitTime", "Stempel: trifft in", "Feinschliff: Statistik", 0.18, 0, 3, "s", 0.01),
  number("closingShake", "Bon: wackelt um", "Feinschliff: Statistik", 6, -100, 100, "px"),
  number("closingShakeTime", "Bon: Wackler dauert", "Feinschliff: Statistik", 0.04, 0, 1, "s", 0.01),
  number("closingShakes", "Bon: Wackler", "Feinschliff: Statistik", 3, 0, 20),
] as const satisfies readonly SettingField[];
