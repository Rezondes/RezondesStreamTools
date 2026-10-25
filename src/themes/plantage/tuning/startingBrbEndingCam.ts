// Fine-tuning fields of the Plantage theme, group "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CAM_TUNING = [
  inherits(color("woodBackground", "Holz: Hintergrund Farbe (Erntezettel)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "paper"),
  inherits(color("woodBackground2", "Holz: Hintergrund Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "woodDark"),
  inherits(color("woodBackground3", "Holz: Hintergrund Farbe (Holz dunkel (Maserung, Rand)) (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "woodDark"),
  inherits(color("woodBackground4", "Holz: Hintergrund Farbe (Holz)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "wood"),
  number("woodBackground5", "Holz: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 180, -360, 360),
  number("woodBackground6", "Holz: Hintergrund Farbanteil", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 22, 0, 100, "%"),
  number("woodBackground7", "Holz: Hintergrund Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 45, 0, 100, "%"),
  number("woodBackground8", "Holz: Hintergrund Farbanteil (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 30, 0, 100, "%"),
  number("woodBackground9", "Holz: Hintergrund Verlaufswinkel (Grad) (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 180, -360, 360),
  number("woodBackground10", "Holz: Hintergrund Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 44, 0, 100, "px"),
  number("woodBackground11", "Holz: Hintergrund Farbanteil (3)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 55, 0, 100, "%"),
  number("woodBackground12", "Holz: Hintergrund Verlauf Stopp 2 (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 44, 0, 100, "px"),
  number("woodBackground13", "Holz: Hintergrund Verlauf Stopp 2 (3)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 44, 0, 100, "px"),
  number("woodBackground14", "Holz: Hintergrund Verlauf Stopp 2 (4)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 2, 0, 100, "px"),
  inherits(color("woodBorder", "Holz: Rand Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "woodDark"),
  number("woodBorder2", "Holz: Rand Stärke", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 2, 0, 40, "px"),
  number("woodBorder3", "Holz: Rand Farbanteil", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 70, 0, 100, "%"),
  number("woodBorderRadius", "Holz: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 100, 0, 400),
  inherits(color("woodColor", "Holz: Textfarbe", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "textOnWood"),
  inherits(color("woodBoxShadow", "Holz: Schatten Farbe (Erde dunkel)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "soilDark"),
  inherits(color("woodBoxShadow2", "Holz: Schatten Farbe (Erntezettel)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", ""), "paper"),
  number("woodBoxShadow3", "Holz: Schatten y (Teil 1)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 26, -104, 104, "px"),
  number("woodBoxShadow4", "Holz: Schatten Unschärfe (Teil 1)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 56, 0, 224, "px"),
  number("woodBoxShadow5", "Holz: Schatten Ausbreitung (Teil 1)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 18, -72, 72, "px"),
  number("woodBoxShadow6", "Holz: Schatten Farbanteil", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 150, 0, 150, "%"),
  number("woodBoxShadow7", "Holz: Schatten y (Teil 2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 2, -40, 40, "px"),
  number("woodBoxShadow8", "Holz: Schatten Farbanteil (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen", 55, 0, 100, "%"),
] as const satisfies readonly SettingField[];
