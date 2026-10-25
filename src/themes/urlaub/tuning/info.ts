// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const INFO_TUNING = [
  inherits(color("themeRootBackground", "Befehlsseite (Seite): Hintergrund Farbe (Meer tief)", "Feinschliff: Befehlsseite", ""), "seaDeep"),
  number("infoPadding", "Befehlsseite: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 48, 0, 192, "px"),
  number("infoPadding2", "Befehlsseite: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 16, 0, 64, "px"),
  number("infoColumnMaxWidth", "Befehlsseite Spalte: Höchstbreite", "Feinschliff: Befehlsseite", 860, 0, 3440, "px"),
  number("infoColumnGap", "Befehlsseite Spalte: Abstand", "Feinschliff: Befehlsseite", 28, 0, 112, "px"),
  number("infoSignPadding", "Befehlsseite Schild: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 28, 0, 112, "px"),
  number("infoSignPadding2", "Befehlsseite Schild: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 32, 0, 128, "px"),
  number("infoSignGap", "Befehlsseite Schild: Abstand", "Feinschliff: Befehlsseite", 8, 0, 40, "px"),
  number("infoSignTitleFontSize", "Befehlsseite: Titel: Schriftgrösse (Wert 1) Anteil von „Titelgrösse“ (%)", "Feinschliff: Befehlsseite", 100, 0, 400),
  number("infoSignTitleFontSize2", "Befehlsseite: Titel: Schriftgrösse (Wert 2) (vw)", "Feinschliff: Befehlsseite", 11, 0, 44, undefined, 0.01),
  number("infoBoardPadding", "Befehlsseite Tafel: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 28, 0, 112, "px"),
  number("infoBoardPadding2", "Befehlsseite Tafel: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 32, 0, 128, "px"),
  number("infoBoardGap", "Befehlsseite Tafel: Abstand", "Feinschliff: Befehlsseite", 16, 0, 64, "px"),
  number("infoEntryGap", "Befehlsseite Eintrag: Abstand", "Feinschliff: Befehlsseite", 2, 0, 40, "px"),
  number("infoEntryPaddingLeft", "Befehlsseite Eintrag: Innenabstand links", "Feinschliff: Befehlsseite", 14, 0, 56, "px"),
  inherits(color("infoEntryBorderLeft", "Befehlsseite Eintrag: Rand links Farbe (Holz dunkel (Maserung, Rand))", "Feinschliff: Befehlsseite", ""), "woodDark"),
  number("infoEntryBorderLeft2", "Befehlsseite Eintrag: Rand links Stärke", "Feinschliff: Befehlsseite", 4, 0, 40, "px"),
  inherits(color("infoCommandColor", "Befehlsseite Befehl: Textfarbe", "Feinschliff: Befehlsseite", ""), "accent"),
  number("infoCommandFontSize", "Befehlsseite Befehl: Schriftgrösse (em)", "Feinschliff: Befehlsseite", 1.2, 0, 4.8, undefined, 0.01),
  inherits(font("infoCommandFont", "Befehlsseite Befehl: Schrift", "Feinschliff: Befehlsseite", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), ""),
  number("infoDetailOpacity", "Befehlsseite Detail: Deckkraft", "Feinschliff: Befehlsseite", 0.8, 0, 1, undefined, 0.01),
  number("infoDetailFontSize", "Befehlsseite Detail: Schriftgrösse (em)", "Feinschliff: Befehlsseite", 0.9, 0, 3.6, undefined, 0.01),
  inherits(color("infoDetailColor", "Befehlsseite Detail: Textfarbe", "Feinschliff: Befehlsseite", ""), ""),
  inherits(font("infoDetailFont", "Befehlsseite Detail: Schrift", "Feinschliff: Befehlsseite", "", ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
