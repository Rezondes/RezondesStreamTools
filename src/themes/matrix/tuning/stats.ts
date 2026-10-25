// Fine-tuning fields of the Matrix theme, group "Feinschliff: Statistik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_TUNING = [
  number("logoutGap", "Abmeldezeilen: Abstand", "Feinschliff: Statistik", 4, 0, 40, "px"),
  number("logoutWidth", "Abmeldezeilen: Breite", "Feinschliff: Statistik", 640, 0, 2560, "px"),
  number("logoutFontSize", "Abmeldezeilen: Schriftgrösse", "Feinschliff: Statistik", 22, 0, 88, "px"),
  inherits(color("logoutColor", "Abmeldezeilen: Textfarbe", "Feinschliff: Statistik", ""), "accent"),
  inherits(font("logoutFont", "Abmeldezeilen: Schrift", "Feinschliff: Statistik", "", ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]), "font"),
  inherits(color("logoutRowBorderBottom", "Abmeldezeilen Zeile: Rand unten Farbe (Linienfarbe)", "Feinschliff: Statistik", ""), "line"),
  number("logoutRowBorderBottom2", "Abmeldezeilen Zeile: Rand unten Wert 1", "Feinschliff: Statistik", 1, 0, 40, "px"),
  number("statsPadding", "Statistik: Innenabstand", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("statsLogoutPadding", "Statistik Abmeldezeilen: Innenabstand oben/unten", "Feinschliff: Statistik", 18, 0, 72, "px"),
  number("statsLogoutPadding2", "Statistik Abmeldezeilen: Innenabstand links/rechts", "Feinschliff: Statistik", 24, 0, 96, "px"),
  inherits(color("statsLogoutBackground", "Statistik Abmeldezeilen: Hintergrund Farbe (Hintergrund)", "Feinschliff: Statistik", ""), "background"),
  number("statsLogoutBackground2", "Statistik Abmeldezeilen: Hintergrund Farbanteil", "Feinschliff: Statistik", 85, 0, 100, "%"),
  inherits(color("statsLogoutBorder", "Statistik Abmeldezeilen: Rand Farbe (Linienfarbe)", "Feinschliff: Statistik", ""), "line"),
  number("statsLogoutBorder2", "Statistik Abmeldezeilen: Rand Wert 1", "Feinschliff: Statistik", 1, 0, 40, "px"),
  number("statsCountStart", "Statistik: erste Zeile zählt ab", "Feinschliff: Statistik", 0.3, 0, 10, "s", 0.05),
  number("statsCountStagger", "Statistik: jede Zeile später um", "Feinschliff: Statistik", 0.25, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
