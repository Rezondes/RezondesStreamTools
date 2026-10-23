// Renderable clips and the panel template of the Kebab theme. The clips (stinger, banners) follow in package 5 of
// PLAN-KEBAB.md; until then the theme has none (the dashboard marks them as not available). Check: render.check.ts.
import { centeredTop, type PanelDesign, PANEL_START_HEIGHT, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { KebabValues } from "./settings.ts";

export const kebabClips = (): RenderClip[] => [];

// Panel template (panel designer): a bon on paper with a red line around it, a dashed rule and the title in the title font
export function kebabPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as KebabValues;
  const size = 28;
  const dashes = [24, 64, 104, 144, 184, 224, 264].map(x => rectLayer(`dash${x}`, x, PANEL_START_HEIGHT - 18, 24, 2, look.muted));
  return {
    height: PANEL_START_HEIGHT, background: look.paper,
    layers: [
      rectLayer("bon", 8, 8, PANEL_WIDTH - 16, PANEL_START_HEIGHT - 16, look.bon, { radius: 4, stroke: look.red, strokeWidth: 3 }),
      ...dashes,
      textLayer("title", 20, centeredTop(size) - 6, PANEL_WIDTH - 40, title, look.titleFont, size, look.redText, { align: "center", weight: 400 }),
    ],
  };
}
