// Fine-tuning fields of the Chaos theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTitleColor", "Titel: Farbe", "Profilbanner", ""), "accentText"),
  inherits(color("profileGlowColor", "Titel: Leuchten", "Profilbanner", ""), "accent"),
  inherits(color("profileTextColor", "Zeile: Farbe", "Profilbanner", ""), "textColor"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Space Grotesk", "Inter", "Manrope", "DM Sans"]), "font"),
  number("profileTitleX", "Titel: Mitte (Anteil der Breite)", "Profilbanner", 0.58, 0, 1, undefined, 0.01),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 250, -480, 960, "px"),
  number("profileTitleSize", "Titel: Schriftgrösse", "Profilbanner", 120, 8, 400, "px"),
  number("profileTextY", "Zeile: von oben", "Profilbanner", 340, -480, 960, "px"),
  number("profileTextSize", "Zeile: Schriftgrösse", "Profilbanner", 34, 8, 200, "px"),
] as const satisfies readonly SettingField[];
