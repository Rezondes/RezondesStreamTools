// Fine-tuning fields of the Kebab theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("kfRiseToTransform", "Aufsteigen (Ende): Verformung Verschiebung y", "Feinschliff: Allgemein", -220, -880, 880, "px"),
  inherits(color("toneRedTextColor", "Ton rot: Textfarbe", "Feinschliff: Allgemein", ""), "redText"),
  inherits(color("toneBrownColor", "Ton braun: Textfarbe", "Feinschliff: Allgemein", ""), "brown"),
  inherits(color("toneMutedColor", "Ton gedämpft: Textfarbe", "Feinschliff: Allgemein", ""), "muted"),
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.25, 0.5, 3, undefined, 0.01),
  inherits(color("inkStroke", "Tinte: Linienfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Allgemein", ""), "red"),
  inherits(color("fillFill", "Füllung: Füllfarbe Farbe (Papier)", "Feinschliff: Allgemein", ""), "paper"),
  inherits(font("arcLetterFont", "Bogenschrift: Buchstabe: Schrift", "Feinschliff: Allgemein", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  inherits(color("arcLetterFill", "Bogenschrift: Buchstabe: Füllfarbe Farbe (Papier)", "Feinschliff: Allgemein", ""), "paper"),
  inherits(color("arcLetterStroke", "Bogenschrift: Buchstabe: Linienfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Allgemein", ""), "red"),
  number("arcLetterLetterSpacing", "Bogenschrift: Buchstabe: Zeichenabstand", "Feinschliff: Allgemein", 1, -40, 40, "px"),
  inherits(color("arcLetterColor", "Bogenschrift: Buchstabe: Textfarbe", "Feinschliff: Allgemein", ""), ""),
  number("kfInFromTransform", "Einblenden (Start): Verformung Verschiebung y", "Feinschliff: Allgemein", 6, -40, 40, "px"),
  number("kfInToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("steamRate", "Dampf: Schwaden je Sekunde", "Feinschliff: Allgemein", 0.32, 0, 5, undefined, 0.01),
  number("steamSway", "Dampf: schwankt um", "Feinschliff: Allgemein", 9, 0, 200, "px"),
  number("steamAlpha", "Dampf: Deckkraft", "Feinschliff: Allgemein", 0.45, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
