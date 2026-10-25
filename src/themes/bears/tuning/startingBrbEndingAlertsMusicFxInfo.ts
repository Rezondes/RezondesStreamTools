// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_MUSIC_FX_INFO_TUNING = [
  inherits(color("cardBackground", "Karte: Hintergrund Farbe (Papier (Karten, Schilder))", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", ""), "paper"),
  inherits(color("cardColor", "Karte: Textfarbe", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", ""), "textDark"),
  inherits(color("cardBorder", "Karte: Rand Farbe (Kontur)", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", ""), "outline"),
  number("cardBorder2", "Karte: Rand Stärke", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 5, 0, 40, "px"),
  number("cardBorderRadius", "Karte: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 100, 0, 400),
  inherits(color("cardBoxShadow", "Karte: Schatten Farbe (Papier: Schattenton)", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", ""), "paperShade"),
  number("cardBoxShadow2", "Karte: Schatten y", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 10, -40, 40, "px"),
  number("cardPadding", "Karte: Innenabstand oben", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 24, 0, 96, "px"),
  number("cardPadding2", "Karte: Innenabstand links/rechts", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 36, 0, 144, "px"),
  number("cardPadding3", "Karte: Innenabstand unten", "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite", 30, 0, 120, "px"),
] as const satisfies readonly SettingField[];
