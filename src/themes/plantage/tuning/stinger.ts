// Fine-tuning fields of the Plantage theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerMango", "Mango: Farbe", "Stinger", ""), "mango"),
  inherits(color("stingerBlush", "Mango: Röte", "Stinger", ""), "mangoBlush"),
  inherits(color("stingerLeaf", "Blätter: Farbe", "Stinger", ""), "leaf"),
  inherits(color("stingerLeafDark", "Blätter: dunkle Farbe", "Stinger", ""), "leafDark"),
  inherits(color("stingerGloss", "Glanz: Farbe", "Stinger", ""), "paper"),
  inherits(color("stingerShadow", "Schatten: Farbe", "Stinger", ""), "soilDark"),
  inherits(color("stingerTextColor", "Text: Farbe", "Stinger", ""), "textColor"),
  inherits(font("stingerFont", "Text: Schrift", "Stinger", "", ["Fredoka", "Baloo 2", "Pacifico", "Nunito"]), "titleFont"),
  number("stingerTextSize", "Text: Schriftgrösse", "Stinger", 140, 10, 400, "px"),
  number("stingerTextBlur", "Text: Schatten Unschärfe", "Stinger", 30, 0, 200, "px"),
  number("stingerTextLift", "Text: Schatten Versatz", "Stinger", 8, -100, 100, "px"),
  number("stingerShown", "Text: sichtbar über (Anteil der Zeit)", "Stinger", 0.6, 0, 1, undefined, 0.01),
  number("stingerGlossAlpha", "Glanz: Deckkraft", "Stinger", 0.45, 0, 1, undefined, 0.01),
  number("stingerStartRadius", "Mango: Radius am Anfang", "Stinger", 90, 0, 1000, "px"),
  number("stingerCoverRadius", "Mango: Radius am Übergang", "Stinger", 1200, 0, 4000, "px"),
  number("stingerWhirlLead", "Blätter: wirbeln vor dem Übergang los", "Stinger", 0.25, 0, 3, "s", 0.05),
  number("stingerWhirlSpeedMin", "Blätter: Tempo mindestens (px pro Sekunde)", "Stinger", 500, 0, 5000),
  number("stingerWhirlSpeedMax", "Blätter: Tempo höchstens (px pro Sekunde)", "Stinger", 1300, 0, 5000),
  number("stingerWhirlGravity", "Blätter: Schwerkraft", "Stinger", 260, -5000, 5000),
  number("stingerWhirlDrag", "Blätter: Bremsung", "Stinger", 1.6, 0, 20, undefined, 0.05),
  number("stingerWhirlLife", "Blätter: Dauer", "Stinger", 1.4, 0, 10, "s", 0.05),
  number("stingerLeafMin", "Blätter: Länge mindestens", "Stinger", 40, 0, 400, "px"),
  number("stingerLeafRange", "Blätter: Länge zusätzlich bis", "Stinger", 50, 0, 400, "px"),
] as const satisfies readonly SettingField[];
