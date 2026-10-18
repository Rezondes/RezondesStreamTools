// Renderable clips of the Plantage theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawPlantageOfflineBanner, drawPlantageProfileBanner, type PlantageBannerOptions } from "./banners.ts";
import type { PlantageValues } from "./settings.ts";
import { drawPlantageStinger, FPS, HEIGHT, WIDTH, type PlantageStingerOptions } from "./stinger.ts";

// values: resolved against the Plantage schema; login for {login} in the texts
export function plantageClips(values: SettingValues, login: string): RenderClip[] {
  const field = values as unknown as PlantageValues;
  const names = { channel: field.channelName, login };
  const stinger: PlantageStingerOptions = {
    duration: field.stingerDuration, cut: field.stingerCut, leaves: field.stingerLeaves,
    text: fillTemplate(field.stingerText, names), font: field.titleFont,
    mango: field.mango, blush: field.mangoBlush, leaf: field.leaf, leafDark: field.leafDark, paper: field.paper, shadow: field.soilDark,
    textColor: field.textColor,
  };
  const banner: PlantageBannerOptions = {
    loop: field.bannerLoop, font: field.font, titleFont: field.titleFont,
    skyTop: field.skyDayTop, skyBottom: field.skyDayBottom, eveningTop: field.skyEveningTop, eveningBottom: field.skyEveningBottom,
    sun: field.sun, hill: field.hillColor, hillFar: field.hillFarColor, soil: field.soil, soilDark: field.soilDark, leaf: field.leaf, leafDark: field.leafDark,
    trunk: field.trunk, mango: field.mango, blush: field.mangoBlush, paper: field.paper,
    wood: field.wood, woodDark: field.woodDark, textColor: field.textColor, textOnWood: field.textOnWood,
    title: fillTemplate(field.bannerTitle, names), profileText: field.bannerProfileText,
    offlineTitle: field.bannerOfflineTitle, offlineText: field.bannerOfflineText, offlineLines: field.bannerOfflineLines,
  };
  const font = `700 24px "${field.titleFont}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawPlantageStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: field.bannerProfileFps, duration: banner.loop, cut: null, draw: (context, time) => drawPlantageProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: field.bannerOfflineFps, duration: banner.loop, cut: null, draw: (context, time) => drawPlantageOfflineBanner(context, time, banner) },
  ];
}
