// Fine-tuning fields of the Matrix theme, group "Feinschliff: Röhre" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CRT_TUNING = [
  number("crtPowerLine", "Röhre einschalten: Anteil der Linie", "Feinschliff: Röhre", 0.47, 0, 1, undefined, 0.01),
  number("crtPowerOpen", "Röhre einschalten: Anteil des Aufgehens", "Feinschliff: Röhre", 0.53, 0, 1, undefined, 0.01),
  number("crtPowerThin", "Röhre einschalten: Linienhöhe (Anteil)", "Feinschliff: Röhre", 0.004, 0, 0.1, undefined, 0.001),
  number("crtPowerBright", "Röhre einschalten: Helligkeit am Anfang", "Feinschliff: Röhre", 4, 0, 10, undefined, 0.1),
  number("crtPowerFlash", "Röhre einschalten: Blitz (Deckkraft)", "Feinschliff: Röhre", 0.9, 0, 1, undefined, 0.01),
  number("crtGlitchLength", "Röhren-Glitch: Dauer", "Feinschliff: Röhre", 0.2, 0, 5, "s", 0.05),
  number("crtGlitchShift", "Röhren-Glitch: Verschiebung Streifen 1", "Feinschliff: Röhre", -12, -48, 48, "px"),
  number("crtGlitchShift2", "Röhren-Glitch: Verschiebung Streifen 2", "Feinschliff: Röhre", 9, -40, 40, "px"),
  number("crtGlitchTop", "Röhren-Glitch: Streifen 1 Einzug oben (%)", "Feinschliff: Röhre", 10, 0, 100),
  number("crtGlitchBottom", "Röhren-Glitch: Streifen 1 Einzug unten (%)", "Feinschliff: Röhre", 60, 0, 100),
  number("crtGlitchTop2", "Röhren-Glitch: Streifen 2 Einzug oben (%)", "Feinschliff: Röhre", 45, 0, 100),
  number("crtGlitchBottom2", "Röhren-Glitch: Streifen 2 Einzug unten (%)", "Feinschliff: Röhre", 20, 0, 100),
  number("crtGlitchBright", "Röhren-Glitch: Helligkeit", "Feinschliff: Röhre", 1.6, 0, 5, undefined, 0.05),
  number("typePerChar", "Tippen: Sekunden je Zeichen bei Tempo 1", "Feinschliff: Röhre", 0.028, 0, 1, "s", 0.05),
  number("typeLongest", "Tippen: längste Dauer einer Zeile", "Feinschliff: Röhre", 1.2, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
