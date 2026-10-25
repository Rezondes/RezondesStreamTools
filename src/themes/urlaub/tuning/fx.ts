// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
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
  number("fxItemVideoBorderRadius", "Effekt Video: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemCanvasBorderRadius", "Effekt Grafik: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextFontWeight", "Effekt Text: Schriftstärke", "Feinschliff: Effekte", 700, 100, 900, undefined, 100),
  inherits(color("fxTextTextShadow", "Effekt Text: Textschatten Farbe (Meer tief)", "Feinschliff: Effekte", ""), "seaDeep"),
  number("fxTextTextShadow2", "Effekt Text: Textschatten y", "Feinschliff: Effekte", 3, -40, 40, "px"),
  inherits(font("fxTextFont", "Effekt Text: Schrift", "Feinschliff: Effekte", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), ""),
  number("fxTextBubblePadding", "Effekt Text Blase: Innenabstand oben/unten", "Feinschliff: Effekte", 12, 0, 48, "px"),
  number("fxTextBubblePadding2", "Effekt Text Blase: Innenabstand links/rechts", "Feinschliff: Effekte", 24, 0, 96, "px"),
  number("fxTextBubbleBorderRadius", "Effekt Text Blase: Eckenradius", "Feinschliff: Effekte", 26, 0, 104, "px"),
  inherits(color("fxTextBubbleBackground", "Effekt Text Blase: Hintergrund Farbe (Gischt)", "Feinschliff: Effekte", ""), "foam"),
  inherits(color("fxTextBubbleColor", "Effekt Text Blase: Textfarbe", "Feinschliff: Effekte", ""), "textOnWood"),
  number("fxTextBubbleBoxShadow", "Effekt Text Blase: Schatten y", "Feinschliff: Effekte", 10, -40, 40, "px"),
  number("fxTextBubbleBoxShadow2", "Effekt Text Blase: Schatten Unschärfe", "Feinschliff: Effekte", 24, 0, 96, "px"),
] as const satisfies readonly SettingField[];
