// Fine-tuning fields of the Kebab theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  inherits(font("fxTextFont", "Effekte Text: Schrift", "Feinschliff: Effekte", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
  number("fxTextFontWeight", "Effekte Text: Schriftstärke", "Feinschliff: Effekte", 400, 100, 900, undefined, 100),
  inherits(color("fxTextColor", "Effekte Text: Textfarbe", "Feinschliff: Effekte", ""), "paper"),
  inherits(color("fxTextWebkitTextStroke", "Effekte Text: Textkontur Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Effekte", ""), "red"),
  number("fxTextWebkitTextStroke2", "Effekte Text: Textkontur Wert 1", "Feinschliff: Effekte", 4, 0, 40, "px"),
] as const satisfies readonly SettingField[];
