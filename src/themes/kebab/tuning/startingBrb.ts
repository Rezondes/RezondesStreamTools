// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  number("tickerRunFontWeight", "Lauftext Lauf: Schriftstärke", "Feinschliff: Starting, BRB", 900, 100, 900, undefined, 100),
  number("tickerRunFontSize", "Lauftext Lauf: Schriftgrösse", "Feinschliff: Starting, BRB", 30, 0, 120, "px"),
  number("tickerRunLineHeight", "Lauftext Lauf: Zeilenhöhe", "Feinschliff: Starting, BRB", 72, 0, 288, "px"),
  number("tickerRunLetterSpacing", "Lauftext Lauf: Zeichenabstand", "Feinschliff: Starting, BRB", 2, -40, 40, "px"),
  inherits(color("tickerRunColor", "Lauftext Lauf: Textfarbe", "Feinschliff: Starting, BRB", ""), ""),
  inherits(font("tickerRunFont", "Lauftext Lauf: Schrift", "Feinschliff: Starting, BRB", "", ["Nunito", "DM Sans", "Manrope"]), ""),
  number("tickerRunSpanPaddingRight", "Lauftext: Text: Innenabstand rechts", "Feinschliff: Starting, BRB", 48, 0, 192, "px"),
] as const satisfies readonly SettingField[];
