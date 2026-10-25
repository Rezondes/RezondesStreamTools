// Fine-tuning fields of the Dachdecker theme, group "Stinger" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STINGER_TUNING = [
  inherits(color("stingerBlueprint", "Blaupause: Farbe", "Stinger", ""), "blueprint"),
  inherits(color("stingerLine", "Linien und Text: Farbe", "Stinger", ""), "line"),
  inherits(color("stingerAccent", "Akzent: Farbe", "Stinger", ""), "accent"),
  inherits(color("stingerCopper", "Kupfer: Farbe", "Stinger", ""), "copper"),
  inherits(color("stingerMuted", "Gedämpft: Farbe", "Stinger", ""), "muted"),
  inherits(color("stingerBrick", "Ziegelrot: Farbe", "Stinger", ""), "brick"),
  inherits(color("stingerShadow", "Schatten der Rolle: Farbe", "Stinger", ""), "page"),
  inherits(font("stingerFont", "Schrift", "Stinger", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), "font"),
  number("stingerSeams", "Rolle: Nähte Deckkraft", "Stinger", 0.3, 0, 1, undefined, 0.01),
  number("stingerShadowAlpha", "Rolle: Schatten Deckkraft", "Stinger", 0.35, 0, 1, undefined, 0.01),
  number("stingerPaperLight", "Rolle: Papier heller (Anteil)", "Stinger", 0.35, 0, 1, undefined, 0.01),
  number("stingerAmbient", "Rolle: Umgebungslicht", "Stinger", 0.35, 0, 10, undefined, 0.05),
  number("stingerSun", "Rolle: Licht von links", "Stinger", 2.2, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
