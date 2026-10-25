// Fine-tuning fields of the Bärenbande theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineTextColor", "Text: Farbe", "Offline-Banner", ""), "textDark"),
  inherits(color("offlineLinesColor", "Zeilen: Farbe", "Offline-Banner", ""), "textDim"),
  inherits(color("offlineCardShade", "Karte: Schattenband", "Offline-Banner", ""), "paperShade"),
  inherits(font("offlineTitleFont", "Titel: Schrift", "Offline-Banner", "", ["Sniglet", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("offlineFont", "Text: Schrift", "Offline-Banner", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), "font"),
  number("offlineBearX", "Bär: Mitte von links", "Offline-Banner", 340, -1920, 3840, "px"),
  number("offlineBearY", "Bär: Füsse von oben", "Offline-Banner", 900, -1080, 2160, "px"),
  number("offlineBearHeight", "Bär: Höhe", "Offline-Banner", 420, 0, 2160, "px"),
  number("offlineCardX", "Karte: Mitte von links", "Offline-Banner", 1330, -1920, 3840, "px"),
  number("offlineCardY", "Karte: von oben", "Offline-Banner", 240, -1080, 2160, "px"),
  number("offlineCardWidth", "Karte: Breite mindestens", "Offline-Banner", 860, 0, 1920, "px"),
  number("offlineCardHeight", "Karte: Höhe", "Offline-Banner", 520, 0, 1080, "px"),
  number("offlineCardPadding", "Karte: Platz neben dem Titel", "Offline-Banner", 70, 0, 600, "px"),
  number("offlineCardRight", "Karte: reicht höchstens bis", "Offline-Banner", 1880, 0, 3840, "px"),
  number("offlineTitleY", "Titel: von oben", "Offline-Banner", 350, -1080, 2160, "px"),
  number("offlineTitleSize", "Titel: Schriftgrösse", "Offline-Banner", 92, 8, 300, "px"),
  number("offlineTextY", "Text: von oben", "Offline-Banner", 460, -1080, 2160, "px"),
  number("offlineTextSize", "Text: Schriftgrösse", "Offline-Banner", 36, 8, 200, "px"),
  number("offlineLinesY", "Zeilen: erste von oben", "Offline-Banner", 550, -1080, 2160, "px"),
  number("offlineLineStep", "Zeilen: Abstand", "Offline-Banner", 60, 0, 400, "px"),
  number("offlineLineSize", "Zeilen: Schriftgrösse", "Offline-Banner", 32, 8, 200, "px"),
  number("offlineSleepX", "Zz: von links", "Offline-Banner", 430, -1920, 3840, "px"),
  number("offlineSleepY", "Zz: von oben", "Offline-Banner", 560, -1080, 2160, "px"),
  number("offlineSleepRiseX", "Zz: wandern nach rechts um", "Offline-Banner", 90, -1000, 1000, "px"),
  number("offlineSleepRiseY", "Zz: steigen um", "Offline-Banner", 200, -1000, 1000, "px"),
  number("offlineSleepSize", "Zz: Schriftgrösse", "Offline-Banner", 54, 8, 300, "px"),
] as const satisfies readonly SettingField[];
