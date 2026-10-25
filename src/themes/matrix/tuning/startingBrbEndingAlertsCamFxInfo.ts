// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_TUNING = [
  number("crtPowerLine", "Röhre einschalten: Anteil der Linie", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.47, 0, 1, undefined, 0.01),
  number("crtPowerOpen", "Röhre einschalten: Anteil des Aufgehens", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.53, 0, 1, undefined, 0.01),
  number("crtPowerThin", "Röhre einschalten: Linienhöhe (Anteil)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.004, 0, 0.1, undefined, 0.001),
  number("crtPowerBright", "Röhre einschalten: Helligkeit am Anfang", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 4, 0, 10, undefined, 0.1),
  number("crtPowerFlash", "Röhre einschalten: Blitz (Deckkraft)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.9, 0, 1, undefined, 0.01),
  number("crtGlitchLength", "Röhren-Glitch: Dauer", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.2, 0, 5, "s", 0.05),
  number("crtGlitchShift", "Röhren-Glitch: Verschiebung Streifen 1", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", -12, -48, 48, "px"),
  number("crtGlitchShift2", "Röhren-Glitch: Verschiebung Streifen 2", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 9, -40, 40, "px"),
  number("crtGlitchTop", "Röhren-Glitch: Streifen 1 Einzug oben (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 10, 0, 100),
  number("crtGlitchBottom", "Röhren-Glitch: Streifen 1 Einzug unten (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 60, 0, 100),
  number("crtGlitchTop2", "Röhren-Glitch: Streifen 2 Einzug oben (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 45, 0, 100),
  number("crtGlitchBottom2", "Röhren-Glitch: Streifen 2 Einzug unten (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 20, 0, 100),
  number("crtGlitchBright", "Röhren-Glitch: Helligkeit", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 1.6, 0, 5, undefined, 0.05),
  number("typePerChar", "Tippen: Sekunden je Zeichen bei Tempo 1", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 0.028, 0, 1, "s", 0.05),
  number("typeLongest", "Tippen: längste Dauer einer Zeile", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite", 1.2, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
