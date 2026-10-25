// Fine-tuning fields of the Standard theme, group "Feinschliff: Statistik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_TUNING = [
  number("statsPadding", "Statistik-Bereich: Innenabstand", "Feinschliff: Statistik", 16, 0, 64, "px"),
  number("stStatsGap", "Statistik-Reihe: Abstand", "Feinschliff: Statistik", 20, 0, 80, "px"),
  number("stStatsMarginTop", "Statistik-Reihe: Abstand oben", "Feinschliff: Statistik", 18, -72, 72, "px"),
  number("stStatGap", "Statistik-Karte: Abstand", "Feinschliff: Statistik", 6, 0, 40, "px"),
  number("stStatMinWidth", "Statistik-Karte: Mindestbreite", "Feinschliff: Statistik", 180, 0, 720, "px"),
  number("stStatPadding", "Statistik-Karte: Innenabstand oben/unten", "Feinschliff: Statistik", 20, 0, 80, "px"),
  number("stStatPadding2", "Statistik-Karte: Innenabstand links/rechts", "Feinschliff: Statistik", 24, 0, 96, "px"),
  number("stStatBorderRadius", "Statistik-Karte: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Statistik", 100, 0, 400),
  inherits(color("stStatBackground", "Statistik-Karte: Hintergrund Farbe (Kartenfarbe)", "Feinschliff: Statistik", ""), "card"),
  inherits(color("stStatBoxShadow", "Statistik-Karte: Schatten Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Statistik", ""), "accent2"),
  number("stStatBoxShadow2", "Statistik-Karte: Schatten Ausbreitung", "Feinschliff: Statistik", 1, -40, 40, "px"),
  number("stStatBoxShadow3", "Statistik-Karte: Schatten Farbanteil", "Feinschliff: Statistik", 25, 0, 100, "%"),
  number("stStatBFontSize", "Statistik-Zahl: Schriftgrösse", "Feinschliff: Statistik", 56, 0, 224, "px"),
  number("stStatBFontWeight", "Statistik-Zahl: Schriftstärke", "Feinschliff: Statistik", 800, 100, 900, undefined, 100),
  inherits(color("stStatBBackground", "Statistik-Zahl: Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Statistik", ""), "accent"),
  inherits(color("stStatBBackground2", "Statistik-Zahl: Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Statistik", ""), "accent2"),
  number("stStatBBackground3", "Statistik-Zahl: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Statistik", 90, -360, 360),
  inherits(font("stStatBFont", "Statistik-Zahl: Schrift", "Feinschliff: Statistik", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("stStatSpanFontSize", "Statistik-Beschriftung: Schriftgrösse", "Feinschliff: Statistik", 20, 0, 80, "px"),
  number("stStatSpanFontWeight", "Statistik-Beschriftung: Schriftstärke", "Feinschliff: Statistik", 600, 100, 900, undefined, 100),
  number("stStatSpanLetterSpacing", "Statistik-Beschriftung: Zeichenabstand (em)", "Feinschliff: Statistik", 0.12, -2, 2, undefined, 0.01),
  inherits(color("stStatSpanColor", "Statistik-Beschriftung: Textfarbe", "Feinschliff: Statistik", ""), "mutedColor"),
  inherits(font("stStatSpanFont", "Statistik-Beschriftung: Schrift", "Feinschliff: Statistik", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("statsRiseFrom", "Statistik-Einflug: Karten steigen um", "Feinschliff: Statistik", 24, -96, 96, "px"),
  number("statsRiseTime", "Statistik-Einflug: Dauer", "Feinschliff: Statistik", 0.5, 0, 10, "s", 0.05),
  number("statsRiseStagger", "Statistik-Einflug: Abstand zwischen Karten", "Feinschliff: Statistik", 0.12, 0, 2, "s", 0.05),
  number("statsCountStagger", "Statistik: Abstand beim Hochzählen", "Feinschliff: Statistik", 0.15, 0, 5, "s", 0.05),
] as const satisfies readonly SettingField[];
