// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxItemGap", "Effekt: Abstand", "Feinschliff: Effekte", 12, 0, 48, "px"),
  number("fxItemTransform", "Effekt: Verformung Verschiebung x", "Feinschliff: Effekte", -50, -150, 150, "%"),
  number("fxItemTransform2", "Effekt: Verformung Verschiebung y", "Feinschliff: Effekte", -50, -150, 150, "%"),
  number("fxItemAnimation", "Effekt: Animation Dauer (Teil 1) Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemAnimation2", "Effekt: Animation Dauer (Teil 2) Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemAnimation3", "Effekt: Animation Dauer (Teil 2) Anteil von „Ein- und Ausblenden“ (%) (2)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemImgBorderRadius", "Effekt Bild: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  inherits(color("fxItemImgBorder", "Effekt Bild: Rand Farbe (Kontur)", "Feinschliff: Effekte", ""), "outline"),
  number("fxItemImgBorder2", "Effekt Bild: Rand Stärke", "Feinschliff: Effekte", 5, 0, 40, "px"),
  number("fxItemVideoBorderRadius", "Effekt Video: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  inherits(color("fxItemVideoBorder", "Effekt Video: Rand Farbe (Kontur)", "Feinschliff: Effekte", ""), "outline"),
  number("fxItemVideoBorder2", "Effekt Video: Rand Stärke", "Feinschliff: Effekte", 5, 0, 40, "px"),
  number("fxItemCanvasBorderRadius", "Effekt Grafik: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  inherits(color("fxItemCanvasBorder", "Effekt Grafik: Rand Farbe (Kontur)", "Feinschliff: Effekte", ""), "outline"),
  number("fxItemCanvasBorder2", "Effekt Grafik: Rand Stärke", "Feinschliff: Effekte", 5, 0, 40, "px"),
  number("fxBearHeight", "Effekt Bär: Höhe Anteil von „Bär: Grösse (Höhe)“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxBearPartSignTextFontSize", "Effekt Bär Schild Text: Schriftgrösse", "Feinschliff: Effekte", 18, 0, 72, "px"),
  inherits(color("fxBearPartSignTextColor", "Effekt Bär Schild Text: Textfarbe", "Feinschliff: Effekte", ""), ""),
  number("fxTalkGap", "Effekt Sprechblase: Abstand", "Feinschliff: Effekte", 8, 0, 40, "px"),
  number("fxTextFontWeight", "Effekt Text: Schriftstärke", "Feinschliff: Effekte", 800, 100, 900, undefined, 100),
  number("fxTextMarginBottom", "Effekt Text: Abstand unten", "Feinschliff: Effekte", 0.55, -2.2, 2.2, undefined, 0.01),
  number("fxTextBorderRadius", "Effekt Text: Eckenradius oben Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextBorderRadius2", "Effekt Text: Eckenradius rechts Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextBorderRadius3", "Effekt Text: Eckenradius links Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextBorderRadius4", "Effekt Text: Eckenradius unten", "Feinschliff: Effekte", 4, 0, 40, "px"),
  inherits(color("fxTextColor", "Effekt Text: Textfarbe", "Feinschliff: Effekte", ""), "textDark"),
  inherits(font("fxTextFont", "Effekt Text: Schrift", "Feinschliff: Effekte", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
