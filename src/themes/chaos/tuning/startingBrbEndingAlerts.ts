// Fine-tuning fields of the Chaos theme, group "Feinschliff: Starting, BRB, Ending, Alerts" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_TUNING = [
  number("kfSprayTitleFromWebkitMaskImage", "Titel sprühen (Start): -webkit-mask-image Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts", 90, -360, 360),
  number("kfSprayTitleFromWebkitMaskImage2", "Titel sprühen (Start): -webkit-mask-image Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Alerts", 45, 0, 100, "%"),
  number("kfSprayTitleFromWebkitMaskImage3", "Titel sprühen (Start): -webkit-mask-image Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Alerts", 55, 0, 100, "%"),
  number("kfSprayTitleFromMaskImage", "Titel sprühen (Start): mask-image Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts", 90, -360, 360),
  number("kfSprayTitleFromMaskImage2", "Titel sprühen (Start): mask-image Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Alerts", 45, 0, 100, "%"),
  number("kfSprayTitleFromMaskImage3", "Titel sprühen (Start): mask-image Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Alerts", 55, 0, 100, "%"),
  number("kfSprayTitleToWebkitMaskImage", "Titel sprühen (Ende): -webkit-mask-image Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts", 90, -360, 360),
  number("kfSprayTitleToWebkitMaskImage2", "Titel sprühen (Ende): -webkit-mask-image Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Alerts", 45, 0, 100, "%"),
  number("kfSprayTitleToWebkitMaskImage3", "Titel sprühen (Ende): -webkit-mask-image Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Alerts", 55, 0, 100, "%"),
  number("kfSprayTitleToMaskImage", "Titel sprühen (Ende): mask-image Verlaufswinkel (Grad)", "Feinschliff: Starting, BRB, Ending, Alerts", 90, -360, 360),
  number("kfSprayTitleToMaskImage2", "Titel sprühen (Ende): mask-image Verlauf Stopp 1", "Feinschliff: Starting, BRB, Ending, Alerts", 45, 0, 100, "%"),
  number("kfSprayTitleToMaskImage3", "Titel sprühen (Ende): mask-image Verlauf Stopp 2", "Feinschliff: Starting, BRB, Ending, Alerts", 55, 0, 100, "%"),
] as const satisfies readonly SettingField[];
