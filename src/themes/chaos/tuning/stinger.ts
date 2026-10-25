// Fine-tuning fields of the Chaos theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerAccent", "Magenta: Farbe", "Stinger", ""), "accent"),
  inherits(color("stingerAccent2", "Cyan: Farbe", "Stinger", ""), "accent2"),
  inherits(color("stingerAccentText", "Titel: Farbe", "Stinger", ""), "accentText"),
  inherits(color("stingerTextColor", "Weisse Striche: Farbe", "Stinger", ""), "textColor"),
  inherits(font("stingerFont", "Titel: Schrift", "Stinger", "", ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"]), "titleFont"),
] as const satisfies readonly SettingField[];
