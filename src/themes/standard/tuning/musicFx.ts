// Fine-tuning fields of the Standard theme, group "Feinschliff: Musik, Effekte" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const MUSIC_FX_TUNING = [
  number("kfOutToTranslate", "Ausblenden (Ende): Verschiebung y", "Feinschliff: Musik, Effekte", 16, -64, 64, "px"),
] as const satisfies readonly SettingField[];
