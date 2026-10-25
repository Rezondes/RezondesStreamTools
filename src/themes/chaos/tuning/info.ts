// Fine-tuning fields of the Chaos theme, group "Feinschliff: Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const INFO_TUNING = [
  number("themeRootMinHeight", "Befehlsseite (Seite): Mindesthöhe (vh)", "Feinschliff: Befehlsseite", 100, 0, 400, undefined, 0.01),
  inherits(color("themeRootBackground", "Befehlsseite (Seite): Hintergrund Farbe (Grund (Wand aussen))", "Feinschliff: Befehlsseite", ""), "ground"),
  number("infoColumnGap", "Befehlsseite Spalte: Abstand", "Feinschliff: Befehlsseite", 34, 0, 136, "px"),
  number("infoColumnWidth", "Befehlsseite Spalte: Breite (Wert 2) (vw)", "Feinschliff: Befehlsseite", 100, 0, 400, undefined, 0.01),
  number("infoColumnWidth2", "Befehlsseite Spalte: Breite (Wert 2) (2)", "Feinschliff: Befehlsseite", 2, 0, 10),
  number("infoColumnWidth3", "Befehlsseite Spalte: Breite (Wert 2) (3)", "Feinschliff: Befehlsseite", 24, 0, 96, "px"),
  number("infoColumnPadding", "Befehlsseite Spalte: Innenabstand oben", "Feinschliff: Befehlsseite", 60, 0, 240, "px"),
  number("infoColumnPadding2", "Befehlsseite Spalte: Innenabstand unten", "Feinschliff: Befehlsseite", 80, 0, 320, "px"),
  number("infoTitleTitleFontSize", "Befehlsseite: Titel: Schriftgrösse", "Feinschliff: Befehlsseite", 0.6, 0, 2.4, undefined, 0.01),
  number("infoEntryGap", "Befehlsseite Eintrag: Abstand", "Feinschliff: Befehlsseite", 6, 0, 40, "px"),
  number("infoEntryMarginTop", "Befehlsseite Eintrag: Abstand oben", "Feinschliff: Befehlsseite", 16, -64, 64, "px"),
] as const satisfies readonly SettingField[];
