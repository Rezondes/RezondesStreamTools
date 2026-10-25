// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CHAT_MUSIC_INFO_TUNING = [
  inherits(color("inkCyanInk", "Tinte Cyan: Tinte Farbe (Zweiter Akzent Cyan)", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Befehlsseite", ""), "accent2"),
  inherits(color("inkMagentaInk", "Tinte Magenta: Tinte Farbe (Signatur Magenta)", "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Befehlsseite", ""), "accent"),
] as const satisfies readonly SettingField[];
