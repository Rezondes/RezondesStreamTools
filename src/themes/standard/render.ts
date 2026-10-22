// Renderable clips of the standard theme: stinger (group Stinger) and profile banner (group Profilbanner) and offline banner (group Offline-Banner),
// drawn with the resolved settings. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { auroraOptions } from "./aurora.ts";
import { drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";
import type { LightsOptions } from "./lights.ts";
import type { StandardValues } from "./settings.ts";
import { drawStandardStinger, HEIGHT, WIDTH, type StandardStingerOptions } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame); the loop only scales the time inside the drawing
const BANNER_LOOP = 6;
const BANNER_FPS = 1;

// values: resolved against the standard schema; login for {login} in the texts
export function standardClips(values: SettingValues, login: string): RenderClip[] {
  const standard = values as unknown as StandardValues;
  const names = { channel: standard.channelName, login };
  const colors = { accent: standard.accent, accent2: standard.accent2, textColor: standard.textColor };
  // The light fields and the dust of the screens; without blobs or dustOn none of them
  const lights: LightsOptions = { ...auroraOptions(standard), count: standard.blobs ? standard.auroraFields : 0, dust: standard.dustOn ? standard.dustCount : 0 };
  const stinger: StandardStingerOptions = {
    ...colors, duration: standard.stingerDuration, cut: standard.stingerCut, panels: standard.stingerPanels, text: fillTemplate(standard.stingerText, names), font: standard.font, background: standard.background, lights,
  };
  const banner: StandardBannerOptions = {
    ...colors, loop: BANNER_LOOP, font: standard.font, background: standard.background, mutedColor: standard.mutedColor,
    title: fillTemplate(standard.bannerTitle, names), profileText: standard.bannerProfileText, offlineTitle: standard.bannerOfflineTitle, offlineText: standard.bannerOfflineText, lights,
  };
  const font = `800 24px "${standard.font}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStandardStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Profilbanner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawStandardProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Offline-Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawStandardOfflineBanner(context, time, { ...banner, title: fillTemplate(standard.bannerOfflineName, names) }) },
  ];
}

// Panel template of the standard theme (panel designer): a dark rounded card on the background, a gradient bar at the
// left and the title in the theme font
export function standardPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as StandardValues;
  const size = 30;
  return {
    height: PANEL_START_HEIGHT, background: look.background,
    layers: [
      rectLayer("card", 8, 8, PANEL_WIDTH - 16, PANEL_START_HEIGHT - 16, look.card, { radius: 16, stroke: look.accent, strokeWidth: 2 }),
      rectLayer("bar", 18, 22, 6, PANEL_START_HEIGHT - 44, look.accent, { fill2: look.accent2, radius: 3 }),
      textLayer("title", 36, centeredTop(size), PANEL_WIDTH - 60, title, look.font, size, look.textColor, { weight: 800 }),
    ],
  };
}
