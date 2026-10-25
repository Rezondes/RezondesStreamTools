// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_MINIMES_TUNING = [
  inherits(color("glitchBeforeColor", "Glitch (Ebene 1): Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", ""), "highlight"),
  number("glitchBeforeAnimation", "Glitch (Ebene 1): Animation Dauer Anteil von „Namens-Glitch alle“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 100, 0, 400),
  number("glitchBeforeAnimation2", "Glitch (Ebene 1): Animation Verzögerung", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 1.6, 0, 8, "s", 0.05),
  number("glitchBeforeAnimation3", "Glitch (Ebene 1): Animation Schritte", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 1, 0, 4, undefined, 0.01),
  inherits(color("glitchAfterColor", "Glitch (Ebene 2): Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", ""), "dim"),
  number("glitchAfterAnimation", "Glitch (Ebene 2): Animation Dauer Anteil von „Namens-Glitch alle“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 100, 0, 400),
  number("glitchAfterAnimation2", "Glitch (Ebene 2): Animation Verzögerung", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 1.6, 0, 8, "s", 0.05),
  number("glitchAfterAnimation3", "Glitch (Ebene 2): Animation Schritte", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 1, 0, 4, undefined, 0.01),
  number("kfGlitchA90pOpacity", "Namens-Glitch A (90 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 0.8, 0, 1, undefined, 0.01),
  number("kfGlitchA90pTransform", "Namens-Glitch A (90 %): Verformung Verschiebung y Anteil von „Glitch (Stärke)“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 100, 0, 400),
  number("kfGlitchA90pTransform2", "Namens-Glitch A (90 %): Verformung Verschiebung x", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", -4, -16, 16),
  number("kfGlitchA90pClipPath", "Namens-Glitch A (90 %): Zuschnitt Einzug oben", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 10, 0, 100, "%"),
  number("kfGlitchA90pClipPath2", "Namens-Glitch A (90 %): Zuschnitt Einzug unten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 55, 0, 165, "%"),
  number("kfGlitchA94pOpacity", "Namens-Glitch A (94 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 0.8, 0, 1, undefined, 0.01),
  number("kfGlitchA94pTransform", "Namens-Glitch A (94 %): Verformung Verschiebung x", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 3, -12, 12),
  number("kfGlitchA94pClipPath", "Namens-Glitch A (94 %): Zuschnitt Einzug oben", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 60, 0, 180, "%"),
  number("kfGlitchA94pClipPath2", "Namens-Glitch A (94 %): Zuschnitt Einzug unten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 8, 0, 100, "%"),
  number("kfGlitchB91pOpacity", "Namens-Glitch B (91 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 0.8, 0, 1, undefined, 0.01),
  number("kfGlitchB91pTransform", "Namens-Glitch B (91 %): Verformung Verschiebung x", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 4, -16, 16),
  number("kfGlitchB91pClipPath", "Namens-Glitch B (91 %): Zuschnitt Einzug oben", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 40, 0, 120, "%"),
  number("kfGlitchB91pClipPath2", "Namens-Glitch B (91 %): Zuschnitt Einzug unten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 30, 0, 100, "%"),
  number("kfGlitchB95pOpacity", "Namens-Glitch B (95 %): Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 0.8, 0, 1, undefined, 0.01),
  number("kfGlitchB95pTransform", "Namens-Glitch B (95 %): Verformung Verschiebung y Anteil von „Glitch (Stärke)“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 100, 0, 400),
  number("kfGlitchB95pTransform2", "Namens-Glitch B (95 %): Verformung Verschiebung x", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", -3, -12, 12),
  number("kfGlitchB95pClipPath", "Namens-Glitch B (95 %): Zuschnitt Einzug unten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes", 75, 0, 225, "%"),
] as const satisfies readonly SettingField[];
