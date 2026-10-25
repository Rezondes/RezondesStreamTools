// Fine-tuning fields of the Plantage theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTextColor", "Text: Farbe", "Profilbanner", ""), "textColor"),
  inherits(color("profileShadow", "Textschatten: Farbe", "Profilbanner", ""), "soilDark"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Fredoka", "Baloo 2", "Pacifico", "Nunito"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"]), "font"),
  inherits(color("profileSkyTop", "Himmel oben", "Profilbanner", ""), "skyDayTop"),
  inherits(color("profileSkyBottom", "Himmel unten", "Profilbanner", ""), "skyDayBottom"),
  inherits(color("profileSun", "Sonne", "Profilbanner", ""), "sun"),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 130, -480, 960, "px"),
  number("profileTextY", "Zeile: von oben", "Profilbanner", 220, -480, 960, "px"),
  number("profileTitleSize", "Titel: Schriftgrösse", "Profilbanner", 96, 8, 300, "px"),
  number("profileTextSize", "Zeile: Schriftgrösse", "Profilbanner", 34, 8, 200, "px"),
  number("profileGlow", "Textschatten: Unschärfe", "Profilbanner", 24, 0, 200, "px"),
] as const satisfies readonly SettingField[];
