// Renderbare Clips des Südfrucht-Themes: Stinger (Gruppe Stinger) sowie Profil- und Offline-Banner (Gruppe Banner),
// gezeichnet mit den aufgelösten Einstellungen. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawSuedfruchtOfflineBanner, drawSuedfruchtProfileBanner, type SuedfruchtBannerOptions } from "./banners.ts";
import type { SuedfruchtValues } from "./settings.ts";
import { drawSuedfruchtStinger, FPS, HEIGHT, WIDTH, type SuedfruchtStingerOptions } from "./stinger.ts";

// values: gegen das Südfrucht-Schema aufgelöst; login für {login} in den Texten
export function suedfruchtClips(values: SettingValues, login: string): RenderClip[] {
  const fruit = values as unknown as SuedfruchtValues;
  const names = { channel: fruit.channelName, login };
  const stinger: SuedfruchtStingerOptions = {
    duration: fruit.stingerDuration, cut: fruit.stingerCut, waves: fruit.stingerWaves, foam: fruit.stingerFoam, palm: fruit.stingerPalm,
    text: fillTemplate(fruit.stingerText, names), font: fruit.titleFont,
    sea: fruit.sea, seaDeep: fruit.seaDeep, foamColor: fruit.foam, textColor: fruit.textColor, palmColor: fruit.woodDark,
  };
  const banner: SuedfruchtBannerOptions = {
    loop: fruit.bannerLoop, font: fruit.font, titleFont: fruit.titleFont,
    skyTop: fruit.skyDayTop, skyBottom: fruit.skyDayBottom, eveningTop: fruit.skyEveningTop, eveningBottom: fruit.skyEveningBottom,
    sun: fruit.sun, sea: fruit.sea, seaDeep: fruit.seaDeep, foam: fruit.foam, sand: fruit.sand, palmLeaf: fruit.palmLeaf, palmTrunk: fruit.palmTrunk,
    wood: fruit.wood, woodDark: fruit.woodDark, textColor: fruit.textColor, textOnWood: fruit.textOnWood,
    title: fillTemplate(fruit.bannerTitle, names), profileText: fruit.bannerProfileText,
    offlineTitle: fruit.bannerOfflineTitle, offlineText: fruit.bannerOfflineText, offlineLines: fruit.bannerOfflineLines,
  };
  const font = `400 24px "${fruit.titleFont}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawSuedfruchtStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: fruit.bannerProfileFps, duration: banner.loop, cut: null, draw: (context, time) => drawSuedfruchtProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: fruit.bannerOfflineFps, duration: banner.loop, cut: null, draw: (context, time) => drawSuedfruchtOfflineBanner(context, time, banner) },
  ];
}
