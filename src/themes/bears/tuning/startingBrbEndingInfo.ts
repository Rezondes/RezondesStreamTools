// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Starting, BRB, Ending, Befehlsseite" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_INFO_TUNING = [
  number("paintedPaint", "gemalt: --paint", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 1, 0, 4, undefined, 0.01),
  number("paintedMaskImage", "gemalt: mask-image Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 90, -360, 360),
  number("paintedMaskImage2", "gemalt: mask-image Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 40, 0, 100, "%"),
  number("paintedMaskImage3", "gemalt: mask-image Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 60, 0, 100, "%"),
  inherits(color("eyebrowBackground", "Überzeile: Hintergrund Farbe (Akzent (Ziegelrot))", "Feinschliff: Starting, BRB, Ending, Befehlsseite", ""), "accent"),
  inherits(color("eyebrowColor", "Überzeile: Textfarbe", "Feinschliff: Starting, BRB, Ending, Befehlsseite", ""), "textColor"),
  number("eyebrowFontSize", "Überzeile: Schriftgrösse", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 26, 0, 104, "px"),
  inherits(font("eyebrowFont", "Überzeile: Schrift", "Feinschliff: Starting, BRB, Ending, Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), ""),
  number("titleMargin", "Titel: Aussenabstand oben", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 18, -72, 72, "px"),
  number("titleMargin2", "Titel: Aussenabstand unten", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 8, -40, 40, "px"),
  inherits(font("titleFont2", "Titel: Schrift", "Feinschliff: Starting, BRB, Ending, Befehlsseite", "", ["Sniglet", "Fredoka", "Baloo 2", "Nunito"]), "titleFont"),
  inherits(font("titleFont3", "Titel: Schrift", "Feinschliff: Starting, BRB, Ending, Befehlsseite", "", ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"]), "font"),
  number("titleFontWeight", "Titel: Schriftstärke", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 800, 100, 900, undefined, 100),
  number("titleLineHeight", "Titel: Zeilenhöhe", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 1.05, 0.5, 3, undefined, 0.01),
  inherits(color("titleColor", "Titel: Textfarbe", "Feinschliff: Starting, BRB, Ending, Befehlsseite", ""), "paper"),
  inherits(color("titleWebkitTextStroke", "Titel: Textkontur Farbe (Kontur)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", ""), "outline"),
  number("titleWebkitTextStroke2", "Titel: Textkontur Wert 1", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 1.6, 0, 40, "px", 0.5),
  number("powerAquarellWorldAnimation", "Einschalten Aquarell Welt: Animation Dauer Anteil von „Einschalten (Dauer)“ (%)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 100, 0, 400),
  number("cloudAnimation", "Wolke: Animation Dauer Anteil von „Wolken: Zeit für eine Durchquerung“ (%)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 100, 0, 400),
  number("cloudAnimationDelay", "Wolke: Animationsverzögerung Anteil von „Wolken: Zeit für eine Durchquerung“ (%)", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 100, 0, 400),
  number("kfDriftFromTranslate", "Wolke treibt (Start): Verschiebung x", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 400, -1600, 1600, "px"),
  number("kfDriftToTranslate", "Wolke treibt (Ende): Verschiebung x", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 2200, -8800, 8800, "px"),
  number("kfWashFromFilter", "Aquarell-Wäsche (Start): Filter Unschärfe", "Feinschliff: Starting, BRB, Ending, Befehlsseite", 12, 0, 48, "px"),
] as const satisfies readonly SettingField[];
