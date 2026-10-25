// Fine-tuning fields of the Dogs theme, group "Feinschliff: Starting, BRB, Musik" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_MUSIC_TUNING = [
  number("captionFontSize", "Unterschrift: Schriftgrösse", "Feinschliff: Starting, BRB, Musik", 0.85, 0, 3.4, undefined, 0.01),
  number("captionFontWeight", "Unterschrift: Schriftstärke", "Feinschliff: Starting, BRB, Musik", 600, 100, 900, undefined, 100),
  number("captionLetterSpacing", "Unterschrift: Zeichenabstand", "Feinschliff: Starting, BRB, Musik", 3, -40, 40, "px"),
  inherits(color("captionColor", "Unterschrift: Textfarbe", "Feinschliff: Starting, BRB, Musik", ""), "muted"),
  inherits(font("captionFont", "Unterschrift: Schrift", "Feinschliff: Starting, BRB, Musik", "", ["Pixelify Sans", "VT323", "Silkscreen"]), ""),
] as const satisfies readonly SettingField[];
