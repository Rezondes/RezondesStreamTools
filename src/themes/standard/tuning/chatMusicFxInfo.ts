// Fine-tuning fields of the Standard theme, group "Feinschliff: Chat, Musik, Effekte, Befehlsseite" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_MUSIC_FX_INFO_TUNING = [
  number("cardBorderRadius", "Karte: Eckenradius Anteil von „Eckenradius“ (%)", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", 100, 0, 400),
  inherits(color("cardBackground", "Karte: Hintergrund Farbe (Kartenfarbe)", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", ""), "card"),
  inherits(color("cardBoxShadow", "Karte: Schatten Farbe (Kartenfarbe)", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", ""), "card"),
  number("cardBoxShadow2", "Karte: Schatten y", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", 12, -48, 48, "px"),
  number("cardBoxShadow3", "Karte: Schatten Unschärfe", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", 32, 0, 128, "px"),
  number("cardBoxShadow4", "Karte: Schatten Farbanteil", "Feinschliff: Chat, Musik, Effekte, Befehlsseite", 50, 0, 100, "%"),
] as const satisfies readonly SettingField[];
