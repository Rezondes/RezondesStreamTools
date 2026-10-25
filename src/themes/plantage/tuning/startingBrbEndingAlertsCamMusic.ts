// Fine-tuning fields of the Plantage theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_TUNING = [
  number("shapePartLineStrokeWidth", "Form Linie: Linienstärke", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", 4, 0, 16),
  inherits(color("stopSheenLightStopColor", "Verlaufsfarbe Glanz hell: stop-color Farbe (Erntezettel)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", ""), "paper"),
  number("stopSheenLightStopOpacity", "Verlaufsfarbe Glanz hell: stop-opacity", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", 0.5, 0, 2, undefined, 0.01),
  inherits(color("stopSheenClearStopColor", "Verlaufsfarbe Glanz klar: stop-color Farbe (Erntezettel)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", ""), "paper"),
  inherits(color("stopSheenShadeStopColor", "Verlaufsfarbe Glanz Schatten: stop-color Farbe (Erde dunkel)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", ""), "soilDark"),
  number("stopSheenShadeStopOpacity", "Verlaufsfarbe Glanz Schatten: stop-opacity", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik", 0.28, 0, 2, undefined, 0.01),
] as const satisfies readonly SettingField[];
