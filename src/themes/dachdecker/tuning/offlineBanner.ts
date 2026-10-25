// Fine-tuning fields of the Dachdecker theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineBlueprint", "Blaupause: Farbe", "Offline-Banner", ""), "blueprint"),
  inherits(color("offlinePage", "Seite: Farbe", "Offline-Banner", ""), "page"),
  inherits(color("offlineAccent", "Name: Farbe", "Offline-Banner", ""), "accent"),
  inherits(color("offlineCopper", "Kopfzeile: Farbe", "Offline-Banner", ""), "copper"),
  inherits(color("offlineLine", "Linien und Text: Farbe", "Offline-Banner", ""), "line"),
  inherits(color("offlineRainColor", "Regen: Farbe", "Offline-Banner", ""), "rain"),
  inherits(font("offlineFont", "Schrift", "Offline-Banner", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), "font"),
  number("offlineSignWidth", "Schild: Breite (Anteil)", "Offline-Banner", 0.5, 0, 1, undefined, 0.01),
  number("offlineGridMajor", "Raster: Deckkraft", "Offline-Banner", 0.1, 0, 1, undefined, 0.01),
  number("offlineGridFine", "Feinraster: Deckkraft", "Offline-Banner", 0.04, 0, 1, undefined, 0.01),
  number("offlineGridPage", "Raster der Seite: Deckkraft", "Offline-Banner", 0.04, 0, 1, undefined, 0.01),
  number("offlineSheetOpacity", "Blatt: Deckkraft", "Offline-Banner", 0.9, 0, 1, undefined, 0.01),
  number("offlineRainLength", "Regen: Streifenlänge (Anteil der Höhe)", "Offline-Banner", 0.035, 0, 1, undefined, 0.001),
  number("offlineRainSlant", "Regen: Schräge (Anteil der Höhe)", "Offline-Banner", 0.006, -1, 1, undefined, 0.001),
  number("offlineRainOpacity", "Regen: Deckkraft", "Offline-Banner", 0.55, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
