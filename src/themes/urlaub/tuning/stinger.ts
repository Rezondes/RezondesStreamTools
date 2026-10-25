// Fine-tuning fields of the Urlaub theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerSea", "Welle: Farbe", "Stinger", ""), "sea"),
  inherits(color("stingerSeaDeep", "Welle: tiefe Farbe", "Stinger", ""), "seaDeep"),
  inherits(color("stingerFoamColor", "Gischt: Farbe", "Stinger", ""), "foam"),
  inherits(color("stingerTextColor", "Text: Farbe", "Stinger", ""), "textColor"),
  inherits(color("stingerPalmColor", "Palme: Farbe", "Stinger", ""), "woodDark"),
  inherits(font("stingerFont", "Text: Schrift", "Stinger", "", ["Pacifico", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  number("stingerTextSize", "Text: Schriftgrösse", "Stinger", 140, 10, 400, "px"),
  number("stingerShown", "Text und Palme: sichtbar über (Anteil der Zeit)", "Stinger", 0.6, 0, 1, undefined, 0.01),
  number("stingerScale", "Welle: breiter als im Alert um", "Stinger", 3, 0, 10, undefined, 0.1),
  number("stingerRise", "Welle: steigt über das Bild um", "Stinger", 140, 0, 1000, "px"),
  number("stingerReach", "Welle: beginnt ausserhalb um", "Stinger", 1200, 0, 4000, "px"),
  number("stingerLayer", "Welle: Abstand der Schichten", "Stinger", 110, 0, 1000, "px"),
  number("stingerFoamWidth", "Gischtlinie: Breite", "Stinger", 14, 0, 100, "px"),
  number("stingerRippleSize", "Kräuselung: Höhe", "Stinger", 10, 0, 200, "px"),
  number("stingerRippleWave", "Kräuselung: Dichte", "Stinger", 0.012, 0, 0.2, undefined, 0.001),
  number("stingerRippleSpeed", "Kräuselung: Tempo", "Stinger", 6, 0, 60, undefined, 0.1),
  number("stingerSpraySpeedMin", "Gischt: Tempo mindestens (px pro Sekunde)", "Stinger", 300, 0, 5000),
  number("stingerSpraySpeedMax", "Gischt: Tempo höchstens (px pro Sekunde)", "Stinger", 800, 0, 5000),
  number("stingerSprayGravity", "Gischt: Schwerkraft", "Stinger", 2200, -10000, 10000),
  number("stingerSprayLife", "Gischt: Dauer", "Stinger", 0.45, 0, 5, "s", 0.05),
  number("stingerSpraySize", "Gischt: Tropfengrösse", "Stinger", 12, 0, 200, "px"),
  number("stingerFace", "Gischt: fliegt auf Höhe der Welle (Anteil)", "Stinger", 0.45, 0, 1, undefined, 0.01),
  number("stingerLean", "Gischt: Neigung (Bogenmass)", "Stinger", 0.5, 0, 3, undefined, 0.01),
] as const satisfies readonly SettingField[];
