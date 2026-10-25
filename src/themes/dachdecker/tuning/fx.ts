// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxTextFontWeight", "Effekte Text: Schriftstärke", "Feinschliff: Effekte", 700, 100, 900, undefined, 100),
  number("fxTextLetterSpacing", "Effekte Text: Zeichenabstand", "Feinschliff: Effekte", 10, -40, 40, "px"),
  inherits(color("fxTextTextShadow", "Effekte Text: Textschatten Farbe (Plan-Linien und Text)", "Feinschliff: Effekte", ""), "line"),
  number("fxTextTextShadow2", "Effekte Text: Textschatten Unschärfe Anteil von „Text-Leuchten (0 = aus)“ (%)", "Feinschliff: Effekte", 100, 0, 400),
  number("fxTextTextShadow3", "Effekte Text: Textschatten Unschärfe", "Feinschliff: Effekte", 14, 0, 56, "px"),
  number("fxTextTextShadow4", "Effekte Text: Textschatten Farbanteil", "Feinschliff: Effekte", 35, 0, 100, "%"),
  inherits(color("fxTextColor", "Effekte Text: Textfarbe", "Feinschliff: Effekte", ""), ""),
  inherits(font("fxTextFont", "Effekte Text: Schrift", "Feinschliff: Effekte", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
] as const satisfies readonly SettingField[];
