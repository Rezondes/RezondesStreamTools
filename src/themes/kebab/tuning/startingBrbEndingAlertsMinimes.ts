// Fine-tuning fields of the Kebab theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Minimes" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_MINIMES_TUNING = [
  inherits(color("inkStroke", "Tinte: Linienfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Starting, BRB, Ending, Alerts, Minimes", ""), "red"),
  inherits(color("fillFill", "Füllung: Füllfarbe Farbe (Papier)", "Feinschliff: Starting, BRB, Ending, Alerts, Minimes", ""), "paper"),
  inherits(color("dotStroke", "Punkt: Linienfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Starting, BRB, Ending, Alerts, Minimes", ""), "red"),
  number("dotStrokeWidth", "Punkt: Linienstärke", "Feinschliff: Starting, BRB, Ending, Alerts, Minimes", 2.2, 0, 40, "px", 0.5),
  inherits(color("dotFilledFill", "Punkt gefüllt: Füllfarbe Farbe (Linien und Bogenschrift (Signatur))", "Feinschliff: Starting, BRB, Ending, Alerts, Minimes", ""), "red"),
] as const satisfies readonly SettingField[];
