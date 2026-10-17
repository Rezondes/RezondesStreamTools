// Renderable clips of the standard theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";
import type { StandardValues } from "./settings.ts";
import { drawStandardStinger, FPS, HEIGHT, WIDTH, type StandardStingerOptions } from "./stinger.ts";

// values: resolved against the standard schema; login for {login} in the texts
export function standardClips(values: SettingValues, login: string): RenderClip[] {
  const standard = values as unknown as StandardValues;
  const names = { channel: standard.channelName, login };
  const colors = { accent: standard.accent, accent2: standard.accent2, textColor: standard.textColor };
  const stinger: StandardStingerOptions = {
    ...colors, duration: standard.stingerDuration, cut: standard.stingerCut, panels: standard.stingerPanels, text: fillTemplate(standard.stingerText, names), font: standard.font,
  };
  const banner: StandardBannerOptions = {
    ...colors, loop: standard.bannerLoop, font: standard.font, background: standard.background, mutedColor: standard.mutedColor,
    title: fillTemplate(standard.bannerTitle, names), profileText: standard.bannerProfileText, offlineTitle: standard.bannerOfflineTitle, offlineText: standard.bannerOfflineText,
  };
  const font = `800 24px "${standard.font}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStandardStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: standard.bannerProfileFps, duration: banner.loop, cut: null, draw: (context, time) => drawStandardProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: standard.bannerOfflineFps, duration: banner.loop, cut: null, draw: (context, time) => drawStandardOfflineBanner(context, time, banner) },
  ];
}
