// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_FX_INFO_TUNING = [
  inherits(color("glowTextShadow", "Glühender Text: Textschatten Farbe (Glühfarbe)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", ""), "glow"),
  inherits(color("glowTextShadow2", "Glühender Text: Textschatten Farbe (Glühfarbe)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", ""), "glow"),
  number("glowTextShadow3", "Glühender Text: Textschatten Unschärfe (Teil 1)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", 6, 0, 40, "px"),
  number("glowTextShadow4", "Glühender Text: Textschatten Farbanteil", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", 80, 0, 100, "%"),
  number("glowTextShadow5", "Glühender Text: Textschatten Unschärfe (Teil 2)", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", 18, 0, 72, "px"),
  number("glowTextShadow6", "Glühender Text: Textschatten Farbanteil", "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite", 45, 0, 100, "%"),
] as const satisfies readonly SettingField[];
