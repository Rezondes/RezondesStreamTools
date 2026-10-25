// Fine-tuning fields of the Dogs theme, group "Feinschliff: Kamera-Rahmen" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CAM_TUNING = [
  number("camFrameInset", "Kamera Rahmen: Lage", "Feinschliff: Kamera-Rahmen", 8, -40, 40, "px"),
  number("camFrameTop", "Kamera Rahmen: Lage oben", "Feinschliff: Kamera-Rahmen", 8, -40, 40, "px"),
  inherits(color("camFrameBorder", "Kamera Rahmen: Rand Farbe (Schild)", "Feinschliff: Kamera-Rahmen", ""), "cream"),
  inherits(color("camFrameBoxShadow", "Kamera Rahmen: Schatten Farbe (Tinte (Kontur))", "Feinschliff: Kamera-Rahmen", ""), "ink"),
  inherits(color("camFrameBoxShadow2", "Kamera Rahmen: Schatten Farbe (Tinte (Kontur)) (2)", "Feinschliff: Kamera-Rahmen", ""), "ink"),
  number("camFrameBoxShadow3", "Kamera Rahmen: Schatten Ausbreitung (Teil 1)", "Feinschliff: Kamera-Rahmen", 5, -40, 40, "px"),
  number("camFrameBoxShadow4", "Kamera Rahmen: Schatten Ausbreitung (Teil 2)", "Feinschliff: Kamera-Rahmen", 5, -40, 40, "px"),
  number("camDgCamTop", "Kamera: Abstand oben", "Feinschliff: Kamera-Rahmen", 9, 0, 100, "%"),
  number("camRoofHeight", "Kamera Dach: Höhe", "Feinschliff: Kamera-Rahmen", 9, 0, 100, "%"),
  number("camRoofHeight2", "Kamera Dach: Höhe (2)", "Feinschliff: Kamera-Rahmen", 5, 0, 40, "px"),
  inherits(color("camRoofBackground", "Kamera Dach: Hintergrund Farbe (Dach: Farbe)", "Feinschliff: Kamera-Rahmen", ""), "camRoofColor"),
  number("camRoofClipPath", "Kamera Dach: Zuschnitt Eckpunkt 2", "Feinschliff: Kamera-Rahmen", 50, 0, 150, "%"),
  inherits(color("camRoofFilter", "Kamera Dach: Filter Farbe (Tinte (Kontur))", "Feinschliff: Kamera-Rahmen", ""), "ink"),
  number("camRoofFilter2", "Kamera Dach: Filter Schlagschatten", "Feinschliff: Kamera-Rahmen", 5, 0, 40, "px"),
  number("camDogRight", "Kamera Hund: Lage rechts", "Feinschliff: Kamera-Rahmen", 4, -100, 100, "%"),
  number("camDogBottom", "Kamera Hund: Lage unten", "Feinschliff: Kamera-Rahmen", 8, -40, 40, "px"),
  number("camLabelLeft", "Kamera Schild: Lage links", "Feinschliff: Kamera-Rahmen", 50, -150, 150, "%"),
  number("camLabelBottom", "Kamera Schild: Lage unten", "Feinschliff: Kamera-Rahmen", 8, -40, 40, "px"),
  number("camLabelBottom2", "Kamera Schild: Lage unten (2)", "Feinschliff: Kamera-Rahmen", 5, -40, 40, "px"),
  number("camLabelTransform", "Kamera Schild: Verformung Verschiebung x", "Feinschliff: Kamera-Rahmen", -50, -150, 150, "%"),
] as const satisfies readonly SettingField[];
