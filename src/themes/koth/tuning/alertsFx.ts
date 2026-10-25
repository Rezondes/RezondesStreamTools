// Fine-tuning fields of the King of the Hill theme, group "Feinschliff: Alerts, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_FX_TUNING = [
  number("inFunkInEase", "Einblendung Funk: Einblend-Kurve Schritte 1", "Feinschliff: Alerts, Effekte", 8, 1, 32),
  number("outFunkOutEase", "Ausblendung Funk: Ausblend-Kurve Schritte 1", "Feinschliff: Alerts, Effekte", 8, 1, 32),
  number("outKeinsOutEase", "Ausblendung keine: Ausblend-Kurve Schritte 1", "Feinschliff: Alerts, Effekte", 1, 1, 4),
  number("kfStatic0pFilter", "Funk-Einblendung (0 %): Filter Kontrast", "Feinschliff: Alerts, Effekte", 3, 0, 12),
  number("kfStatic0pFilter2", "Funk-Einblendung (0 %): Filter Helligkeit", "Feinschliff: Alerts, Effekte", 2, 0, 10),
  number("kfStatic30pOpacity", "Funk-Einblendung (30 %): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfStatic30pTranslate", "Funk-Einblendung (30 %): Verschiebung x", "Feinschliff: Alerts, Effekte", 6, -40, 40, "px"),
  number("kfStatic50pOpacity", "Funk-Einblendung (50 %): Deckkraft", "Feinschliff: Alerts, Effekte", 0.4, 0, 1, undefined, 0.01),
  number("kfStatic50pTranslate", "Funk-Einblendung (50 %): Verschiebung x", "Feinschliff: Alerts, Effekte", 6, -40, 40, "px"),
  number("kfStatic70pOpacity", "Funk-Einblendung (70 %): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfStatic100pOpacity", "Funk-Einblendung (100 %): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfStaticOut0pOpacity", "Funk-Ausblendung (0 %): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfStaticOut40pOpacity", "Funk-Ausblendung (40 %): Deckkraft", "Feinschliff: Alerts, Effekte", 0.4, 0, 1, undefined, 0.01),
  number("kfStaticOut40pTranslate", "Funk-Ausblendung (40 %): Verschiebung x", "Feinschliff: Alerts, Effekte", 6, -40, 40, "px"),
  number("kfStaticOut70pOpacity", "Funk-Ausblendung (70 %): Deckkraft", "Feinschliff: Alerts, Effekte", 0.8, 0, 1, undefined, 0.01),
  number("kfStaticOut70pTranslate", "Funk-Ausblendung (70 %): Verschiebung x", "Feinschliff: Alerts, Effekte", 6, -40, 40, "px"),
  number("kfPopInFromScale", "Plopp-Einblendung (Start): Grösse", "Feinschliff: Alerts, Effekte", 0.4, 0, 2, undefined, 0.01),
  number("kfPopInToOpacity", "Plopp-Einblendung (Ende): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfPopInToScale", "Plopp-Einblendung (Ende): Grösse", "Feinschliff: Alerts, Effekte", 1, 0, 4, undefined, 0.01),
  number("kfPopOutFromOpacity", "Plopp-Ausblendung (Start): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfPopOutFromScale", "Plopp-Ausblendung (Start): Grösse", "Feinschliff: Alerts, Effekte", 1, 0, 4, undefined, 0.01),
  number("kfPopOutToScale", "Plopp-Ausblendung (Ende): Grösse", "Feinschliff: Alerts, Effekte", 0.4, 0, 2, undefined, 0.01),
  number("kfSlideInFromTranslate", "Gleit-Einblendung (Start): Verschiebung x (vw)", "Feinschliff: Alerts, Effekte", -60, -240, 240, undefined, 0.01),
  number("kfSlideInToOpacity", "Gleit-Einblendung (Ende): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfSlideOutFromOpacity", "Gleit-Ausblendung (Start): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfSlideOutToTranslate", "Gleit-Ausblendung (Ende): Verschiebung x (vw)", "Feinschliff: Alerts, Effekte", 60, -240, 240, undefined, 0.01),
] as const satisfies readonly SettingField[];
