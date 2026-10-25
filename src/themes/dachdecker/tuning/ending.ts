// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Ending" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ENDING_TUNING = [
  number("endingCenterTop", "Ending Mitte: Lage oben", "Feinschliff: Ending", 800, -3200, 3200, "px"),
  number("endingTitleFontSize", "Ending Titel: Schriftgrösse", "Feinschliff: Ending", 1.33, 0, 5.32, undefined, 0.01),
  number("endingTitleLetterSpacing", "Ending Titel: Zeichenabstand", "Feinschliff: Ending", 14, -56, 56, "px"),
  inherits(color("endingTitleColor", "Ending Titel: Textfarbe", "Feinschliff: Ending", ""), "accent"),
  inherits(color("endingTitleTextShadow", "Ending Titel: Textschatten Farbe (Signatur Terrakotta)", "Feinschliff: Ending", ""), "accent"),
  inherits(color("endingTitleTextShadow2", "Ending Titel: Textschatten Farbe (Ziegelrot (Flächen und Leuchten))", "Feinschliff: Ending", ""), "brick"),
  number("endingTitleTextShadow3", "Ending Titel: Textschatten Unschärfe (Teil 1) Anteil von „Text-Leuchten (0 = aus)“ (%)", "Feinschliff: Ending", 100, 0, 400),
  number("endingTitleTextShadow4", "Ending Titel: Textschatten Unschärfe (Teil 2) Anteil von „Text-Leuchten (0 = aus)“ (%)", "Feinschliff: Ending", 100, 0, 400),
  number("endingTitleTextShadow5", "Ending Titel: Textschatten Unschärfe (Teil 1)", "Feinschliff: Ending", 12, 0, 48, "px"),
  number("endingTitleTextShadow6", "Ending Titel: Textschatten Farbanteil", "Feinschliff: Ending", 85, 0, 100, "%"),
  number("endingTitleTextShadow7", "Ending Titel: Textschatten Unschärfe (Teil 2)", "Feinschliff: Ending", 40, 0, 160, "px"),
  number("endingTitleTextShadow8", "Ending Titel: Textschatten Farbanteil (2)", "Feinschliff: Ending", 45, 0, 100, "%"),
  inherits(font("endingTitleFont", "Ending Titel: Schrift", "Feinschliff: Ending", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  inherits(color("endingSubtitleColor", "Ending Untertitel: Textfarbe", "Feinschliff: Ending", ""), "line"),
  number("endingBigMarginTop", "Ending gross: Abstand oben", "Feinschliff: Ending", 10, -40, 40, "px"),
  number("endingBigFontSize", "Ending gross: Schriftgrösse", "Feinschliff: Ending", 26, 0, 104, "px"),
  number("endingBigLetterSpacing", "Ending gross: Zeichenabstand", "Feinschliff: Ending", 6, -40, 40, "px"),
  inherits(font("endingBigFont", "Ending gross: Schrift", "Feinschliff: Ending", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  number("lightDuskSky", "Licht Ending: Himmel", "Feinschliff: Ending", 1.1, 0, 10, undefined, 0.05),
  number("lightDuskMain", "Licht Ending: Sonne", "Feinschliff: Ending", 1.6, 0, 10, undefined, 0.05),
  number("lightDuskFill", "Licht Ending: Aufhellung", "Feinschliff: Ending", 0.8, 0, 10, undefined, 0.05),
  number("duskGround", "Licht Ending: Boden (Anteil des Abendglühens)", "Feinschliff: Ending", 0.3, 0, 1, undefined, 0.01),
  number("sunWhite", "Licht Ending: Sonne weiss (Anteil)", "Feinschliff: Ending", 0.45, 0, 1, undefined, 0.01),
  number("wreathWaveSpeed", "Richtkranz: Wehen Tempo", "Feinschliff: Ending", 3.2, 0, 20, undefined, 0.1),
  number("wreathWaveAlong", "Richtkranz: Wellen entlang des Bands", "Feinschliff: Ending", 3, 0, 20, undefined, 0.1),
  number("wreathWaveSway", "Richtkranz: Bänder schwingen", "Feinschliff: Ending", 0.18, 0, 2, undefined, 0.01),
  number("wreathWaveLean", "Richtkranz: Bänder neigen sich", "Feinschliff: Ending", 0.25, 0, 2, undefined, 0.01),
  number("fireworksSparkSize", "Feuerwerk: Funkengrösse", "Feinschliff: Ending", 0.13, 0, 2, undefined, 0.01),
] as const satisfies readonly SettingField[];
