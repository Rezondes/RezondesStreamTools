// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_CAM_INFO_TUNING = [
  inherits(color("woodBackground", "Holz: Hintergrund Farbe (Holz)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", ""), "wood"),
  inherits(color("woodBackground2", "Holz: Hintergrund Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", ""), "woodDark"),
  number("woodBackground3", "Holz: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 180, -360, 360),
  number("woodBackground4", "Holz: Hintergrund Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 44, 0, 100, "px"),
  number("woodBackground5", "Holz: Hintergrund Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 44, 0, 100, "px"),
  number("woodBackground6", "Holz: Hintergrund Verlauf Stopp 2 (2)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 44, 0, 100, "px"),
  number("woodBackground7", "Holz: Hintergrund Verlauf Stopp 2 (3)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 3, 0, 100, "px"),
  inherits(color("woodBorder", "Holz: Rand Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", ""), "woodDark"),
  number("woodBorder2", "Holz: Rand Stärke", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 5, 0, 40, "px"),
  number("woodBorderRadius", "Holz: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 100, 0, 400),
  inherits(color("woodColor", "Holz: Textfarbe", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", ""), "textOnWood"),
  number("woodBoxShadow", "Holz: Schatten y", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 10, -40, 40, "px"),
  number("woodBoxShadow2", "Holz: Schatten Unschärfe", "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite", 24, 0, 96, "px"),
] as const satisfies readonly SettingField[];
