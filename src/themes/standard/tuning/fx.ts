// Fine-tuning fields of the Standard theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxItemGap", "Effekt: Abstand", "Feinschliff: Effekte", 12, 0, 48, "px"),
  number("fxItemAnimation", "Effekt: Animation Dauer Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemAnimation2", "Effekt: Animation Verzögerung Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemImgBorderRadius", "Effekt-Bild: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemVideoBorderRadius", "Effekt-Video: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxItemCanvasBorderRadius", "Effekt-Grafik: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextPadding", "Effekt-Text: Innenabstand oben/unten", "Feinschliff: Effekte", 10, 0, 40, "px"),
  number("fxTextPadding2", "Effekt-Text: Innenabstand links/rechts", "Feinschliff: Effekte", 20, 0, 80, "px"),
  number("fxTextFontWeight", "Effekt-Text: Schriftstärke", "Feinschliff: Effekte", 700, 100, 900, undefined, 100),
  inherits(color("fxTextColor", "Effekt-Text: Textfarbe", "Feinschliff: Effekte", ""), "textColor"),
  inherits(font("fxTextFont", "Effekt-Text: Schrift", "Feinschliff: Effekte", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("fxFromScale", "Effekt-Einflug: startet mit Grösse", "Feinschliff: Effekte", 0.85, 0, 2, undefined, 0.01),
  number("fxEnterTime", "Effekt-Einflug: Dauer", "Feinschliff: Effekte", 0.45, 0, 10, "s", 0.05),
  number("fxOvershoot", "Effekt-Einflug: federt nach (Stärke)", "Feinschliff: Effekte", 1.7, 0, 5, undefined, 0.1),
] as const satisfies readonly SettingField[];
