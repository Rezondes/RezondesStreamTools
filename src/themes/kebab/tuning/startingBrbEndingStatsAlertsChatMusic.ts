// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_TUNING = [
  number("zigzagBottom", "Zickzack: Lage unten", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 14, -56, 56, "px"),
  number("zigzagHeight", "Zickzack: Höhe", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 14, 0, 56, "px"),
  inherits(color("zigzagBackground", "Zickzack: Hintergrund Farbe (Bon-Papier)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", ""), "bon"),
  number("zigzagClipPath", "Zickzack: Zuschnitt Eckpunkt 3", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 95, 0, 285, "%"),
  number("zigzagClipPath2", "Zickzack: Zuschnitt Eckpunkt 4", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 90, 0, 270, "%"),
  number("zigzagClipPath3", "Zickzack: Zuschnitt Eckpunkt 5", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 85, 0, 255, "%"),
  number("zigzagClipPath4", "Zickzack: Zuschnitt Eckpunkt 6", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 80, 0, 240, "%"),
  number("zigzagClipPath5", "Zickzack: Zuschnitt Eckpunkt 7", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 75, 0, 225, "%"),
  number("zigzagClipPath6", "Zickzack: Zuschnitt Eckpunkt 8", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 70, 0, 210, "%"),
  number("zigzagClipPath7", "Zickzack: Zuschnitt Eckpunkt 9", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 65, 0, 195, "%"),
  number("zigzagClipPath8", "Zickzack: Zuschnitt Eckpunkt 10", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 60, 0, 180, "%"),
  number("zigzagClipPath9", "Zickzack: Zuschnitt Eckpunkt 11", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 55, 0, 165, "%"),
  number("zigzagClipPath10", "Zickzack: Zuschnitt Eckpunkt 12", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 50, 0, 150, "%"),
  number("zigzagClipPath11", "Zickzack: Zuschnitt Eckpunkt 13", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 45, 0, 135, "%"),
  number("zigzagClipPath12", "Zickzack: Zuschnitt Eckpunkt 14", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 40, 0, 120, "%"),
  number("zigzagClipPath13", "Zickzack: Zuschnitt Eckpunkt 15", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 35, 0, 105, "%"),
  number("zigzagClipPath14", "Zickzack: Zuschnitt Eckpunkt 16", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 30, 0, 100, "%"),
  number("zigzagClipPath15", "Zickzack: Zuschnitt Eckpunkt 17", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 25, 0, 100, "%"),
  number("zigzagClipPath16", "Zickzack: Zuschnitt Eckpunkt 18", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 20, 0, 100, "%"),
  number("zigzagClipPath17", "Zickzack: Zuschnitt Eckpunkt 19", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 15, 0, 100, "%"),
  number("zigzagClipPath18", "Zickzack: Zuschnitt Eckpunkt 20", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 10, 0, 100, "%"),
  number("zigzagClipPath19", "Zickzack: Zuschnitt Eckpunkt 21", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik", 5, 0, 100, "%"),
] as const satisfies readonly SettingField[];
