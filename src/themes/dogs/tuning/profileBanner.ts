// Fine-tuning fields of the Dogs theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTitleColor", "Titel: Farbe", "Profilbanner", ""), "cream"),
  inherits(color("profileOutlineColor", "Titel: Umriss", "Profilbanner", ""), "ink"),
  inherits(color("profileLineColor", "Zeile: Farbe", "Profilbanner", ""), "textColor"),
  inherits(font("profileFont", "Schrift", "Profilbanner", "", ["Pixelify Sans", "VT323", "Silkscreen"]), "font"),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 80, -1080, 2160, "px"),
  number("profileLineY", "Zeile: von oben", "Profilbanner", 150, -1080, 2160, "px"),
  number("profileLineScale", "Zeile: Schriftgrösse (Faktor)", "Profilbanner", 1.3, 0, 5, undefined, 0.05),
  number("profileTitleShare", "Titel: Grösse (Anteil der Titelgrösse)", "Profilbanner", 0.72, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
