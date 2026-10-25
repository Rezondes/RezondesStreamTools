// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const INFO_TUNING = [
  inherits(color("themeRootBackground", "Befehlsseite (Seite): Hintergrund Farbe (Wiese)", "Feinschliff: Befehlsseite", ""), "meadow"),
  number("infoPadding", "Befehlsseite: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 48, 0, 192, "px"),
  number("infoPadding2", "Befehlsseite: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 16, 0, 64, "px"),
  number("infoColumnMaxWidth", "Befehlsseite Spalte: Höchstbreite", "Feinschliff: Befehlsseite", 860, 0, 3440, "px"),
  number("infoColumnGap", "Befehlsseite Spalte: Abstand", "Feinschliff: Befehlsseite", 28, 0, 112, "px"),
  number("infoHeadGap", "Befehlsseite Kopfzeile: Abstand", "Feinschliff: Befehlsseite", 4, 0, 40, "px"),
  number("infoBearHeight", "Befehlsseite Bär: Höhe (Wert 1)", "Feinschliff: Befehlsseite", 220, 0, 880, "px"),
  number("infoBearHeight2", "Befehlsseite Bär: Höhe (Wert 2) (vw)", "Feinschliff: Befehlsseite", 40, 0, 160, undefined, 0.01),
  number("infoBearMarginRight", "Befehlsseite Bär: Abstand rechts", "Feinschliff: Befehlsseite", 30, -120, 120, "px"),
  number("infoSignTitleFontSize", "Befehlsseite Schild Titel: Schriftgrösse (Wert 1)", "Feinschliff: Befehlsseite", 56, 0, 224, "px"),
  number("infoSignTitleFontSize2", "Befehlsseite Schild Titel: Schriftgrösse (Wert 2) (vw)", "Feinschliff: Befehlsseite", 9, 0, 36, undefined, 0.01),
  number("infoBoardGap", "Befehlsseite Tafel: Abstand", "Feinschliff: Befehlsseite", 14, 0, 56, "px"),
  number("infoBoardEyebrowFontSize", "Befehlsseite Tafel Überzeile: Schriftgrösse", "Feinschliff: Befehlsseite", 22, 0, 88, "px"),
  inherits(font("infoBoardEyebrowFont", "Befehlsseite Tafel Überzeile: Schrift", "Feinschliff: Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
  number("infoEntryGap", "Befehlsseite Eintrag: Abstand", "Feinschliff: Befehlsseite", 4, 0, 40, "px"),
  number("infoEntryPaddingTop", "Befehlsseite Eintrag: Innenabstand oben", "Feinschliff: Befehlsseite", 10, 0, 40, "px"),
  inherits(color("infoEntryBorderTop", "Befehlsseite Eintrag: Rand oben Farbe (Papier: Schattenton)", "Feinschliff: Befehlsseite", ""), "paperShade"),
  number("infoEntryBorderTop2", "Befehlsseite Eintrag: Rand oben Stärke", "Feinschliff: Befehlsseite", 3, 0, 40, "px"),
  inherits(color("infoCommandColor", "Befehlsseite Befehl: Textfarbe", "Feinschliff: Befehlsseite", ""), "accentText"),
  number("infoCommandFontSize", "Befehlsseite Befehl: Schriftgrösse (em)", "Feinschliff: Befehlsseite", 1.1, 0, 4.4, undefined, 0.01),
  inherits(font("infoCommandFont", "Befehlsseite Befehl: Schrift", "Feinschliff: Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
  inherits(color("infoDetailColor", "Befehlsseite Detail: Textfarbe", "Feinschliff: Befehlsseite", ""), "textDim"),
  number("infoDetailFontSize", "Befehlsseite Detail: Schriftgrösse (em)", "Feinschliff: Befehlsseite", 0.9, 0, 3.6, undefined, 0.01),
  inherits(font("infoDetailFont", "Befehlsseite Detail: Schrift", "Feinschliff: Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
