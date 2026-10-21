// Renderable clips of the standard theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";
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
  const stinger: StandardStingerOptions = {
    ...colors, duration: standard.stingerDuration, cut: standard.stingerCut, panels: standard.stingerPanels, text: fillTemplate(standard.stingerText, names), font: standard.font,
  };
  const banner: StandardBannerOptions = {
    ...colors, loop: BANNER_LOOP, font: standard.font, background: standard.background, mutedColor: standard.mutedColor,
    title: fillTemplate(standard.bannerTitle, names), profileText: standard.bannerProfileText, offlineTitle: standard.bannerOfflineTitle, offlineText: standard.bannerOfflineText,
  };
  const font = `800 24px "${standard.font}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStandardStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawStandardProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawStandardOfflineBanner(context, time, banner) },
  ];
}
