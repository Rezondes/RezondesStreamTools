// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.3, 0.5, 3, undefined, 0.01),
  inherits(color("woodBackground", "Holz: Hintergrund Farbe (Holz)", "Feinschliff: Allgemein", ""), "wood"),
  inherits(color("woodBackground2", "Holz: Hintergrund Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Allgemein", ""), "woodDark"),
  number("woodBackground3", "Holz: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Allgemein", 180, -360, 360),
  number("woodBackground4", "Holz: Hintergrund Verlauf Stopp 1", "Feinschliff: Allgemein", 44, 0, 100, "px"),
  number("woodBackground5", "Holz: Hintergrund Verlauf Stopp 2", "Feinschliff: Allgemein", 44, 0, 100, "px"),
  number("woodBackground6", "Holz: Hintergrund Verlauf Stopp 2 (2)", "Feinschliff: Allgemein", 44, 0, 100, "px"),
  number("woodBackground7", "Holz: Hintergrund Verlauf Stopp 2 (3)", "Feinschliff: Allgemein", 3, 0, 100, "px"),
  inherits(color("woodBorder", "Holz: Rand Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Allgemein", ""), "woodDark"),
  number("woodBorder2", "Holz: Rand Stärke", "Feinschliff: Allgemein", 5, 0, 40, "px"),
  number("woodBorderRadius", "Holz: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Allgemein", 100, 0, 400),
  inherits(color("woodColor", "Holz: Textfarbe", "Feinschliff: Allgemein", ""), "textOnWood"),
  number("woodBoxShadow", "Holz: Schatten y", "Feinschliff: Allgemein", 10, -40, 40, "px"),
  number("woodBoxShadow2", "Holz: Schatten Unschärfe", "Feinschliff: Allgemein", 24, 0, 96, "px"),
  number("shapePartLineStrokeWidth", "Form Linie: Linienstärke", "Feinschliff: Allgemein", 4, 0, 16),
  number("kfFadeToOpacity", "Einblenden (Ende): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("kfFadeOutFromOpacity", "Ausblenden (Start): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("kfRiseInFromTranslate", "Aufsteigen (Start): Verschiebung y", "Feinschliff: Allgemein", 20, -80, 80, "px"),
  number("kfRiseInFromScale", "Aufsteigen (Start): Grösse", "Feinschliff: Allgemein", 0.96, 0, 3.84, undefined, 0.01),
  number("kfRiseInToOpacity", "Aufsteigen (Ende): Deckkraft", "Feinschliff: Allgemein", 1, 0, 1, undefined, 0.01),
  number("kfRiseInToScale", "Aufsteigen (Ende): Grösse", "Feinschliff: Allgemein", 1, 0, 4, undefined, 0.01),
] as const satisfies readonly SettingField[];
