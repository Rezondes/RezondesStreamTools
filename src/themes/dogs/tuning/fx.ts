// Fine-tuning fields of the Dogs theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxTextFontWeight", "Effekte Text: Schriftstärke", "Feinschliff: Effekte", 700, 100, 900, undefined, 100),
  inherits(color("fxTextColor", "Effekte Text: Textfarbe", "Feinschliff: Effekte", ""), "cream"),
  inherits(color("fxTextTextShadow", "Effekte Text: Textschatten Farbe (Tinte (Kontur))", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow2", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (2)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow3", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (3)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow4", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (4)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow5", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (5)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow6", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (6)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow7", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (7)", "Feinschliff: Effekte", ""), "ink"),
  inherits(color("fxTextTextShadow8", "Effekte Text: Textschatten Farbe (Tinte (Kontur)) (8)", "Feinschliff: Effekte", ""), "ink"),
  number("fxTextTextShadow9", "Effekte Text: Textschatten y (Teil 9)", "Feinschliff: Effekte", 3, -12, 12),
  inherits(font("fxTextFont", "Effekte Text: Schrift", "Feinschliff: Effekte", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
