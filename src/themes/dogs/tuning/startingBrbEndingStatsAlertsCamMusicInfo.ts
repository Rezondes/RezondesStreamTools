// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_ALERTS_CAM_MUSIC_INFO_TUNING = [
  number("pawWidth", "Pfote: Breite", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 5, 0, 20),
  number("pawWidth2", "Pfote: Breite (2)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 5, 0, 40, "px"),
  number("pawHeight", "Pfote: Höhe", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 5, 0, 20),
  number("pawHeight2", "Pfote: Höhe (2)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 5, 0, 40, "px"),
] as const satisfies readonly SettingField[];
