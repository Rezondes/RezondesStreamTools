// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Starting, BRB" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_TUNING = [
  number("sayingLeft", "Spruch: Lage links", "Feinschliff: Starting, BRB", 80, -320, 320, "px"),
  number("sayingTop", "Spruch: Lage oben", "Feinschliff: Starting, BRB", 112, -448, 448, "px"),
  number("sayingFontSize", "Spruch: Schriftgrösse", "Feinschliff: Starting, BRB", 0.75, 0, 3, undefined, 0.01),
  number("sayingFontWeight", "Spruch: Schriftstärke", "Feinschliff: Starting, BRB", 500, 100, 900, undefined, 100),
  inherits(color("sayingColor", "Spruch: Textfarbe", "Feinschliff: Starting, BRB", ""), "muted"),
  number("sayingAnimation", "Spruch: Animation Dauer", "Feinschliff: Starting, BRB", 600, 0, 3000, "ms", 10),
  inherits(font("sayingFont", "Spruch: Schrift", "Feinschliff: Starting, BRB", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
] as const satisfies readonly SettingField[];
