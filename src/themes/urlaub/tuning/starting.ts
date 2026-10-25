// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_TUNING = [
  number("buoyRopeWidth", "Boje Seil: Breite", "Feinschliff: Starting", 480, 0, 1920, "px"),
  number("buoyRopeHeight", "Boje Seil: Höhe", "Feinschliff: Starting", 54, 0, 216, "px"),
  inherits(color("ropeLineStroke", "Seil Linie: Linienfarbe Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting", ""), "woodDark"),
  number("ropeLineStrokeWidth", "Seil Linie: Linienstärke", "Feinschliff: Starting", 9, 0, 36),
  inherits(color("ropeTwistStroke", "Seil Drall: Linienfarbe Farbe (Holz)", "Feinschliff: Starting", ""), "wood"),
  inherits(color("ropeTwistStroke2", "Seil Drall: Linienfarbe Farbe (Gischt)", "Feinschliff: Starting", ""), "foam"),
  number("ropeTwistStroke3", "Seil Drall: Linienfarbe Farbanteil", "Feinschliff: Starting", 60, 0, 100, "%"),
  number("ropeTwistStrokeWidth", "Seil Drall: Linienstärke", "Feinschliff: Starting", 5, 0, 20),
  number("ropeTwistStrokeDasharray", "Seil Drall: Strichmuster Wert 1", "Feinschliff: Starting", 6, 0, 24),
  number("ropeTwistStrokeDasharray2", "Seil Drall: Strichmuster Wert 2", "Feinschliff: Starting", 4, 0, 16),
  inherits(color("buoyRingFill", "Boje Ring: Füllfarbe Farbe (Gischt)", "Feinschliff: Starting", ""), "foam"),
  inherits(color("buoyRingStroke", "Boje Ring: Linienfarbe Farbe (Text auf Holz)", "Feinschliff: Starting", ""), "textOnWood"),
  number("buoyRingStrokeWidth", "Boje Ring: Linienstärke", "Feinschliff: Starting", 2.5, 0, 10, undefined, 0.01),
  inherits(color("buoyStripesFill", "Boje Streifen: Füllfarbe Farbe (Akzent (Hibiskus))", "Feinschliff: Starting", ""), "accent"),
  number("buoyAnimation", "Boje: Animation Dauer", "Feinschliff: Starting", 1.8, 0, 9, "s", 0.05),
] as const satisfies readonly SettingField[];
