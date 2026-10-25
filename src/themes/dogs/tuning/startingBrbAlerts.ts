// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, BRB, Alerts" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ALERTS_TUNING = [
  number("bubblePadding", "Sprechblase: Innenabstand oben", "Feinschliff: Starting, BRB, Alerts", 6, 0, 40, "px"),
  number("bubblePadding2", "Sprechblase: Innenabstand links/rechts", "Feinschliff: Starting, BRB, Alerts", 22, 0, 88, "px"),
  number("bubblePadding3", "Sprechblase: Innenabstand unten", "Feinschliff: Starting, BRB, Alerts", 10, 0, 40, "px"),
  number("bubbleFontSize", "Sprechblase: Schriftgrösse", "Feinschliff: Starting, BRB, Alerts", 1.75, 0, 7, undefined, 0.01),
  number("bubbleFontWeight", "Sprechblase: Schriftstärke", "Feinschliff: Starting, BRB, Alerts", 700, 100, 900, undefined, 100),
  inherits(color("bubbleColor", "Sprechblase: Textfarbe", "Feinschliff: Starting, BRB, Alerts", ""), ""),
  inherits(font("bubbleFont", "Sprechblase: Schrift", "Feinschliff: Starting, BRB, Alerts", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
  number("bubbleAfterLeft", "Sprechblase (Ebene 2): Lage links", "Feinschliff: Starting, BRB, Alerts", 4, -16, 16),
  number("bubbleAfterLeft2", "Sprechblase (Ebene 2): Lage links (2)", "Feinschliff: Starting, BRB, Alerts", 5, -40, 40, "px"),
  number("bubbleAfterBottom", "Sprechblase (Ebene 2): Lage unten", "Feinschliff: Starting, BRB, Alerts", -4, -16, 16),
  number("bubbleAfterBottom2", "Sprechblase (Ebene 2): Lage unten (2)", "Feinschliff: Starting, BRB, Alerts", 5, -40, 40, "px"),
  number("bubbleAfterWidth", "Sprechblase (Ebene 2): Breite", "Feinschliff: Starting, BRB, Alerts", 3, 0, 12),
  number("bubbleAfterWidth2", "Sprechblase (Ebene 2): Breite (2)", "Feinschliff: Starting, BRB, Alerts", 5, 0, 40, "px"),
  number("bubbleAfterHeight", "Sprechblase (Ebene 2): Höhe", "Feinschliff: Starting, BRB, Alerts", 3, 0, 12),
  number("bubbleAfterHeight2", "Sprechblase (Ebene 2): Höhe (2)", "Feinschliff: Starting, BRB, Alerts", 5, 0, 40, "px"),
  inherits(color("bubbleAfterBackground", "Sprechblase (Ebene 2): Hintergrund Farbe (Schild)", "Feinschliff: Starting, BRB, Alerts", ""), "cream"),
  inherits(color("bubbleAfterBoxShadow", "Sprechblase (Ebene 2): Schatten Farbe (Tinte (Kontur))", "Feinschliff: Starting, BRB, Alerts", ""), "ink"),
  inherits(color("bubbleAfterBoxShadow2", "Sprechblase (Ebene 2): Schatten Farbe (Tinte (Kontur)) (2)", "Feinschliff: Starting, BRB, Alerts", ""), "ink"),
  inherits(color("bubbleAfterBoxShadow3", "Sprechblase (Ebene 2): Schatten Farbe (Tinte (Kontur)) (3)", "Feinschliff: Starting, BRB, Alerts", ""), "ink"),
  number("bubbleAfterBoxShadow4", "Sprechblase (Ebene 2): Schatten y (Teil 1)", "Feinschliff: Starting, BRB, Alerts", 5, -40, 40, "px"),
  number("bubbleAfterBoxShadow5", "Sprechblase (Ebene 2): Schatten x (Teil 2)", "Feinschliff: Starting, BRB, Alerts", 5, -40, 40, "px"),
  number("bubbleAfterBoxShadow6", "Sprechblase (Ebene 2): Schatten x (Teil 3)", "Feinschliff: Starting, BRB, Alerts", 5, -40, 40, "px"),
] as const satisfies readonly SettingField[];
