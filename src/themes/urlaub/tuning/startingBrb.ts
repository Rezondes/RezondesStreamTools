// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  number("boardGap", "Tafel: Abstand", "Feinschliff: Starting, BRB", 12, 0, 48, "px"),
  number("boardMinWidth", "Tafel: Mindestbreite", "Feinschliff: Starting, BRB", 520, 0, 2080, "px"),
  number("boardPadding", "Tafel: Innenabstand oben/unten", "Feinschliff: Starting, BRB", 16, 0, 64, "px"),
  number("boardPadding2", "Tafel: Innenabstand links/rechts", "Feinschliff: Starting, BRB", 40, 0, 160, "px"),
  number("bigFontSize", "Countdown: Schriftgrösse", "Feinschliff: Starting, BRB", 80, 0, 320, "px"),
  inherits(font("bigFont", "Countdown: Schrift", "Feinschliff: Starting, BRB", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), ""),
  inherits(color("driftwoodColor", "Treibholz: Textfarbe", "Feinschliff: Starting, BRB", ""), "foam"),
  inherits(color("driftwoodColor2", "Treibholz: Textfarbe (2)", "Feinschliff: Starting, BRB", ""), "wood"),
  number("driftwoodColor3", "Treibholz: Textfarbe Farbanteil", "Feinschliff: Starting, BRB", 92, 0, 100, "%"),
  inherits(color("driftwoodTextShadow", "Treibholz: Textschatten Farbe (Text auf Holz)", "Feinschliff: Starting, BRB", ""), "textOnWood"),
  inherits(color("driftwoodTextShadow2", "Treibholz: Textschatten Farbe (Text auf Holz) (2)", "Feinschliff: Starting, BRB", ""), "textOnWood"),
  number("driftwoodTextShadow3", "Treibholz: Textschatten y (Teil 1)", "Feinschliff: Starting, BRB", 2, -40, 40, "px"),
  number("driftwoodTextShadow4", "Treibholz: Textschatten Farbanteil", "Feinschliff: Starting, BRB", 60, 0, 100, "%"),
  number("driftwoodTextShadow5", "Treibholz: Textschatten y (Teil 2)", "Feinschliff: Starting, BRB", 6, -40, 40, "px"),
  number("driftwoodTextShadow6", "Treibholz: Textschatten Unschärfe (Teil 2)", "Feinschliff: Starting, BRB", 16, 0, 64, "px"),
  number("driftwoodTextShadow7", "Treibholz: Textschatten Farbanteil (2)", "Feinschliff: Starting, BRB", 35, 0, 100, "%"),
  number("postAfterLeft", "Pfosten: Stamm: Lage links", "Feinschliff: Starting, BRB", 50, -150, 150, "%"),
  number("postAfterWidth", "Pfosten: Stamm: Breite", "Feinschliff: Starting, BRB", 30, 0, 120, "px"),
  number("postAfterHeight", "Pfosten: Stamm: Höhe", "Feinschliff: Starting, BRB", 320, 0, 1280, "px"),
  number("postAfterTranslate", "Pfosten: Stamm: Verschiebung x", "Feinschliff: Starting, BRB", -50, -150, 150, "%"),
  inherits(color("postAfterBackground", "Pfosten: Stamm: Hintergrund Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Starting, BRB", ""), "woodDark"),
  inherits(color("postAfterBackground2", "Pfosten: Stamm: Hintergrund Farbe (Holz)", "Feinschliff: Starting, BRB", ""), "wood"),
  inherits(color("postAfterBackground3", "Pfosten: Stamm: Hintergrund Farbe (Holz dunkel (Maserung, Rand)) (2)", "Feinschliff: Starting, BRB", ""), "woodDark"),
  number("postAfterBackground4", "Pfosten: Stamm: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB", 90, -360, 360),
  number("postAfterBackground5", "Pfosten: Stamm: Hintergrund Verlauf Stopp 2", "Feinschliff: Starting, BRB", 45, 0, 100, "%"),
] as const satisfies readonly SettingField[];
