// Fine-tuning fields of the Standard theme, group "Feinschliff: Starting" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_TUNING = [
  number("stBarWidth", "Fortschrittsbalken (Vollbild): Breite", "Feinschliff: Starting", 760, 0, 3040, "px"),
  number("stBarHeight", "Fortschrittsbalken (Vollbild): Höhe", "Feinschliff: Starting", 10, 0, 40, "px"),
  number("stBarBorderRadius", "Fortschrittsbalken (Vollbild): Eckenradius", "Feinschliff: Starting", 999, 0, 999, "px"),
  inherits(color("stBarBackground", "Fortschrittsbalken (Vollbild): Hintergrund Farbe (Textfarbe)", "Feinschliff: Starting", ""), "textColor"),
  number("stBarBackground2", "Fortschrittsbalken (Vollbild): Hintergrund Farbanteil", "Feinschliff: Starting", 8, 0, 100, "%"),
  inherits(color("stFillBackground", "Fortschrittsbalken (Füllung): Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Starting", ""), "accent"),
  inherits(color("stFillBackground2", "Fortschrittsbalken (Füllung): Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Starting", ""), "accent2"),
  number("stFillBackground3", "Fortschrittsbalken (Füllung): Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting", 90, -360, 360),
  inherits(color("stFillBoxShadow", "Fortschrittsbalken (Füllung): Schatten Farbe (Akzentfarbe)", "Feinschliff: Starting", ""), "accent"),
  number("stFillBoxShadow2", "Fortschrittsbalken (Füllung): Schatten Unschärfe", "Feinschliff: Starting", 24, 0, 96, "px"),
  number("stFillBoxShadow3", "Fortschrittsbalken (Füllung): Schatten Farbanteil", "Feinschliff: Starting", 60, 0, 100, "%"),
  number("stShineWidth", "Glanzlicht: Breite", "Feinschliff: Starting", 120, 0, 480, "px"),
  inherits(color("stShineBackground", "Glanzlicht: Hintergrund Farbe (Textfarbe)", "Feinschliff: Starting", ""), "textColor"),
  number("stShineBackground2", "Glanzlicht: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting", 90, -360, 360),
  number("stShineBackground3", "Glanzlicht: Hintergrund Farbanteil", "Feinschliff: Starting", 75, 0, 100, "%"),
  number("screenAtShine", "Vollbild-Ablauf: Glanzlicht ab", "Feinschliff: Starting", 2.6, 0, 10, "s", 0.05),
  number("screenTimeShine", "Glanzlicht: Lauf (Dauer)", "Feinschliff: Starting", 1.2, 0, 10, "s", 0.05),
  number("screenShineFrom", "Glanzlicht: startet bei (x)", "Feinschliff: Starting", -140, -560, 560, "px"),
  number("screenShineTo", "Glanzlicht: endet bei (x)", "Feinschliff: Starting", 900, -3600, 3600, "px"),
] as const satisfies readonly SettingField[];
