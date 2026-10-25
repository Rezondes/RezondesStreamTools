// Fine-tuning fields of the Plantage theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineTextColor", "Text: Farbe", "Offline-Banner", ""), "textOnWood"),
  inherits(color("offlinePaper", "Karte: Farbe", "Offline-Banner", ""), "paper"),
  inherits(color("offlineShadow", "Karte: Schatten Farbe", "Offline-Banner", ""), "soilDark"),
  inherits(font("offlineTitleFont", "Titel: Schrift", "Offline-Banner", "", ["Fredoka", "Baloo 2", "Pacifico", "Nunito"]), "titleFont"),
  inherits(font("offlineFont", "Text: Schrift", "Offline-Banner", "", ["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"]), "font"),
  inherits(color("offlineSkyTop", "Himmel oben", "Offline-Banner", ""), "skyEveningTop"),
  inherits(color("offlineSkyBottom", "Himmel unten", "Offline-Banner", ""), "skyEveningBottom"),
  inherits(color("offlineSun", "Sonne", "Offline-Banner", ""), "sun"),
  number("offlineTitleY", "Titel: von oben", "Offline-Banner", 330, -1080, 2160, "px"),
  number("offlineTextY", "Text: von oben", "Offline-Banner", 450, -1080, 2160, "px"),
  number("offlineLineY", "Zeilen: erste von oben", "Offline-Banner", 530, -1080, 2160, "px"),
  number("offlineLineStep", "Zeilen: Abstand", "Offline-Banner", 52, 0, 300, "px"),
  number("offlineTitleSize", "Titel: Schriftgrösse", "Offline-Banner", 110, 8, 300, "px"),
  number("offlineTextSize", "Text: Schriftgrösse", "Offline-Banner", 40, 8, 200, "px"),
  number("offlineLineSize", "Zeilen: Schriftgrösse", "Offline-Banner", 34, 8, 200, "px"),
  number("offlineLines", "Zeilen: höchstens", "Offline-Banner", 3, 0, 20),
  number("offlineCardLeft", "Karte: von links", "Offline-Banner", 340, -1920, 1920, "px"),
  number("offlineCardTop", "Karte: von oben", "Offline-Banner", 200, -1080, 1080, "px"),
  number("offlineCardWidth", "Karte: Breite", "Offline-Banner", 1240, 0, 1920, "px"),
  number("offlineCardHeight", "Karte: Höhe", "Offline-Banner", 520, 0, 1080, "px"),
  number("offlineCardRound", "Karte: Eckenradius", "Offline-Banner", 28, 0, 300, "px"),
  number("offlineCardAlpha", "Karte: Deckkraft", "Offline-Banner", 0.82, 0, 1, undefined, 0.01),
  number("offlineCardBlur", "Karte: Schatten Unschärfe", "Offline-Banner", 60, 0, 300, "px"),
  number("offlineCardLift", "Karte: Schatten Versatz", "Offline-Banner", 24, -200, 200, "px"),
  number("offlineCardInset", "Karte: Innenabstand für Text", "Offline-Banner", 60, 0, 600, "px"),
] as const satisfies readonly SettingField[];
