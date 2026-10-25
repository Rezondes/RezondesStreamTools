// Fine-tuning fields of the Kebab theme, group "Feinschliff: Kamera-Rahmen" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CAM_TUNING = [
  number("camFrameInset", "Kamera Rahmen: Lage", "Feinschliff: Kamera-Rahmen", 6, -40, 40, "px"),
  inherits(color("camFrameBorder", "Kamera Rahmen: Rand Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Kamera-Rahmen", ""), "red"),
  number("camFrameBorderRadius", "Kamera Rahmen: Eckenradius", "Feinschliff: Kamera-Rahmen", 6, 0, 40, "px"),
  number("camAwningHeight", "Kamera Markise: Höhe", "Feinschliff: Kamera-Rahmen", 16, 0, 100, "%"),
  inherits(color("awningRedFill", "Markise rot: Füllfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Kamera-Rahmen", ""), "red"),
  inherits(color("awningPaperFill", "Markise Papier: Füllfarbe Farbe (Papier)", "Feinschliff: Kamera-Rahmen", ""), "paper"),
  inherits(color("awningEdgeStroke", "Markise Kante: Linienfarbe Farbe (Rot für Schrift und Flächen)", "Feinschliff: Kamera-Rahmen", ""), "redText"),
  number("awningEdgeStrokeWidth", "Markise Kante: Linienstärke", "Feinschliff: Kamera-Rahmen", 4, 0, 40, "px"),
  number("camCounterHeight", "Kamera Theke: Höhe", "Feinschliff: Kamera-Rahmen", 7, 0, 100, "%"),
  inherits(color("camCounterBackground", "Kamera Theke: Hintergrund Farbe (Text dunkel)", "Feinschliff: Kamera-Rahmen", ""), "brown"),
  inherits(color("camCounterBorderTop", "Kamera Theke: Rand oben Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Kamera-Rahmen", ""), "red"),
  number("camCounterBorderTop2", "Kamera Theke: Rand oben Stärke", "Feinschliff: Kamera-Rahmen", 4, 0, 40, "px"),
  number("camNameLeft", "Kamera Name: Lage links", "Feinschliff: Kamera-Rahmen", 50, -150, 150, "%"),
  number("camNameBottom", "Kamera Name: Lage unten", "Feinschliff: Kamera-Rahmen", 2, -100, 100, "%"),
  number("camNameTransform", "Kamera Name: Verformung Verschiebung x", "Feinschliff: Kamera-Rahmen", -50, -150, 150, "%"),
  number("camNamePadding", "Kamera Name: Innenabstand oben/unten", "Feinschliff: Kamera-Rahmen", 6, 0, 40, "px"),
  number("camNamePadding2", "Kamera Name: Innenabstand links/rechts", "Feinschliff: Kamera-Rahmen", 22, 0, 88, "px"),
  inherits(color("camNameBackground", "Kamera Name: Hintergrund Farbe (Bon-Papier)", "Feinschliff: Kamera-Rahmen", ""), "bon"),
  inherits(color("camNameColor", "Kamera Name: Textfarbe", "Feinschliff: Kamera-Rahmen", ""), "redText"),
  inherits(font("camNameFont", "Kamera Name: Schrift", "Feinschliff: Kamera-Rahmen", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("camNameFontSize", "Kamera Name: Schriftgrösse (em)", "Feinschliff: Kamera-Rahmen", 1.1, 0, 4.4, undefined, 0.01),
  inherits(color("camNameBoxShadow", "Kamera Name: Schatten Farbe (Text dunkel)", "Feinschliff: Kamera-Rahmen", ""), "brown"),
  number("camNameBoxShadow2", "Kamera Name: Schatten y", "Feinschliff: Kamera-Rahmen", 10, -40, 40, "px"),
  number("camNameBoxShadow3", "Kamera Name: Schatten Unschärfe", "Feinschliff: Kamera-Rahmen", 24, 0, 96, "px"),
  number("camNameBoxShadow4", "Kamera Name: Schatten Farbanteil", "Feinschliff: Kamera-Rahmen", 18, 0, 100, "%"),
  number("camRahmenCamNameBottom", "Kamera (Rahmen): Name: Lage unten", "Feinschliff: Kamera-Rahmen", 6, -40, 40, "px"),
] as const satisfies readonly SettingField[];
