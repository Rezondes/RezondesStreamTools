// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_INFO_TUNING = [
  number("towerSwayTransformOrigin", "Turm wippend: Drehpunkt x", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 50, 0, 150, "%"),
  number("kfSway0p100pRotate", "Schwanken (0 %, 100 %): Drehung Anteil von „Bärenturm: Wanken (Grad)“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 100, 0, 400),
  number("kfSway0p100pRotate2", "Schwanken (0 %, 100 %): Drehung (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", -1, -360, 360),
  number("kfSway50pRotate", "Schwanken (50 %): Drehung Anteil von „Bärenturm: Wanken (Grad)“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 100, 0, 400),
  number("kfSway50pRotate2", "Schwanken (50 %): Drehung (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 1, -360, 360),
  inherits(color("pillBackground", "Etikett: Hintergrund Farbe (Papier (Karten, Schilder))", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", ""), "paper"),
  inherits(color("pillColor", "Etikett: Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", ""), "textDark"),
  inherits(color("pillBorder", "Etikett: Rand Farbe (Kontur)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", ""), "outline"),
  number("pillBorder2", "Etikett: Rand Stärke", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 4, 0, 40, "px"),
  number("pillBorderRadius", "Etikett: Eckenradius", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 999, 0, 999, "px"),
  number("pillPadding", "Etikett: Innenabstand oben/unten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 6, 0, 40, "px"),
  number("pillPadding2", "Etikett: Innenabstand links/rechts", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 22, 0, 88, "px"),
  number("pillFontWeight", "Etikett: Schriftstärke", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", 800, 100, 900, undefined, 100),
  inherits(font("pillFont", "Etikett: Schrift", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
