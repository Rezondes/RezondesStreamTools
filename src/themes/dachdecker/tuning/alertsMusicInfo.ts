// Fine-tuning fields of the Dachdecker theme, group "Feinschliff: Alerts, Musik, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_MUSIC_INFO_TUNING = [
  number("signPadding", "Schild: Innenabstand oben/unten", "Feinschliff: Alerts, Musik, Befehlsseite", 18, 0, 72, "px"),
  number("signPadding2", "Schild: Innenabstand links/rechts", "Feinschliff: Alerts, Musik, Befehlsseite", 26, 0, 104, "px"),
] as const satisfies readonly SettingField[];
