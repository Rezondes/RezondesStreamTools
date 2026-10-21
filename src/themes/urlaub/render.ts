// Renderable clips of the Urlaub theme (PLAN-URLAUB.md package 8): the stinger (group Stinger, the swell of stinger.ts
// with spray) and the profile and offline banners (group Banner) as the realistic beach by day and in the sunset with
// their texts. The 3D module loads only in prepare (clips3d.ts), so three.js stays out of the entry chunk; until then
// the banners draw only their texts. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { BannerWorldOptions } from "./bannerWorld.ts";
import { drawUrlaubOfflineBanner, drawUrlaubProfileBanner, OFFLINE_SIZE, PROFILE_SIZE, type UrlaubBannerOptions } from "./banners.ts";
import type * as Clips3d from "./clips3d.ts";
import type { UrlaubValues } from "./settings.ts";
import { drawUrlaubStinger, HEIGHT, WIDTH, type UrlaubStingerOptions } from "./stinger.ts";

// A banner is one picture (the dashboard renders its first frame)
const STILL = { duration: 1, fps: 1 };

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// The 3D draw functions, loaded once by prepare
let parts: typeof Clips3d | null = null;
const prepare = async () => { parts ??= await import("./clips3d.ts"); };
// The 3D picture once prepare has loaded the 3D part, the texts alone before
function clipDraw(build: (loaded: typeof Clips3d) => Draw, standIn: Draw): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) return standIn(context, time);
    picture ??= build(parts);
    picture(context, time);
  };
}

function bannerWorld(beach: UrlaubValues, sunHeight: number): BannerWorldOptions {
  return {
    sunHeight, azimuth: beach.sunAzimuth, turbidity: beach.turbidity, seed: beach.worldSeed, cameraHeight: beach.cameraHeight,
    water: beach.waterColor, distortion: beach.waveDistortion, sand: beach.sand, rocks: beach.rocks,
    palms: { left: beach.palmsLeft, right: beach.palmsRight, sway: beach.palmSway, leaf: beach.palmLeaf, trunk: beach.palmTrunk },
  };
}

// values: resolved against the Urlaub schema; login for {login} in the texts
export function urlaubClips(values: SettingValues, login: string): RenderClip[] {
  const beach = values as unknown as UrlaubValues;
  const names = { channel: beach.channelName, login };
  const stinger: UrlaubStingerOptions = {
    duration: beach.stingerDuration, cut: beach.stingerCut, waves: beach.stingerWaves, foam: beach.stingerFoam, palm: beach.stingerPalm, spray: beach.stingerSpray,
    text: fillTemplate(beach.stingerText, names), font: beach.titleFont,
    sea: beach.sea, seaDeep: beach.seaDeep, foamColor: beach.foam, textColor: beach.textColor, palmColor: beach.woodDark,
  };
  const texts: UrlaubBannerOptions = {
    font: beach.font, titleFont: beach.titleFont, wood: beach.wood, woodDark: beach.woodDark, textColor: beach.textColor, textOnWood: beach.textOnWood,
    title: fillTemplate(beach.bannerTitle, names), profileText: beach.bannerProfileText,
    offlineTitle: beach.bannerOfflineTitle, offlineText: beach.bannerOfflineText, offlineLines: beach.bannerOfflineLines,
  };
  const day = bannerWorld(beach, beach.bannerSunHeight);
  const dusk = bannerWorld(beach, beach.bannerSunset);
  const font = `400 24px "${beach.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawUrlaubStinger(context, time, stinger) }, options),
    {
      name: "profile", feature: "banners", group: "Banner", font, ...PROFILE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.profileDraw(day, beach.exposure, texts), context => drawUrlaubProfileBanner(context, texts)),
    },
    {
      name: "offline", feature: "banners", group: "Banner", font, ...OFFLINE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.offlineDraw(dusk, beach.exposure, texts), context => drawUrlaubOfflineBanner(context, texts)),
    },
  ];
}
