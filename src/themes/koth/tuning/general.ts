// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.3, 0.5, 3, undefined, 0.01),
  inherits(color("nameBandColor", "Minime-Name als Band: Textfarbe", "Feinschliff: Allgemein", ""), "textColor"),
  inherits(color("nameSchildBackground", "Minime-Name als Schild: Hintergrund Farbe (Papier (Karten, Berichte))", "Feinschliff: Allgemein", ""), "paper"),
  number("nameSchildBorder", "Minime-Name als Schild: Rand Stärke", "Feinschliff: Allgemein", 2, 0, 40, "px"),
  inherits(color("nameSchildColor", "Minime-Name als Schild: Textfarbe", "Feinschliff: Allgemein", ""), "ink"),
  number("coverEckigBorderRadius", "Cover eckig: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Allgemein", 100, 0, 400),
] as const satisfies readonly SettingField[];
