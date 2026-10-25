// Fine-tuning fields of the Kebab theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineRed", "Linien: Farbe", "Offline-Banner", ""), "red"),
  inherits(color("offlineRedText", "Schrift rot: Farbe", "Offline-Banner", ""), "redText"),
  inherits(color("offlinePaper", "Papier: Farbe", "Offline-Banner", ""), "paper"),
  inherits(color("offlineBrown", "Dunkel: Farbe", "Offline-Banner", ""), "brown"),
  inherits(color("offlineMuted", "Gedämpft: Farbe", "Offline-Banner", ""), "muted"),
  inherits(color("offlineSteamColor", "Dampf: Farbe", "Offline-Banner", ""), "steam"),
  inherits(font("offlineTitleFont", "Titel: Schrift", "Offline-Banner", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("offlineLogoTop", "Logo: von oben (Anteil der Höhe)", "Offline-Banner", 0.06, 0, 1, undefined, 0.01),
  number("offlineLogoHeight", "Logo: Höhe (Anteil)", "Offline-Banner", 0.87, 0, 1, undefined, 0.01),
  number("offlineTextY", "Text: von oben (Anteil)", "Offline-Banner", 0.8, 0, 1, undefined, 0.01),
  number("offlineTextSize", "Text: Schriftgrösse (Anteil)", "Offline-Banner", 0.078, 0, 1, undefined, 0.001),
  number("offlineSlat", "Lamellen: Abstand", "Offline-Banner", 34, 1, 400, "px"),
  number("offlineSlatLine", "Lamellen: Linienstärke", "Offline-Banner", 3, 0, 40, "px"),
  number("offlineSlatAlpha", "Lamellen: Deckkraft", "Offline-Banner", 0.22, 0, 1, undefined, 0.01),
  number("offlineRail", "Schiene: Höhe", "Offline-Banner", 14, 0, 200, "px"),
  number("offlineRailAlpha", "Schiene: Deckkraft", "Offline-Banner", 0.45, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
