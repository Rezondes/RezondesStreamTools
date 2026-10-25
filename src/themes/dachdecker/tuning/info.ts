// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const INFO_TUNING = [
  number("infoMinHeight", "Befehlsseite: Mindesthöhe (vh)", "Feinschliff: Befehlsseite", 100, 0, 400, undefined, 0.01),
  inherits(color("infoBackground", "Befehlsseite: Hintergrund Farbe (Blaupause dunkel (Verlauf unten))", "Feinschliff: Befehlsseite", ""), "page"),
  number("infoPadding", "Befehlsseite: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 32, 0, 128, "px"),
  number("infoPadding2", "Befehlsseite: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 24, 0, 96, "px"),
  number("infoColumnGap", "Befehlsseite Spalte: Abstand", "Feinschliff: Befehlsseite", 18, 0, 72, "px"),
  number("infoTitleFontSize", "Befehlsseite Titel: Schriftgrösse", "Feinschliff: Befehlsseite", 1.6, 0, 6.4, undefined, 0.01),
  number("infoTitleLetterSpacing", "Befehlsseite Titel: Zeichenabstand", "Feinschliff: Befehlsseite", 6, -40, 40, "px"),
  inherits(color("infoTitleColor", "Befehlsseite Titel: Textfarbe", "Feinschliff: Befehlsseite", ""), "accent"),
  inherits(font("infoTitleFont", "Befehlsseite Titel: Schrift", "Feinschliff: Befehlsseite", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  inherits(color("infoIntroColor", "Befehlsseite Einleitung: Textfarbe", "Feinschliff: Befehlsseite", ""), "muted"),
  inherits(color("infoDetailColor", "Befehlsseite Detail: Textfarbe", "Feinschliff: Befehlsseite", ""), "muted"),
  number("infoHeadingMargin", "Befehlsseite Überschrift: Aussenabstand unten", "Feinschliff: Befehlsseite", 12, -48, 48, "px"),
  number("infoHeadingFontSize", "Befehlsseite Überschrift: Schriftgrösse", "Feinschliff: Befehlsseite", 20, 0, 80, "px"),
  number("infoHeadingLetterSpacing", "Befehlsseite Überschrift: Zeichenabstand", "Feinschliff: Befehlsseite", 6, -40, 40, "px"),
  inherits(color("infoHeadingColor", "Befehlsseite Überschrift: Textfarbe", "Feinschliff: Befehlsseite", ""), "copper"),
  inherits(font("infoHeadingFont", "Befehlsseite Überschrift: Schrift", "Feinschliff: Befehlsseite", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), ""),
  number("infoEntryPadding", "Befehlsseite Eintrag: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 8, 0, 40, "px"),
  inherits(color("infoEntryBorderTop", "Befehlsseite Eintrag: Rand oben Farbe (Plan-Linien und Text)", "Feinschliff: Befehlsseite", ""), "line"),
  number("infoEntryBorderTop2", "Befehlsseite Eintrag: Rand oben Stärke", "Feinschliff: Befehlsseite", 1, 0, 40, "px"),
  number("infoEntryBorderTop3", "Befehlsseite Eintrag: Rand oben Farbanteil", "Feinschliff: Befehlsseite", 35, 0, 100, "%"),
  number("infoTextMargin", "Befehlsseite Text: Aussenabstand oben", "Feinschliff: Befehlsseite", 4, -40, 40, "px"),
] as const satisfies readonly SettingField[];
