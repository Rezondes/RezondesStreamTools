// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Alerts, Kamera-Rahmen" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_CAM_TUNING = [
  number("dimensionSvgHeight", "Masslinie Grafik: Höhe", "Feinschliff: Alerts, Kamera-Rahmen", 24, 0, 96, "px"),
  inherits(color("dimensionLineStroke", "Masslinie Linie: Linienfarbe Farbe (Plan-Linien und Text)", "Feinschliff: Alerts, Kamera-Rahmen", ""), "line"),
  number("dimensionLineStrokeWidth", "Masslinie Linie: Linienstärke", "Feinschliff: Alerts, Kamera-Rahmen", 1.5, 0, 6, undefined, 0.01),
  number("dimensionHalfStrokeDasharray", "Masslinie Hälfte: Strichmuster", "Feinschliff: Alerts, Kamera-Rahmen", 1, 0, 4, undefined, 0.01),
  number("dimensionHalfStrokeDashoffset", "Masslinie Hälfte: Strichversatz", "Feinschliff: Alerts, Kamera-Rahmen", 1, 0, 4, undefined, 0.01),
  number("dimensionHalfAnimation", "Masslinie Hälfte: Animation Dauer", "Feinschliff: Alerts, Kamera-Rahmen", 550, 0, 2750, "ms", 10),
  number("dimensionTextMarginBottom", "Masslinie Text: Abstand unten", "Feinschliff: Alerts, Kamera-Rahmen", 2, -40, 40, "px"),
  number("dimensionTextFontSize", "Masslinie Text: Schriftgrösse", "Feinschliff: Alerts, Kamera-Rahmen", 16, 0, 64, "px"),
  number("dimensionTextFontWeight", "Masslinie Text: Schriftstärke", "Feinschliff: Alerts, Kamera-Rahmen", 700, 100, 900, undefined, 100),
  number("dimensionTextLetterSpacing", "Masslinie Text: Zeichenabstand", "Feinschliff: Alerts, Kamera-Rahmen", 3, -40, 40, "px"),
  inherits(color("dimensionTextColor", "Masslinie Text: Textfarbe", "Feinschliff: Alerts, Kamera-Rahmen", ""), "copper"),
  number("dimensionTextAnimation", "Masslinie Text: Animation Dauer", "Feinschliff: Alerts, Kamera-Rahmen", 550, 0, 2750, "ms", 10),
  inherits(font("dimensionTextFont", "Masslinie Text: Schrift", "Feinschliff: Alerts, Kamera-Rahmen", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
] as const satisfies readonly SettingField[];
