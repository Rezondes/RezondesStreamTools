// Fine-tuning fields of the Kebab theme, group "Feinschliff: Statistik, Alerts" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STATS_ALERTS_TUNING = [
  number("stampRight", "Stempel: Lage rechts", "Feinschliff: Statistik, Alerts", 10, -40, 40, "px"),
  number("stampTop", "Stempel: Lage oben", "Feinschliff: Statistik, Alerts", 8, -40, 40, "px"),
  number("stampWidth", "Stempel: Breite", "Feinschliff: Statistik, Alerts", 120, 0, 480, "px"),
  number("stampHeight", "Stempel: Höhe", "Feinschliff: Statistik, Alerts", 120, 0, 480, "px"),
  inherits(color("stampBorder", "Stempel: Rand Farbe (Rot für Schrift und Flächen)", "Feinschliff: Statistik, Alerts", ""), "redText"),
  number("stampBorder2", "Stempel: Rand Stärke", "Feinschliff: Statistik, Alerts", 5, 0, 40, "px"),
  inherits(color("stampBoxShadow", "Stempel: Schatten Farbe (Bon-Papier)", "Feinschliff: Statistik, Alerts", ""), "bon"),
  inherits(color("stampBoxShadow2", "Stempel: Schatten Farbe (Rot für Schrift und Flächen)", "Feinschliff: Statistik, Alerts", ""), "redText"),
  number("stampBoxShadow3", "Stempel: Schatten Ausbreitung (Teil 1)", "Feinschliff: Statistik, Alerts", 5, -40, 40, "px"),
  number("stampBoxShadow4", "Stempel: Schatten Ausbreitung (Teil 2)", "Feinschliff: Statistik, Alerts", 8, -40, 40, "px"),
  inherits(color("stampColor", "Stempel: Textfarbe", "Feinschliff: Statistik, Alerts", ""), "redText"),
  inherits(font("stampFont", "Stempel: Schrift", "Feinschliff: Statistik, Alerts", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("stampFontSize", "Stempel: Schriftgrösse", "Feinschliff: Statistik, Alerts", 22, 0, 88, "px"),
  number("stampLineHeight", "Stempel: Zeilenhöhe", "Feinschliff: Statistik, Alerts", 1, 0.5, 3, undefined, 0.01),
  number("stampTransform", "Stempel: Verformung Drehung (Grad)", "Feinschliff: Statistik, Alerts", 12, -360, 360),
  number("stampOpacity", "Stempel: Deckkraft", "Feinschliff: Statistik, Alerts", 0.9, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
