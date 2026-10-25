// Fine-tuning fields of the Bärenbande theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTextColor", "Zeile: Farbe", "Profilbanner", ""), "textDark"),
  inherits(color("profileCardShade", "Karte: Schattenband", "Profilbanner", ""), "paperShade"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Sniglet", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), "font"),
  number("profileBearX", "Bär: Mitte von links", "Profilbanner", 230, -1200, 2400, "px"),
  number("profileBearY", "Bär: Füsse von oben", "Profilbanner", 462, -480, 960, "px"),
  number("profileBearHeight", "Bär: Höhe", "Profilbanner", 330, 0, 960, "px"),
  number("profileCardX", "Karte: von links", "Profilbanner", 520, -1200, 2400, "px"),
  number("profileCardY", "Karte: von oben", "Profilbanner", 120, -480, 960, "px"),
  number("profileCardWidth", "Karte: Breite", "Profilbanner", 600, 0, 1200, "px"),
  number("profileCardHeight", "Karte: Höhe", "Profilbanner", 230, 0, 480, "px"),
  number("profileTitleX", "Titel: Mitte von links", "Profilbanner", 820, -1200, 2400, "px"),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 205, -480, 960, "px"),
  number("profileTitleSize", "Titel: Schriftgrösse", "Profilbanner", 76, 8, 300, "px"),
  number("profileTextY", "Zeile: von oben", "Profilbanner", 290, -480, 960, "px"),
  number("profileTextSize", "Zeile: Schriftgrösse", "Profilbanner", 30, 8, 200, "px"),
] as const satisfies readonly SettingField[];
