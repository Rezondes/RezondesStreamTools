// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
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
  inherits(font("fxTextFont", "Effekt Text: Schrift", "Feinschliff: Effekte", "", ["Black Ops One", "Stardos Stencil", "Share Tech Mono", "Inter"]), "titleFont"),
  inherits(color("fxTextTextShadow", "Effekt Text: Textschatten Farbe (Oliv dunkel)", "Feinschliff: Effekte", ""), "oliveDark"),
  number("fxTextTextShadow2", "Effekt Text: Textschatten y", "Feinschliff: Effekte", 3, -40, 40, "px"),
  number("fxTextSlipPadding", "Effekt-Text als Zettel: Innenabstand oben/unten", "Feinschliff: Effekte", 10, 0, 40, "px"),
  number("fxTextSlipPadding2", "Effekt-Text als Zettel: Innenabstand links/rechts", "Feinschliff: Effekte", 22, 0, 88, "px"),
  inherits(color("fxTextSlipBackground", "Effekt-Text als Zettel: Hintergrund Farbe (Papier (Karten, Berichte))", "Feinschliff: Effekte", ""), "paper"),
  inherits(color("fxTextSlipColor", "Effekt-Text als Zettel: Textfarbe", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextSlipBorderLeft", "Effekt-Text als Zettel: Rand links Farbe (Akzent (Signal-Orange))", "Feinschliff: Effekte", ""), "accent"),
  number("fxTextSlipBorderLeft2", "Effekt-Text als Zettel: Rand links Stärke", "Feinschliff: Effekte", 10, 0, 40, "px"),
  number("fxTextSlipBoxShadow", "Effekt-Text als Zettel: Schatten y", "Feinschliff: Effekte", 8, -40, 40, "px"),
  number("fxTextSlipBoxShadow2", "Effekt-Text als Zettel: Schatten Unschärfe", "Feinschliff: Effekte", 20, 0, 80, "px"),
  number("fxTextSlipRotate", "Effekt-Text als Zettel: Drehung (Grad)", "Feinschliff: Effekte", -1.5, -360, 360, undefined, 0.5),
  number("fxSlipDrop", "Zettel: fällt ein aus", "Feinschliff: Effekte", -80, -600, 600, "px"),
  number("fxSlipTurn", "Zettel: startet gedreht (Grad)", "Feinschliff: Effekte", -8, -360, 360),
  number("fxSlipLength", "Zettel: fällt ein in", "Feinschliff: Effekte", 0.55, 0, 10, "s", 0.05),
] as const satisfies readonly SettingField[];
