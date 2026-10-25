// Fine-tuning fields of the Dogs theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerEdge", "Rand: Farbe", "Stinger", ""), "edge"),
  inherits(color("stingerInk", "Tinte: Farbe", "Stinger", ""), "ink"),
  inherits(color("stingerAccent", "Akzent: Farbe", "Stinger", ""), "accent"),
  inherits(color("stingerBall", "Ball: Farbe", "Stinger", ""), "ball"),
  inherits(color("stingerMuted", "Gedämpft: Farbe", "Stinger", ""), "muted"),
  inherits(font("stingerFont", "Name: Schrift", "Stinger", "", ["Pixelify Sans", "VT323", "Silkscreen"]), "font"),
  number("stingerNameSize", "Name: Schriftgrösse", "Stinger", 60, 0, 400, "px"),
  number("stingerNameBelow", "Name: unter dem Abzeichen", "Stinger", 80, -400, 400, "px"),
] as const satisfies readonly SettingField[];
