// Fine-tuning fields of the Chaos theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineTitleColor", "Titel: Farbe", "Offline-Banner", ""), "accentText"),
  inherits(color("offlineGlowColor", "Titel: Leuchten", "Offline-Banner", ""), "accent"),
  inherits(color("offlineTextColor", "Text: Farbe", "Offline-Banner", ""), "textColor"),
  inherits(color("offlineNameColor", "Kanalzeile: Farbe", "Offline-Banner", ""), "mutedColor"),
  inherits(color("offlineMonsterColor", "Monster: Farbe", "Offline-Banner", ""), "scribbleColor2"),
  inherits(color("offlineSleepColor", "Zz: Farbe", "Offline-Banner", ""), "lilac"),
  inherits(font("offlineTitleFont", "Titel: Schrift", "Offline-Banner", "", ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"]), "titleFont"),
  inherits(font("offlineFont", "Text: Schrift", "Offline-Banner", "", ["Space Grotesk", "Inter", "Manrope", "DM Sans"]), "font"),
  number("offlineNameY", "Kanalzeile: von oben", "Offline-Banner", 330, -1080, 2160, "px"),
  number("offlineNameSize", "Kanalzeile: Schriftgrösse", "Offline-Banner", 46, 8, 200, "px"),
  number("offlineTitleY", "Titel: von oben", "Offline-Banner", 540, -1080, 2160, "px"),
  number("offlineTitleSize", "Titel: Schriftgrösse", "Offline-Banner", 200, 8, 500, "px"),
  number("offlineTextY", "Text: von oben", "Offline-Banner", 700, -1080, 2160, "px"),
  number("offlineTextSize", "Text: Schriftgrösse", "Offline-Banner", 46, 8, 200, "px"),
  number("offlineMonsterX", "Monster: von links", "Offline-Banner", 1700, -1920, 3840, "px"),
  number("offlineMonsterY", "Monster: von oben", "Offline-Banner", 930, -1080, 2160, "px"),
  number("offlineMonsterSize", "Monster: Grösse", "Offline-Banner", 170, 0, 1000, "px"),
  number("offlineSleepX", "Zz: von links", "Offline-Banner", 1760, -1920, 3840, "px"),
  number("offlineSleepY", "Zz: von oben", "Offline-Banner", 800, -1080, 2160, "px"),
  number("offlineSleepSize", "Zz: Grösse", "Offline-Banner", 70, 0, 600, "px"),
] as const satisfies readonly SettingField[];
