// Fine-tuning fields of the Dogs theme, group "Offline-Banner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const OFFLINE_BANNER_TUNING = [
  inherits(color("offlineTitleColor", "Titel: Farbe", "Offline-Banner", ""), "cream"),
  inherits(color("offlineOutlineColor", "Titel: Umriss", "Offline-Banner", ""), "ink"),
  inherits(color("offlineLineColor", "Zeile: Farbe", "Offline-Banner", ""), "nightSub"),
  inherits(font("offlineFont", "Schrift", "Offline-Banner", "", ["Pixelify Sans", "VT323", "Silkscreen"]), "font"),
  number("offlineTitleY", "Titel: von oben", "Offline-Banner", 130, -1080, 2160, "px"),
  number("offlineLineY", "Zeile: von oben", "Offline-Banner", 230, -1080, 2160, "px"),
  number("offlineLineScale", "Zeile: Schriftgrösse (Faktor)", "Offline-Banner", 1.3, 0, 5, undefined, 0.05),
  number("offlineTime", "Raum: Moment nach dem Hereinkommen", "Offline-Banner", 30, 0, 300, "s", 0.01),
  number("offlineLit", "Lampe: leuchtet ab (Anteil des Lichts)", "Offline-Banner", 0.5, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
