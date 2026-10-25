// Fine-tuning fields of the Standard theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("bannerOfflineBackground", "Hintergrund", "Offline-Banner", ""), "background"),
  inherits(color("bannerOfflineNameColor", "Kanalzeile: Farbe", "Offline-Banner", ""), "mutedColor"),
  inherits(color("bannerOfflineTitleColor", "Titel: Farbe", "Offline-Banner", ""), "textColor"),
  inherits(color("bannerOfflineTextColor", "Text: Farbe", "Offline-Banner", ""), "mutedColor"),
  inherits(color("bannerOfflineBarColor", "Balken: Farbe 1", "Offline-Banner", ""), "accent"),
  inherits(color("bannerOfflineBarColor2", "Balken: Farbe 2", "Offline-Banner", ""), "accent2"),
  inherits(font("bannerOfflineFont", "Schrift", "Offline-Banner", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("bannerOfflineLeft", "Abstand links", "Offline-Banner", 180, 0, 1920, "px"),
  number("bannerOfflineNameY", "Kanalzeile: Grundlinie", "Offline-Banner", 300, 0, 1080, "px"),
  number("bannerOfflineNameSize", "Kanalzeile: Grösse", "Offline-Banner", 44, 8, 300, "px"),
  number("bannerOfflineNameWeight", "Kanalzeile: Schriftstärke", "Offline-Banner", 700, 100, 900, undefined, 100),
  number("bannerOfflineTitleY", "Titel: Grundlinie", "Offline-Banner", 470, 0, 1080, "px"),
  number("bannerOfflineTitleSize", "Titel: Grösse", "Offline-Banner", 150, 8, 600, "px"),
  number("bannerOfflineTitleWeight", "Titel: Schriftstärke", "Offline-Banner", 800, 100, 900, undefined, 100),
  number("bannerOfflineBarY", "Balken: Lage oben", "Offline-Banner", 520, 0, 1080, "px"),
  number("bannerOfflineBarWidth", "Balken: Breite höchstens", "Offline-Banner", 720, 0, 1920, "px"),
  number("bannerOfflineBarHeight", "Balken: Höhe", "Offline-Banner", 12, 0, 200, "px"),
  number("bannerOfflineTextY", "Text: Grundlinie", "Offline-Banner", 620, 0, 1080, "px"),
  number("bannerOfflineTextSize", "Text: Grösse", "Offline-Banner", 48, 8, 300, "px"),
  number("bannerOfflineTextWeight", "Text: Schriftstärke", "Offline-Banner", 500, 100, 900, undefined, 100),
] as const satisfies readonly SettingField[];
