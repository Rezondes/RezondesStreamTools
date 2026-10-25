// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: BRB" (tuning.ts puts the groups together).
import { font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_TUNING = [
  number("brbCenterTop", "BRB Mitte: Lage oben", "Feinschliff: BRB", 780, -3120, 3120, "px"),
  number("brbBigMarginTop", "BRB gross: Abstand oben", "Feinschliff: BRB", 18, -72, 72, "px"),
  number("brbBigFontSize", "BRB gross: Schriftgrösse", "Feinschliff: BRB", 0.62, 0, 2.48, undefined, 0.01),
  inherits(font("brbBigFont", "BRB gross: Schrift", "Feinschliff: BRB", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  number("lightRainSky", "Licht BRB: Himmel", "Feinschliff: BRB", 1.1, 0, 10, undefined, 0.05),
  number("lightRainMain", "Licht BRB: Mondlicht", "Feinschliff: BRB", 1.4, 0, 10, undefined, 0.05),
  number("rainGround", "Licht BRB: Boden (Anteil der Seite)", "Feinschliff: BRB", 0.6, 0, 1, undefined, 0.01),
  number("moonWhite", "Licht BRB: Mond weiss (Anteil)", "Feinschliff: BRB", 0.5, 0, 1, undefined, 0.01),
  number("lightningFlash", "Blitz: Lichtstärke", "Feinschliff: BRB", 2.2, 0, 10, undefined, 0.05),
  number("lightningSkyFlash", "Blitz: Himmel hellt auf (Anteil)", "Feinschliff: BRB", 0.12, 0, 1, undefined, 0.01),
  number("splashSize", "Spritzer: Grösse", "Feinschliff: BRB", 0.06, 0, 1, undefined, 0.01),
  number("splashOpacity", "Spritzer: Deckkraft", "Feinschliff: BRB", 0.95, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
