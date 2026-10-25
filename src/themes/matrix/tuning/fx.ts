// Fine-tuning fields of the Matrix theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxItemTransform", "Effekt: Verformung Verschiebung x", "Feinschliff: Effekte", -50, -150, 150, "%"),
  number("fxItemTransform2", "Effekt: Verformung Verschiebung y", "Feinschliff: Effekte", -50, -150, 150, "%"),
  number("fxItemAnimation", "Effekt: Animation Verzögerung (Teil 1) Anteil von „Glitch rein (Dauer)“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemAnimation2", "Effekt: Animation Verzögerung (Teil 2) Anteil von „Glitch raus (Dauer)“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemAnimation3", "Effekt: Animation Verzögerung (Teil 2) Anteil von „Glitch raus (Dauer)“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  inherits(color("fxItemImgFilter", "Effekt Bild: Filter Farbe (Glühfarbe)", "Feinschliff: Effekte", ""), "glow"),
  number("fxItemImgFilter2", "Effekt Bild: Filter Schlagschatten", "Feinschliff: Effekte", 14, 0, 56, "px"),
  number("fxItemImgFilter3", "Effekt Bild: Filter Farbanteil", "Feinschliff: Effekte", 55, 0, 100, "%"),
  inherits(color("fxItemVideoFilter", "Effekt Video: Filter Farbe (Glühfarbe)", "Feinschliff: Effekte", ""), "glow"),
  number("fxItemVideoFilter2", "Effekt Video: Filter Schlagschatten", "Feinschliff: Effekte", 14, 0, 56, "px"),
  number("fxItemVideoFilter3", "Effekt Video: Filter Farbanteil", "Feinschliff: Effekte", 55, 0, 100, "%"),
  inherits(color("fxItemCanvasFilter", "Effekt Grafik: Filter Farbe (Glühfarbe)", "Feinschliff: Effekte", ""), "glow"),
  number("fxItemCanvasFilter2", "Effekt Grafik: Filter Schlagschatten", "Feinschliff: Effekte", 14, 0, 56, "px"),
  number("fxItemCanvasFilter3", "Effekt Grafik: Filter Farbanteil", "Feinschliff: Effekte", 55, 0, 100, "%"),
  number("fxTextMarginTop", "Effekt Text: Abstand oben", "Feinschliff: Effekte", 8, -40, 40, "px"),
  inherits(color("fxTextColor", "Effekt Text: Textfarbe", "Feinschliff: Effekte", ""), "accent"),
  inherits(font("fxTextFont", "Effekt Text: Schrift", "Feinschliff: Effekte", "", ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"]), "font"),
] as const satisfies readonly SettingField[];
