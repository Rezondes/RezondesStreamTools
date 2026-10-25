// Fine-tuning fields of the Kebab theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerRed", "Linien: Farbe", "Stinger", ""), "red"),
  inherits(color("stingerRedText", "Schrift rot: Farbe", "Stinger", ""), "redText"),
  inherits(color("stingerPaper", "Papier: Farbe", "Stinger", ""), "paper"),
  inherits(color("stingerBrown", "Dunkel: Farbe", "Stinger", ""), "brown"),
  inherits(font("stingerFont", "Titel: Schrift", "Stinger", "", ["Titan One", "Baloo 2", "Fredoka"]), "titleFont"),
] as const satisfies readonly SettingField[];
