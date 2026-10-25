// Fine-tuning fields of the Kebab theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  number("shutterWidth", "Rollladen: Breite", "Feinschliff: Ending", 1400, 0, 5600, "px"),
  number("shutterHeight", "Rollladen: Höhe", "Feinschliff: Ending", 1080, 0, 4320, "px"),
  number("shutterTransform", "Rollladen: Verformung Verschiebung y", "Feinschliff: Ending", -100, -300, 300, "%"),
  inherits(color("shutterBoxBackground", "Rollladen Kasten: Hintergrund Farbe (Papier)", "Feinschliff: Ending", ""), "paper"),
  inherits(color("shutterBoxBackground2", "Rollladen Kasten: Hintergrund Farbe (Text dunkel)", "Feinschliff: Ending", ""), "brown"),
  number("shutterBoxBackground3", "Rollladen Kasten: Hintergrund Verlauf Stopp 1", "Feinschliff: Ending", 34, 0, 100, "px"),
  number("shutterBoxBackground4", "Rollladen Kasten: Hintergrund Farbanteil", "Feinschliff: Ending", 22, 0, 100, "%"),
  number("shutterBoxBackground5", "Rollladen Kasten: Hintergrund Verlauf Stopp 2", "Feinschliff: Ending", 34, 0, 100, "px"),
  number("shutterBoxBackground6", "Rollladen Kasten: Hintergrund Verlauf Stopp 2 (2)", "Feinschliff: Ending", 34, 0, 100, "px"),
  number("shutterBoxBackground7", "Rollladen Kasten: Hintergrund Verlauf Stopp 2 (3)", "Feinschliff: Ending", 3, 0, 100, "px"),
  inherits(color("shutterBoxBorderBottom", "Rollladen Kasten: Rand unten Farbe (Text dunkel)", "Feinschliff: Ending", ""), "brown"),
  number("shutterBoxBorderBottom2", "Rollladen Kasten: Rand unten Stärke", "Feinschliff: Ending", 14, 0, 56, "px"),
  number("shutterBoxBorderBottom3", "Rollladen Kasten: Rand unten Farbanteil", "Feinschliff: Ending", 35, 0, 100, "%"),
  inherits(color("shutterArcLetterFill", "Rollladen: Bogenschrift: Füllfarbe Farbe (Text dunkel)", "Feinschliff: Ending", ""), "brown"),
  inherits(color("shutterArcLetterStroke", "Rollladen: Bogenschrift: Linienfarbe Farbe (Papier)", "Feinschliff: Ending", ""), "paper"),
  number("shutterTitleWidth", "Rollladen Titel: Breite", "Feinschliff: Ending", 1400, 0, 5600, "px"),
  number("shutterTitleTop", "Rollladen Titel: Lage oben", "Feinschliff: Ending", 760, -3040, 3040, "px"),
  inherits(font("shutterTitleFont", "Rollladen Titel: Schrift", "Feinschliff: Ending", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("shutterTitleFontSize", "Rollladen Titel: Schriftgrösse", "Feinschliff: Ending", 84, 0, 336, "px"),
  inherits(color("shutterTitleColor", "Rollladen Titel: Textfarbe", "Feinschliff: Ending", ""), "paper"),
  number("endingTitleWidth", "Ending Titel: Breite", "Feinschliff: Ending", 1400, 0, 5600, "px"),
  number("endingTitleTop", "Ending Titel: Lage oben", "Feinschliff: Ending", 760, -3040, 3040, "px"),
  inherits(font("endingTitleFont", "Ending Titel: Schrift", "Feinschliff: Ending", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("endingTitleFontSize", "Ending Titel: Schriftgrösse", "Feinschliff: Ending", 84, 0, 336, "px"),
  inherits(color("endingTitleColor", "Ending Titel: Textfarbe", "Feinschliff: Ending", ""), "paper"),
  inherits(color("endingTitleColor2", "Ending Titel: Textfarbe", "Feinschliff: Ending", ""), "redText"),
] as const satisfies readonly SettingField[];
