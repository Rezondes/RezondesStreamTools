// Renderbare Clips des Starter-Themes: Stinger (Gruppe Stinger) sowie Profil- und Offline-Banner (Gruppe Banner),
// gezeichnet mit den aufgelösten Einstellungen. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawStarterOfflineBanner, drawStarterProfileBanner, type StarterBannerOptions } from "./banners.ts";
import type { StarterValues } from "./settings.ts";
import { drawStarterStinger, FPS, HEIGHT, WIDTH, type StarterStingerOptions } from "./stinger.ts";

// values: gegen das Starter-Schema aufgelöst; login für {login} in den Texten
export function starterClips(values: SettingValues, login: string): RenderClip[] {
  const starter = values as unknown as StarterValues;
  const names = { channel: starter.channelName, login };
  const colors = { accent: starter.accent, accent2: starter.accent2, textColor: starter.textColor };
  const stinger: StarterStingerOptions = {
    ...colors, duration: starter.stingerDuration, cut: starter.stingerCut, panels: starter.stingerPanels, text: fillTemplate(starter.stingerText, names), font: starter.font,
  };
  const banner: StarterBannerOptions = {
    ...colors, loop: starter.bannerLoop, font: starter.font, background: starter.background, mutedColor: starter.mutedColor,
    title: fillTemplate(starter.bannerTitle, names), profileText: starter.bannerProfileText, offlineTitle: starter.bannerOfflineTitle, offlineText: starter.bannerOfflineText,
  };
  const font = `800 24px "${starter.font}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStarterStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: starter.bannerProfileFps, duration: banner.loop, cut: null, draw: (context, time) => drawStarterProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: starter.bannerOfflineFps, duration: banner.loop, cut: null, draw: (context, time) => drawStarterOfflineBanner(context, time, banner) },
  ];
}
