// Fine-tuning fields of the Chaos theme, group "Feinschliff: Alerts, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_MUSIC_INFO_TUNING = [
  number("chipPadding", "Plakette: Innenabstand oben/unten", "Feinschliff: Alerts, Musik, Befehlsseite", 4, 0, 40, "px"),
  number("chipPadding2", "Plakette: Innenabstand links/rechts", "Feinschliff: Alerts, Musik, Befehlsseite", 14, 0, 56, "px"),
  inherits(color("chipBackground", "Plakette: Hintergrund Farbe (Flieder (Klebeband))", "Feinschliff: Alerts, Musik, Befehlsseite", ""), "lilac"),
  inherits(color("chipColor", "Plakette: Textfarbe", "Feinschliff: Alerts, Musik, Befehlsseite", ""), "onAccent2"),
  number("chipFontWeight", "Plakette: Schriftstärke", "Feinschliff: Alerts, Musik, Befehlsseite", 700, 100, 900, undefined, 100),
  number("chipLetterSpacing", "Plakette: Zeichenabstand (em)", "Feinschliff: Alerts, Musik, Befehlsseite", 0.06, -2, 2, undefined, 0.01),
  number("chipRotate", "Plakette: Drehung (Grad)", "Feinschliff: Alerts, Musik, Befehlsseite", -2, -360, 360),
  inherits(font("chipFont", "Plakette: Schrift", "Feinschliff: Alerts, Musik, Befehlsseite", "", ["Space Grotesk", "Inter", "Manrope", "DM Sans"]), ""),
] as const satisfies readonly SettingField[];
