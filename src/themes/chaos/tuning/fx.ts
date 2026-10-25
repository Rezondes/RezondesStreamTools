// Fine-tuning fields of the Chaos theme, group "Feinschliff: Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const FX_TUNING = [
  number("fxItemTranslate", "Effekt: Verschiebung x", "Feinschliff: Effekte", -50, -150, 150, "%"),
  number("fxItemTranslate2", "Effekt: Verschiebung y", "Feinschliff: Effekte", -50, -150, 150, "%"),
] as const satisfies readonly SettingField[];
