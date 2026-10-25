// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_INFO_TUNING = [
  number("powerSprayMarkPathStrokeDasharray", "Einschalten Spray: Kritzeleien: Strichmuster", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 1, 0, 4, undefined, 0.01),
  number("powerSprayMarkPathAnimationDelay", "Einschalten Spray: Kritzeleien: Animationsverzögerung", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.3, 0, 2, undefined, 0.01),
  number("markPathStrokeWidth", "Kritzelei Linie: Linienstärke Anteil von „Strichstärke (Faktor)“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 100, 0, 400),
  inherits(color("markColor1PathStroke", "Kritzelei Farbe 1 Linie: Linienfarbe Farbe (Farbe 1)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", ""), "scribbleColor1"),
  inherits(color("markColor2PathStroke", "Kritzelei Farbe 2 Linie: Linienfarbe Farbe (Farbe 2)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", ""), "scribbleColor2"),
  inherits(color("markColor3PathStroke", "Kritzelei Farbe 3 Linie: Linienfarbe Farbe (Farbe 3)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", ""), "scribbleColor3"),
  inherits(color("markColor4PathStroke", "Kritzelei Farbe 4 Linie: Linienfarbe Farbe (Farbe 4)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", ""), "scribbleColor4"),
  inherits(color("markWhitePathStroke", "Kritzelei weiss Linie: Linienfarbe Farbe (Textfarbe)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", ""), "textColor"),
] as const satisfies readonly SettingField[];
