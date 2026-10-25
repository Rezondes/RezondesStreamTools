// Fine-tuning fields of the Kebab theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileRed", "Linien: Farbe", "Profilbanner", ""), "red"),
  inherits(color("profileRedText", "Schrift rot: Farbe", "Profilbanner", ""), "redText"),
  inherits(color("profilePaper", "Papier: Farbe", "Profilbanner", ""), "paper"),
  inherits(color("profileBrown", "Dunkel: Farbe", "Profilbanner", ""), "brown"),
  inherits(color("profileMuted", "Gedämpft: Farbe", "Profilbanner", ""), "muted"),
  inherits(color("profileSteamColor", "Dampf: Farbe", "Profilbanner", ""), "steam"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Nunito", "DM Sans", "Manrope"]), "font"),
  number("profileLogoTop", "Logo: von oben (Anteil der Höhe)", "Profilbanner", 0.02, 0, 1, undefined, 0.01),
  number("profileLogoHeight", "Logo: Höhe (Anteil)", "Profilbanner", 0.7, 0, 1, undefined, 0.01),
  number("profileTitleY", "Titel: von oben (Anteil)", "Profilbanner", 0.86, 0, 1, undefined, 0.01),
  number("profileTitleSize", "Titel: Schriftgrösse (Anteil)", "Profilbanner", 0.12, 0, 1, undefined, 0.005),
  number("profileLineY", "Zeile: von oben (Anteil)", "Profilbanner", 0.95, 0, 1, undefined, 0.01),
  number("profileLineSize", "Zeile: Schriftgrösse (Anteil)", "Profilbanner", 0.05, 0, 1, undefined, 0.005),
] as const satisfies readonly SettingField[];
