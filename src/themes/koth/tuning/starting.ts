// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Starting" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_TUNING = [
  inherits(color("startingBackground", "Starting: Hintergrund Farbe (Himmel am Horizont)", "Feinschliff: Starting", ""), "skyHorizon"),
  inherits(color("warningStripesDark", "Warnstreifen: Dunkel Farbe (Oliv dunkel)", "Feinschliff: Starting", ""), "oliveDark"),
  number("warningStripesDark2", "Warnstreifen: Dunkel Farbanteil", "Feinschliff: Starting", 40, 0, 100, "%"),
  number("warningStripesHeight", "Warnstreifen: Höhe (vh)", "Feinschliff: Starting", 1.7, 0, 6.8, undefined, 0.01),
  inherits(color("warningStripesIBackground", "Warnstreifen: Fortschritt: Hintergrund Farbe (Akzent (Signal-Orange))", "Feinschliff: Starting", ""), "accent"),
  number("warningStripesIBackground2", "Warnstreifen: Fortschritt: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting", -45, -360, 360),
  number("warningStripesIBackground3", "Warnstreifen: Fortschritt: Hintergrund Verlauf Stopp 1", "Feinschliff: Starting", 18, 0, 100, "px"),
  number("warningStripesIBackground4", "Warnstreifen: Fortschritt: Hintergrund Verlauf Stopp 2", "Feinschliff: Starting", 18, 0, 100, "px"),
  number("warningStripesIBackground5", "Warnstreifen: Fortschritt: Hintergrund Verlauf Stopp 2 (2)", "Feinschliff: Starting", 36, 0, 100, "px"),
  number("startingTickerBottom", "Starting: Lauftext: Lage unten (vh)", "Feinschliff: Starting", 1.7, -6.8, 6.8, undefined, 0.01),
] as const satisfies readonly SettingField[];
