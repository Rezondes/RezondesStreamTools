// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB, Ending, Alerts" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_TUNING = [
  number("bonNumberFontWeight", "Bon Nummer: Schriftstärke", "Feinschliff: Starting, BRB, Ending, Alerts", 600, 100, 900, undefined, 100),
  number("bonNumberFontSize", "Bon Nummer: Schriftgrösse (em)", "Feinschliff: Starting, BRB, Ending, Alerts", 0.75, 0, 3, undefined, 0.01),
  inherits(color("bonNumberColor", "Bon Nummer: Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts", ""), "muted"),
  number("bonNumberMarginTop", "Bon Nummer: Abstand oben", "Feinschliff: Starting, BRB, Ending, Alerts", 4, -40, 40, "px"),
  inherits(font("bonNumberFont", "Bon Nummer: Schrift", "Feinschliff: Starting, BRB, Ending, Alerts", "", ["Nunito", "DM Sans", "Manrope"]), ""),
  inherits(font("arcLetterFont", "Bogenschrift: Buchstabe: Schrift", "Feinschliff: Starting, BRB, Ending, Alerts", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  inherits(color("arcLetterFill", "Bogenschrift: Buchstabe: Füllfarbe Farbe (Papier)", "Feinschliff: Starting, BRB, Ending, Alerts", ""), "paper"),
  inherits(color("arcLetterStroke", "Bogenschrift: Buchstabe: Linienfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Starting, BRB, Ending, Alerts", ""), "red"),
  number("arcLetterLetterSpacing", "Bogenschrift: Buchstabe: Zeichenabstand", "Feinschliff: Starting, BRB, Ending, Alerts", 1, -40, 40, "px"),
  inherits(color("arcLetterColor", "Bogenschrift: Buchstabe: Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts", ""), ""),
  number("steamRate", "Dampf: Schwaden je Sekunde", "Feinschliff: Starting, BRB, Ending, Alerts", 0.32, 0, 5, undefined, 0.01),
  number("steamSway", "Dampf: schwankt um", "Feinschliff: Starting, BRB, Ending, Alerts", 9, 0, 200, "px"),
  number("steamAlpha", "Dampf: Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts", 0.45, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
