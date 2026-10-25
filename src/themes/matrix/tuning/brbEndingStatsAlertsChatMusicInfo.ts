// Fine-tuning fields of the Matrix theme, group "Feinschliff: BRB, Ending, Statistik, Alerts, Chat, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_INFO_TUNING = [
  inherits(color("mutedColor", "Gedämpfter Text: Textfarbe", "Feinschliff: BRB, Ending, Statistik, Alerts, Chat, Musik, Befehlsseite", ""), "dim"),
] as const satisfies readonly SettingField[];
