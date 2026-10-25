// Fine-tuning fields of the Standard theme, group "Feinschliff: Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const INFO_TUNING = [
  number("infoPadding", "Befehlsseite: Innenabstand oben/unten", "Feinschliff: Befehlsseite", 48, 0, 192, "px"),
  number("infoPadding2", "Befehlsseite: Innenabstand links/rechts", "Feinschliff: Befehlsseite", 16, 0, 64, "px"),
  number("infoColumnGap", "Befehlsseite: Spalte: Abstand", "Feinschliff: Befehlsseite", 24, 0, 96, "px"),
  number("infoTitleFontSize", "Befehlsseite: Titel: Schriftgrösse (Wert 1) (em)", "Feinschliff: Befehlsseite", 2.4, 0, 9.6, undefined, 0.01),
  number("infoTitleFontSize2", "Befehlsseite: Titel: Schriftgrösse (Wert 2) (vw)", "Feinschliff: Befehlsseite", 9, 0, 36, undefined, 0.01),
  number("infoTitleFontWeight", "Befehlsseite: Titel: Schriftstärke", "Feinschliff: Befehlsseite", 800, 100, 900, undefined, 100),
  inherits(color("infoTitleBackground", "Befehlsseite: Titel: Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Befehlsseite", ""), "accent"),
  inherits(color("infoTitleBackground2", "Befehlsseite: Titel: Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Befehlsseite", ""), "accent2"),
  number("infoTitleBackground3", "Befehlsseite: Titel: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Befehlsseite", 135, -360, 360),
  inherits(font("infoTitleFont", "Befehlsseite: Titel: Schrift", "Feinschliff: Befehlsseite", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("infoCardGap", "Befehlsseite: Karte: Abstand", "Feinschliff: Befehlsseite", 16, 0, 64, "px"),
  number("infoCardPadding", "Befehlsseite: Karte: Innenabstand", "Feinschliff: Befehlsseite", 24, 0, 96, "px"),
  number("infoEntryGap", "Befehlsseite: Eintrag: Abstand", "Feinschliff: Befehlsseite", 4, 0, 40, "px"),
  number("infoEnterRise", "Befehlsseite-Einflug: Teile steigen um", "Feinschliff: Befehlsseite", 20, -80, 80, "px"),
  number("infoEnterTime", "Befehlsseite-Einflug: Dauer", "Feinschliff: Befehlsseite", 0.6, 0, 10, "s", 0.05),
  number("infoEnterStagger", "Befehlsseite-Einflug: Abstand zwischen Teilen", "Feinschliff: Befehlsseite", 0.08, 0, 2, "s", 0.05),
] as const satisfies readonly SettingField[];
