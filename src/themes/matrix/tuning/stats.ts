// Fine-tuning fields of the Matrix theme, group "Feinschliff: Statistik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_TUNING = [
  number("statusGap", "Status: Abstand", "Feinschliff: Statistik", 12, 0, 48, "px"),
  number("statusFontSize", "Status: Schriftgrösse", "Feinschliff: Statistik", 26, 0, 104, "px"),
  inherits(color("statusColor", "Status: Textfarbe", "Feinschliff: Statistik", ""), "accent"),
  inherits(font("statusFont", "Status: Schrift", "Feinschliff: Statistik", "", ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]), "font"),
  number("statsPadding", "Statistik: Innenabstand", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("statsLogoutPadding", "Statistik Abmeldezeilen: Innenabstand oben/unten", "Feinschliff: Statistik", 18, 0, 72, "px"),
  number("statsLogoutPadding2", "Statistik Abmeldezeilen: Innenabstand links/rechts", "Feinschliff: Statistik", 24, 0, 96, "px"),
  inherits(color("statsLogoutBackground", "Statistik Abmeldezeilen: Hintergrund Farbe (Hintergrund)", "Feinschliff: Statistik", ""), "background"),
  number("statsLogoutBackground2", "Statistik Abmeldezeilen: Hintergrund Farbanteil", "Feinschliff: Statistik", 85, 0, 100, "%"),
  inherits(color("statsLogoutBorder", "Statistik Abmeldezeilen: Rand Farbe (Linienfarbe)", "Feinschliff: Statistik", ""), "line"),
  number("statsLogoutBorder2", "Statistik Abmeldezeilen: Rand Wert 1", "Feinschliff: Statistik", 1, 0, 40, "px"),
  number("statusBigFontSize", "Status gross: Schriftgrösse", "Feinschliff: Statistik", 56, 0, 224, "px"),
  inherits(color("statusBigColor", "Status gross: Textfarbe", "Feinschliff: Statistik", ""), "accent"),
  inherits(font("statusBigFont", "Status gross: Schrift", "Feinschliff: Statistik", "", ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]), "font"),
  number("statsCountStart", "Statistik: erste Zeile zählt ab", "Feinschliff: Statistik", 0.3, 0, 10, "s", 0.05),
  number("statsCountStagger", "Statistik: jede Zeile später um", "Feinschliff: Statistik", 0.25, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
