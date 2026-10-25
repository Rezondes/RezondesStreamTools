// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_ENDING_TUNING = [
  number("titleTop", "Titel: Lage oben", "Feinschliff: Starting, Ending", 80, -320, 320, "px"),
  number("titleFontSize", "Titel: Schriftgrösse Anteil von „Titel: Grösse“ (%)", "Feinschliff: Starting, Ending", 100, 0, 400),
  number("titleFontWeight", "Titel: Schriftstärke", "Feinschliff: Starting, Ending", 700, 100, 900, undefined, 100),
  number("titleLineHeight", "Titel: Zeilenhöhe", "Feinschliff: Starting, Ending", 1, 0.5, 3, undefined, 0.01),
  inherits(color("titleColor", "Titel: Textfarbe", "Feinschliff: Starting, Ending", ""), "cream"),
  inherits(color("titleTextShadow", "Titel: Textschatten Farbe (Tinte (Kontur))", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow2", "Titel: Textschatten Farbe (Tinte (Kontur)) (2)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow3", "Titel: Textschatten Farbe (Tinte (Kontur)) (3)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow4", "Titel: Textschatten Farbe (Tinte (Kontur)) (4)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow5", "Titel: Textschatten Farbe (Tinte (Kontur)) (5)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow6", "Titel: Textschatten Farbe (Tinte (Kontur)) (6)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow7", "Titel: Textschatten Farbe (Tinte (Kontur)) (7)", "Feinschliff: Starting, Ending", ""), "ink"),
  inherits(color("titleTextShadow8", "Titel: Textschatten Farbe (Tinte (Kontur)) (8)", "Feinschliff: Starting, Ending", ""), "ink"),
  number("titleTextShadow9", "Titel: Textschatten y (Teil 9)", "Feinschliff: Starting, Ending", 3, -12, 12),
  inherits(font("titleFont", "Titel: Schrift", "Feinschliff: Starting, Ending", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("subtitleTop", "Untertitel: Lage oben", "Feinschliff: Starting, Ending", 200, -800, 800, "px"),
  number("subtitleFontSize", "Untertitel: Schriftgrösse", "Feinschliff: Starting, Ending", 1.3, 0, 5.2, undefined, 0.01),
  number("subtitleFontWeight", "Untertitel: Schriftstärke", "Feinschliff: Starting, Ending", 600, 100, 900, undefined, 100),
  inherits(color("subtitleColor", "Untertitel: Textfarbe", "Feinschliff: Starting, Ending", ""), ""),
  inherits(font("subtitleFont", "Untertitel: Schrift", "Feinschliff: Starting, Ending", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
