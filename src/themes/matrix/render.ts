// Renderable clips of the matrix theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import type { SettingValues } from "../../core/theme.ts";
import { bannerOptions, drawOfflineBanner, drawProfileBanner } from "./banners.ts";
import { loadGlyphFont } from "./glyphFont.ts";
import type { MatrixValues } from "./settings.ts";
import { drawStinger, HEIGHT, stingerOptions, WIDTH } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame)
const BANNER_FPS = 1;

// values: resolved against the matrix schema; login for {login} in the banners
export function matrixClips(values: SettingValues, login: string): RenderClip[] {
  const matrix = values as unknown as MatrixValues;
  const stinger = stingerOptions(matrix);
  const banner = bannerOptions(matrix, login);
  const font = `24px "${matrix.font}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, prepare: loadGlyphFont, draw: (context, time) => drawStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, prepare: loadGlyphFont, draw: (context, time) => drawProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, prepare: loadGlyphFont, draw: (context, time) => drawOfflineBanner(context, time, banner) },
  ];
}

// Panel template of the Matrix theme (panel designer): black with a thin green frame, the title as a glowing terminal
// prompt with a cursor
export function matrixPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as MatrixValues;
  const size = 26;
  return {
    height: PANEL_START_HEIGHT, background: look.background,
    layers: [
      rectLayer("frame", 4, 4, PANEL_WIDTH - 8, PANEL_START_HEIGHT - 8, "transparent", { stroke: look.dim, strokeWidth: 2 }),
      rectLayer("line", 16, PANEL_START_HEIGHT - 22, PANEL_WIDTH - 32, 2, look.line),
      textLayer("title", 18, centeredTop(size) - 4, PANEL_WIDTH - 36, `> ${title.toUpperCase()}_`, look.font, size, look.accent, { align: "left", weight: 400, glow: 8, glowColor: look.glow }),
    ],
  };
}
