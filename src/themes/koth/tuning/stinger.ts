// Fine-tuning fields of the King of the Hill theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerSmoke", "Rauch: Farbe", "Stinger", ""), "smokeColor"),
  inherits(color("stingerPole", "Flaggenmast: Farbe", "Stinger", ""), "steel"),
  inherits(color("stingerGrenade", "Granate: Farbe", "Stinger", ""), "olive"),
  inherits(color("stingerTextColor", "Text: Farbe", "Stinger", ""), "textColor"),
  inherits(font("stingerFont", "Text: Schrift", "Stinger", "", ["Black Ops One", "Stardos Stencil", "Share Tech Mono", "Inter"]), "titleFont"),
  number("stingerTextSize", "Text: Schriftgrösse auf der Fläche", "Stinger", 150, 10, 250, "px"),
  number("stingerFov", "Kamera: Blickwinkel (Grad)", "Stinger", 40, 10, 120),
  number("stingerAmbient", "Licht: Grundhelligkeit", "Stinger", 0.7, 0, 5, undefined, 0.05),
  number("stingerSun", "Licht: Sonne", "Stinger", 1.2, 0, 10, undefined, 0.05),
  number("stingerClothWidth", "Flagge: Breite (m)", "Stinger", 0.9, 0, 5, undefined, 0.05),
  number("stingerClothHeight", "Flagge: Höhe (m)", "Stinger", 0.56, 0, 5, undefined, 0.01),
  number("stingerWind", "Flagge: Wind", "Stinger", 0.6, 0, 3, undefined, 0.01),
  number("stingerTextY", "Text: Höhe (m)", "Stinger", 0.95, -5, 5, undefined, 0.05),
  number("stingerTextWidth", "Text: Breite (m)", "Stinger", 1.4, 0, 6, undefined, 0.05),
  number("stingerTextHeight", "Text: Höhe der Fläche (m)", "Stinger", 0.25, 0, 3, undefined, 0.01),
  number("stingerShown", "Flagge und Text: sichtbar über (Anteil der Zeit)", "Stinger", 0.6, 0, 1, undefined, 0.01),
  number("stingerPop", "Granate: platzt nach (Anteil der Zeit bis zum Übergang)", "Stinger", 0.25, 0, 1, undefined, 0.01),
  number("stingerRollFrom", "Granate: rollt von (m)", "Stinger", -9, -50, 50, undefined, 0.5),
  number("stingerSpeedMin", "Rauch: Tempo mindestens (m pro Sekunde)", "Stinger", 2, 0, 30, undefined, 0.1),
  number("stingerSpeedMax", "Rauch: Tempo höchstens (m pro Sekunde)", "Stinger", 7, 0, 30, undefined, 0.1),
  number("stingerGravity", "Rauch: Schwerkraft (unter 0 steigt er)", "Stinger", -0.6, -20, 20, undefined, 0.05),
  number("stingerDrag", "Rauch: Bremsung", "Stinger", 0.8, 0, 10, undefined, 0.05),
  number("stingerDepth", "Rauch: Tiefe der Wolke (m)", "Stinger", 4, 0, 20, undefined, 0.1),
  number("stingerGrow", "Rauch: wächst um", "Stinger", 3.5, 0, 20, undefined, 0.05),
  number("stingerPuffSize", "Rauch: Wolke am Anfang", "Stinger", 0.8, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
