// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_TUNING = [
  number("kfWaddle0p100pRotate", "Watscheln (0 %, 100 %): Drehung (Grad)", "Feinschliff: Starting", -1, -360, 360),
  number("kfWaddle0p100pRotate2", "Watscheln (0 %, 100 %): Drehung (2)", "Feinschliff: Starting", 6, 0, 24),
  number("kfWaddle50pRotate", "Watscheln (50 %): Drehung (Grad)", "Feinschliff: Starting", 1, -360, 360),
  number("kfWaddle50pRotate2", "Watscheln (50 %): Drehung (2)", "Feinschliff: Starting", 6, 0, 24),
  inherits(color("grizzlyFur2", "Grizzly: --fur Farbe (Grizzly: Fell)", "Feinschliff: Starting", ""), "grizzlyFur"),
  inherits(color("grizzlyShade2", "Grizzly: --shade Farbe (Grizzly: Schattenton)", "Feinschliff: Starting", ""), "grizzlyShade"),
  inherits(color("grizzlyLimb", "Grizzly: --limb Farbe (Grizzly: Fell)", "Feinschliff: Starting", ""), "grizzlyFur"),
  number("walkerBottom", "Läufer: Lage unten", "Feinschliff: Starting", 2, -40, 40, "px"),
  number("walkerLeft", "Läufer: Lage links  1", "Feinschliff: Starting", 34, -136, 136, "px"),
  number("walkerHeight", "Läufer: Höhe", "Feinschliff: Starting", 52, 0, 208, "px"),
  number("walkerTransition", "Läufer: Übergang Dauer Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Starting", 100, 0, 400),
  number("walkerAnimation", "Läufer: Animation Dauer", "Feinschliff: Starting", 0.8, 0, 5, "s", 0.05),
  number("progressPathWidth", "Fortschritt Pfad: Breite", "Feinschliff: Starting", 380, 0, 1520, "px"),
  number("progressPathHeight", "Fortschritt Pfad: Höhe", "Feinschliff: Starting", 56, 0, 224, "px"),
  inherits(color("progressPathBackground", "Fortschritt Pfad: Hintergrund Farbe (Kontur)", "Feinschliff: Starting", ""), "outline"),
  number("progressPathBackground2", "Fortschritt Pfad: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting", 90, -360, 360),
  number("progressPathBackground3", "Fortschritt Pfad: Hintergrund Verlauf Stopp 1", "Feinschliff: Starting", 50, 0, 100, "%"),
  number("progressPathBackground4", "Fortschritt Pfad: Hintergrund Wert 5", "Feinschliff: Starting", 22, 0, 88, "px"),
  number("progressPathBackground5", "Fortschritt Pfad: Hintergrund Wert 6", "Feinschliff: Starting", 4, 0, 40, "px"),
] as const satisfies readonly SettingField[];
