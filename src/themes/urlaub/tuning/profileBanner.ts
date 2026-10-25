// Fine-tuning fields of the Urlaub theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTextColor", "Text: Farbe", "Profilbanner", ""), "textColor"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Pacifico", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), "font"),
  number("profileTitleSize", "Titel: Schriftgrösse", "Profilbanner", 96, 8, 300, "px"),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 150, -480, 960, "px"),
  number("profileTextSize", "Zeile: Schriftgrösse", "Profilbanner", 34, 8, 200, "px"),
  number("profileTextY", "Zeile: von oben", "Profilbanner", 250, -480, 960, "px"),
  number("profileShadowAlpha", "Textschatten: Deckkraft", "Profilbanner", 0.45, 0, 1, undefined, 0.01),
  number("profileShadowBlur", "Textschatten: Unschärfe", "Profilbanner", 18, 0, 200, "px"),
  number("profileShadowDrop", "Textschatten: Versatz", "Profilbanner", 4, -100, 100, "px"),
  inherits(color("profileWater", "Strand: Wasser", "Profilbanner", ""), "waterColor"),
  inherits(color("profileSand", "Strand: Sand", "Profilbanner", ""), "sand"),
  inherits(color("profilePalmLeaf", "Strand: Palmblätter", "Profilbanner", ""), "palmLeaf"),
  inherits(color("profilePalmTrunk", "Strand: Palmstamm", "Profilbanner", ""), "palmTrunk"),
  color("profileAmbient", "Strand: Grundlicht Farbe", "Profilbanner", "#fff4e0"),
  number("profileAmbientStrength", "Strand: Grundlicht Stärke", "Profilbanner", 1.4, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
