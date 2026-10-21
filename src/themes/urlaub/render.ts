// Renderable clips of the Urlaub theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawUrlaubOfflineBanner, drawUrlaubProfileBanner, type UrlaubBannerOptions } from "./banners.ts";
import type { UrlaubValues } from "./settings.ts";
import { drawUrlaubStinger, FPS, HEIGHT, WIDTH, type UrlaubStingerOptions } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame); the loop only scales the time inside the drawing
const BANNER_LOOP = 6;
const BANNER_FPS = 1;

// values: resolved against the Urlaub schema; login for {login} in the texts
export function urlaubClips(values: SettingValues, login: string): RenderClip[] {
  const fruit = values as unknown as UrlaubValues;
  const names = { channel: fruit.channelName, login };
  const stinger: UrlaubStingerOptions = {
    duration: fruit.stingerDuration, cut: fruit.stingerCut, waves: fruit.stingerWaves, foam: fruit.stingerFoam, palm: fruit.stingerPalm,
    text: fillTemplate(fruit.stingerText, names), font: fruit.titleFont,
    sea: fruit.sea, seaDeep: fruit.seaDeep, foamColor: fruit.foam, textColor: fruit.textColor, palmColor: fruit.woodDark,
  };
  const banner: UrlaubBannerOptions = {
    loop: BANNER_LOOP, font: fruit.font, titleFont: fruit.titleFont,
    skyTop: fruit.skyDayTop, skyBottom: fruit.skyDayBottom, eveningTop: fruit.skyEveningTop, eveningBottom: fruit.skyEveningBottom,
    sun: fruit.sun, sea: fruit.sea, seaDeep: fruit.seaDeep, foam: fruit.foam, sand: fruit.sand, palmLeaf: fruit.palmLeaf, palmTrunk: fruit.palmTrunk,
    wood: fruit.wood, woodDark: fruit.woodDark, textColor: fruit.textColor, textOnWood: fruit.textOnWood,
    title: fillTemplate(fruit.bannerTitle, names), profileText: fruit.bannerProfileText,
    offlineTitle: fruit.bannerOfflineTitle, offlineText: fruit.bannerOfflineText, offlineLines: fruit.bannerOfflineLines,
  };
  const font = `400 24px "${fruit.titleFont}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawUrlaubStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawUrlaubProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawUrlaubOfflineBanner(context, time, banner) },
  ];
}
