// Fine-tuning fields of the Bärenbande theme, group "Feinschliff: Alerts, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const ALERTS_FX_TUNING = [
  number("outKeinsOutEase", "Ausblendung keine: Ausblend-Kurve Schritte 1", "Feinschliff: Alerts, Effekte", 1, 1, 4),
  number("kfWaddleIn0pTranslate", "Watschel-Einblendung (0 %): Verschiebung x (vw)", "Feinschliff: Alerts, Effekte", 60, -240, 240, undefined, 0.01),
  number("kfWaddleIn0pRotate", "Watschel-Einblendung (0 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", -4, -360, 360),
  number("kfWaddleIn25pRotate", "Watschel-Einblendung (25 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", 4, -360, 360),
  number("kfWaddleIn50pRotate", "Watschel-Einblendung (50 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", -4, -360, 360),
  number("kfWaddleIn75pRotate", "Watschel-Einblendung (75 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", 3, -360, 360),
  number("kfWaddleOut30pRotate", "Watschel-Ausblendung (30 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", 4, -360, 360),
  number("kfWaddleOut60pRotate", "Watschel-Ausblendung (60 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", -4, -360, 360),
  number("kfWaddleOut100pTranslate", "Watschel-Ausblendung (100 %): Verschiebung x (vw)", "Feinschliff: Alerts, Effekte", 60, -240, 240, undefined, 0.01),
  number("kfWaddleOut100pRotate", "Watschel-Ausblendung (100 %): Drehung (Grad)", "Feinschliff: Alerts, Effekte", 3, -360, 360),
  number("kfPloppOutFromScale", "Plopp-Ausblendung (Start): Grösse", "Feinschliff: Alerts, Effekte", 1, 0, 4, undefined, 0.01),
  number("kfPloppOutFromOpacity", "Plopp-Ausblendung (Start): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfPloppOutToScale", "Plopp-Ausblendung (Ende): Grösse", "Feinschliff: Alerts, Effekte", 0.6, 0, 2.4, undefined, 0.01),
  number("kfSlideInFromTranslate", "Gleit-Einblendung (Start): Verschiebung y", "Feinschliff: Alerts, Effekte", 120, -480, 480, "px"),
  number("kfSlideInToOpacity", "Gleit-Einblendung (Ende): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfSlideOutFromOpacity", "Gleit-Ausblendung (Start): Deckkraft", "Feinschliff: Alerts, Effekte", 1, 0, 1, undefined, 0.01),
  number("kfSlideOutToTranslate", "Gleit-Ausblendung (Ende): Verschiebung y", "Feinschliff: Alerts, Effekte", 120, -480, 480, "px"),
] as const satisfies readonly SettingField[];
