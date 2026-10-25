// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Welt" (tuning.ts puts the groups together).
import { color, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const WORLD_TUNING = [
  number("cloudAnimation", "Wolke: Animation Dauer Anteil von „Wolken: Zeit für eine Durchquerung“ (%)", "Feinschliff: Welt", 100, 0, 400),
  number("cloudAnimationDelay", "Wolke: Animationsverzögerung Anteil von „Wolken: Zeit für eine Durchquerung“ (%)", "Feinschliff: Welt", 100, 0, 400),
  number("kfDriftFromTranslate", "Wolke treibt (Start): Verschiebung x", "Feinschliff: Welt", 400, -1600, 1600, "px"),
  number("kfDriftToTranslate", "Wolke treibt (Ende): Verschiebung x", "Feinschliff: Welt", 2200, -8800, 8800, "px"),
  number("groundShadowBottom", "Boden Schatten: Lage unten", "Feinschliff: Welt", 12, -48, 48, "px"),
  number("groundShadowWidth", "Boden Schatten: Breite", "Feinschliff: Welt", 80, 0, 240, "%"),
  number("groundShadowHeight", "Boden Schatten: Höhe", "Feinschliff: Welt", 36, 0, 144, "px"),
  inherits(color("groundShadowBackground", "Boden Schatten: Hintergrund Farbe (Kontur)", "Feinschliff: Welt", ""), "outline"),
  number("groundShadowBackground2", "Boden Schatten: Hintergrund Farbanteil", "Feinschliff: Welt", 22, 0, 100, "%"),
  number("groundShadowFilter", "Boden Schatten: Filter Unschärfe", "Feinschliff: Welt", 4, 0, 40, "px"),
  number("kfWashFromFilter", "Aquarell-Wäsche (Start): Filter Unschärfe", "Feinschliff: Welt", 12, 0, 48, "px"),
] as const satisfies readonly SettingField[];
