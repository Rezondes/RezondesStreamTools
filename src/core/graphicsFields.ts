// Shared field of themes with 3D or PixiJS (plans/PLAN-GRAFIK.md, package 8): the performance level, so weaker PCs can
// throttle (meaning of the levels: three/quality.ts). Check: graphicsFields.check.ts.
import { choice } from "./fields.ts";
import { QUALITIES } from "./three/quality.ts";

export const qualityField = (group: string) => choice("quality", "Leistungsstufe 3D", group, "mittel", QUALITIES);
