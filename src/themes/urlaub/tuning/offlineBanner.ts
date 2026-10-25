// Fine-tuning fields of the Urlaub theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineWood", "Schild: Holz", "Offline-Banner", ""), "wood"),
  inherits(color("offlineWoodDark", "Schild: Rand", "Offline-Banner", ""), "woodDark"),
  inherits(color("offlineTextColor", "Schild: Schrift Farbe", "Offline-Banner", ""), "textOnWood"),
  inherits(font("offlineTitleFont", "Titel: Schrift", "Offline-Banner", "", ["Pacifico", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("offlineFont", "Text: Schrift", "Offline-Banner", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), "font"),
  number("offlineSignX", "Schild: von links", "Offline-Banner", 470, -1920, 1920, "px"),
  number("offlineSignY", "Schild: von oben", "Offline-Banner", 230, -1080, 1080, "px"),
  number("offlineSignWidth", "Schild: Breite", "Offline-Banner", 980, 0, 1920, "px"),
  number("offlineSignHeight", "Schild: Höhe", "Offline-Banner", 520, 0, 1080, "px"),
  number("offlineSignBorder", "Schild: Randstärke", "Offline-Banner", 16, 0, 200, "px"),
  number("offlineTitleSize", "Titel: Schriftgrösse", "Offline-Banner", 110, 8, 300, "px"),
  number("offlineTitleY", "Titel: von oben", "Offline-Banner", 360, -1080, 2160, "px"),
  number("offlineTextSize", "Text: Schriftgrösse", "Offline-Banner", 40, 8, 200, "px"),
  number("offlineTextY", "Text: von oben", "Offline-Banner", 480, -1080, 2160, "px"),
  number("offlineLineSize", "Zeilen: Schriftgrösse", "Offline-Banner", 34, 8, 200, "px"),
  number("offlineLineY", "Zeilen: erste von oben", "Offline-Banner", 560, -1080, 2160, "px"),
  number("offlineLineStep", "Zeilen: Abstand", "Offline-Banner", 52, 0, 300, "px"),
  number("offlineLines", "Zeilen: höchstens", "Offline-Banner", 3, 0, 20),
  inherits(color("offlineWater", "Strand: Wasser", "Offline-Banner", ""), "waterColor"),
  inherits(color("offlineSand", "Strand: Sand", "Offline-Banner", ""), "sand"),
  inherits(color("offlinePalmLeaf", "Strand: Palmblätter", "Offline-Banner", ""), "palmLeaf"),
  inherits(color("offlinePalmTrunk", "Strand: Palmstamm", "Offline-Banner", ""), "palmTrunk"),
  color("offlineAmbient", "Strand: Grundlicht Farbe", "Offline-Banner", "#fff4e0"),
  number("offlineAmbientStrength", "Strand: Grundlicht Stärke", "Offline-Banner", 1.4, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
