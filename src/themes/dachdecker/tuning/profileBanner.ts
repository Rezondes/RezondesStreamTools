// Fine-tuning fields of the Dachdecker theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileBlueprint", "Blaupause: Farbe", "Profilbanner", ""), "blueprint"),
  inherits(color("profilePage", "Seite: Farbe", "Profilbanner", ""), "page"),
  inherits(color("profileAccent", "Name: Farbe", "Profilbanner", ""), "accent"),
  inherits(color("profileCopper", "Kopfzeile: Farbe", "Profilbanner", ""), "copper"),
  inherits(color("profileLine", "Linien und Text: Farbe", "Profilbanner", ""), "line"),
  inherits(font("profileFont", "Schrift", "Profilbanner", "", ["Roboto Mono", "IBM Plex Mono", "Fira Mono", "Share Tech Mono"]), "font"),
  number("profileSignWidth", "Schild: Breite (Anteil)", "Profilbanner", 0.78, 0, 1, undefined, 0.01),
  number("profileGridMajor", "Raster: Deckkraft", "Profilbanner", 0.1, 0, 1, undefined, 0.01),
  number("profileGridFine", "Feinraster: Deckkraft", "Profilbanner", 0.04, 0, 1, undefined, 0.01),
  number("profileGridPage", "Raster der Seite: Deckkraft", "Profilbanner", 0.04, 0, 1, undefined, 0.01),
  number("profileSheetOpacity", "Blatt: Deckkraft", "Profilbanner", 0.9, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
