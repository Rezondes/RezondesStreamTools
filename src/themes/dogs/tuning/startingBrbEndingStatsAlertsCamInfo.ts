// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_ALERTS_CAM_INFO_TUNING = [
  number("pillGap", "Pille: Abstand", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 12, 0, 48, "px"),
  number("pillPadding", "Pille: Innenabstand oben", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 8, 0, 40, "px"),
  number("pillPadding2", "Pille: Innenabstand links/rechts", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 20, 0, 80, "px"),
  number("pillPadding3", "Pille: Innenabstand unten", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 10, 0, 40, "px"),
  number("pillFontSize", "Pille: Schriftgrösse Anteil von „Schriftgrösse“ (%)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 100, 0, 400),
  number("pillFontWeight", "Pille: Schriftstärke", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 600, 100, 900, undefined, 100),
  number("pillLetterSpacing", "Pille: Zeichenabstand", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", 3, -40, 40, "px"),
  inherits(color("pillColor", "Pille: Textfarbe", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", ""), "onAccent"),
  inherits(font("pillFont", "Pille: Schrift", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
