// Render section of the Dogs theme: the clips (stinger and banners follow in PLAN-DOGS.md package 5, until then none)
// and the panel template: a cream pixel box with an ink edge, the red pill with a paw and the title in the font.
// Check: render.check.ts.
import { centeredTop, type PanelDesign, PANEL_START_HEIGHT, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { DogsValues } from "./settings.ts";

export const dogsClips = (): RenderClip[] => [];

// fixed: the panel in panel pixels: edge 4 px, shadow 6 px below, the pill as a square on the left with a 3 x 3 paw
const EDGE = 4;
const SHADOW = 6;
const PILL = { x: 22, size: 44 };
const PAW = { toe: 8, pad: 14 };

export function dogsPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as DogsValues;
  const size = 28;
  const width = PANEL_WIDTH - 4 * EDGE;
  const height = PANEL_START_HEIGHT - 4 * EDGE - SHADOW;
  const pillTop = 2 * EDGE + (height - PILL.size) / 2;
  const toes = [0, 1, 2].map(index => rectLayer(`toe${index}`, PILL.x + 6 + index * (PAW.toe + 4), pillTop + 8, PAW.toe, PAW.toe, look.onAccent));
  return {
    height: PANEL_START_HEIGHT, background: look.cream,
    layers: [
      rectLayer("shadow", EDGE, EDGE + SHADOW, width + 2 * EDGE, height + 2 * EDGE, look.edge),
      rectLayer("edge", EDGE, EDGE, width + 2 * EDGE, height + 2 * EDGE, look.ink),
      rectLayer("box", 2 * EDGE, 2 * EDGE, width, height, look.cream),
      rectLayer("pill", PILL.x, pillTop, PILL.size, PILL.size, look.accent, { stroke: look.ink, strokeWidth: 3 }),
      ...toes,
      rectLayer("pad", PILL.x + (PILL.size - PAW.pad) / 2 - 2, pillTop + 22, PAW.pad + 4, PAW.pad, look.onAccent),
      textLayer("title", PILL.x + PILL.size + 14, centeredTop(size) - SHADOW / 2, width - PILL.size - 30, title, look.font, size, look.textColor, { weight: 700 }),
    ],
  };
}
