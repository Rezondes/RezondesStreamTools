// Fine-tuning fields of the Urlaub theme, group "Feinschliff: Strand" (tuning.ts puts the groups together).
import { color, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const BEACH_TUNING = [
  color("boatHullColor", "Boot: Rumpf Farbe", "Feinschliff: Strand", "#f2f2ee"),
  color("boatSailColor", "Boot: Segel Farbe", "Feinschliff: Strand", "#fffaf0"),
  number("boatX", "Boot: seitlich (m)", "Feinschliff: Strand", 60, -500, 500),
  number("boatDrift", "Boot: treibt um (m)", "Feinschliff: Strand", 8, 0, 200),
  number("boatZ", "Boot: Entfernung (m)", "Feinschliff: Strand", -300, -2000, 0),
  number("boatRoll", "Boot: schaukelt (Bogenmass)", "Feinschliff: Strand", 0.04, 0, 1, undefined, 0.01),
  number("boatBob", "Boot: wippt (m)", "Feinschliff: Strand", 0.2, 0, 5, undefined, 0.05),
  number("boatSailHeight", "Boot: Segelhöhe (m)", "Feinschliff: Strand", 7, 0, 40, undefined, 0.1),
  number("boatSailWidth", "Boot: Segelbreite (m)", "Feinschliff: Strand", 3.4, 0, 40, undefined, 0.1),
  number("torchFlame", "Fackeln: Flammengrösse", "Feinschliff: Strand", 0.9, 0, 5, undefined, 0.05),
  number("torchLight", "Fackeln: Lichtstärke", "Feinschliff: Strand", 6, 0, 100),
  number("torchReach", "Fackeln: Lichtweite (m)", "Feinschliff: Strand", 9, 0, 100),
  number("umbrellaSway", "Sonnenschirm: schwingt (Bogenmass)", "Feinschliff: Strand", 0.05, 0, 1, undefined, 0.01),
  number("umbrellaSwaySpeed", "Sonnenschirm: Schwingtempo", "Feinschliff: Strand", 0.8, 0, 10, undefined, 0.05),
  number("gullRadius", "Möwen: Kreisradius (m)", "Feinschliff: Strand", 30, 0, 300),
  number("gullStep", "Möwen: Radius je Möwe (m)", "Feinschliff: Strand", 8, 0, 100),
  number("gullHeight", "Möwen: Flughöhe (m)", "Feinschliff: Strand", 14, 0, 200),
  number("gullRise", "Möwen: Höhe je Möwe (m)", "Feinschliff: Strand", 2, 0, 50, undefined, 0.1),
  number("gullCenter", "Möwen: Kreismitte Tiefe (m)", "Feinschliff: Strand", -40, -500, 500),
  number("gullDepth", "Möwen: Kreistiefe (m)", "Feinschliff: Strand", 18, 0, 300),
  number("gullSwing", "Möwen: auf und ab (m)", "Feinschliff: Strand", 1.2, 0, 20, undefined, 0.1),
  number("gullTilt", "Möwen: Neigung (Bogenmass)", "Feinschliff: Strand", 0.1, 0, 1, undefined, 0.01),
] as const satisfies readonly SettingField[];
