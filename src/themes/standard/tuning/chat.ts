// Fine-tuning fields of the Standard theme, group "Feinschliff: Chat" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const CHAT_TUNING = [
  number("chatPadding", "Chat-Bereich: Innenabstand", "Feinschliff: Chat", 12, 0, 48, "px"),
  number("rowPadding", "Chat-Nachricht: Innenabstand oben/unten", "Feinschliff: Chat", 10, 0, 40, "px"),
  number("rowPadding2", "Chat-Nachricht: Innenabstand links/rechts", "Feinschliff: Chat", 14, 0, 56, "px"),
  number("rowFadesAnimation", "Chat-Nachricht beim Ausblenden: Animation Dauer Anteil von „Ein- und Ausblenden“ (%)", "Feinschliff: Chat", 100, 0, 400),
  number("userMarginRight", "Chat-Name: Abstand rechts", "Feinschliff: Chat", 8, -40, 40, "px"),
  inherits(color("userBackground", "Chat-Name: Hintergrund Farbe (Akzentfarbe)", "Feinschliff: Chat", ""), "accent"),
  inherits(color("userBackground2", "Chat-Name: Hintergrund Farbe (Zweite Akzentfarbe (Verlauf))", "Feinschliff: Chat", ""), "accent2"),
  number("userBackground3", "Chat-Name: Hintergrund Verlaufswinkel (Grad)", "Feinschliff: Chat", 135, -360, 360),
  number("kfRowOutToFilter", "Chat-Zeile blendet aus (Ende): Filter Unschärfe", "Feinschliff: Chat", 4, 0, 40, "px"),
  number("chatFromY", "Chat-Einflug: Nachricht kommt von (y)", "Feinschliff: Chat", 24, -96, 96, "px"),
  number("chatFromScale", "Chat-Einflug: startet mit Grösse", "Feinschliff: Chat", 0.96, 0, 2, undefined, 0.01),
  number("chatEnterTime", "Chat-Einflug: Dauer", "Feinschliff: Chat", 0.5, 0, 10, "s", 0.05),
  number("chatOvershoot", "Chat-Einflug: federt nach (Stärke)", "Feinschliff: Chat", 1.4, 0, 5, undefined, 0.1),
] as const satisfies readonly SettingField[];
