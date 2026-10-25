// Renderable clips of the Urlaub theme (PLAN-URLAUB.md package 8): the stinger (group Stinger, the swell of stinger.ts
// with spray) and the profile banner (group Profilbanner) and the offline banner (group Offline-Banner) as the realistic beach by day and in the sunset with
// their texts. The 3D module loads only in prepare (clips3d.ts), so three.js stays out of the entry chunk; until then
// the banners draw only their texts. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { BannerWorldOptions } from "./bannerWorld.ts";
import { drawUrlaubOfflineBanner, drawUrlaubProfileBanner, OFFLINE_SIZE, PROFILE_SIZE, type UrlaubBannerLayout, type UrlaubBannerOptions } from "./banners.ts";
import type * as Clips3d from "./clips3d.ts";
import type { UrlaubValues } from "./settings.ts";
import { drawUrlaubStinger, HEIGHT, type UrlaubStingerLook, type UrlaubStingerOptions, WIDTH } from "./stinger.ts";

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

// The own colors of a banner's beach (settings, they follow the theme until set)
type BeachLook = { water: string; sand: string; leaf: string; trunk: string; ambient: { color: string; strength: number } };
const profileBeach = (beach: UrlaubValues): BeachLook => ({
  water: beach.profileWater, sand: beach.profileSand, leaf: beach.profilePalmLeaf, trunk: beach.profilePalmTrunk,
  ambient: { color: beach.profileAmbient, strength: beach.profileAmbientStrength },
});
const offlineBeach = (beach: UrlaubValues): BeachLook => ({
  water: beach.offlineWater, sand: beach.offlineSand, leaf: beach.offlinePalmLeaf, trunk: beach.offlinePalmTrunk,
  ambient: { color: beach.offlineAmbient, strength: beach.offlineAmbientStrength },
});

function bannerWorld(beach: UrlaubValues, sunHeight: number, look: BeachLook): BannerWorldOptions {
  return {
    sunHeight, azimuth: beach.sunAzimuth, turbidity: beach.turbidity, seed: beach.worldSeed, cameraHeight: beach.cameraHeight,
    water: look.water, distortion: beach.waveDistortion, sand: look.sand, rocks: beach.rocks, ambient: look.ambient,
    palms: { left: beach.palmsLeft, right: beach.palmsRight, sway: beach.palmSway, leaf: look.leaf, trunk: look.trunk },
  };
}

// The wave of the stinger (settings)
export const urlaubStingerLook = (beach: UrlaubValues): UrlaubStingerLook => ({
  scale: beach.stingerScale, rise: beach.stingerRise, reach: beach.stingerReach, layer: beach.stingerLayer, foamWidth: beach.stingerFoamWidth,
  ripple: { size: beach.stingerRippleSize, wave: beach.stingerRippleWave, speed: beach.stingerRippleSpeed },
  spray: { speed: [beach.stingerSpraySpeedMin, beach.stingerSpraySpeedMax], gravity: beach.stingerSprayGravity, life: beach.stingerSprayLife, size: beach.stingerSpraySize },
  face: beach.stingerFace, lean: beach.stingerLean, textSize: beach.stingerTextSize, shown: beach.stingerShown,
});

// Places and sizes of the banner texts and the offline sign (settings)
export const urlaubBannerLayout = (beach: UrlaubValues): UrlaubBannerLayout => ({
  profile: {
    titleSize: beach.profileTitleSize, titleY: beach.profileTitleY, textSize: beach.profileTextSize, textY: beach.profileTextY,
    shadowAlpha: beach.profileShadowAlpha, shadowBlur: beach.profileShadowBlur, shadowDrop: beach.profileShadowDrop,
  },
  offline: {
    x: beach.offlineSignX, y: beach.offlineSignY, width: beach.offlineSignWidth, height: beach.offlineSignHeight, border: beach.offlineSignBorder,
    titleSize: beach.offlineTitleSize, titleY: beach.offlineTitleY, textSize: beach.offlineTextSize, textY: beach.offlineTextY,
    lineSize: beach.offlineLineSize, lineY: beach.offlineLineY, lineStep: beach.offlineLineStep, lines: beach.offlineLines,
  },
});

// values: resolved against the Urlaub schema; login for {login} in the texts
export function urlaubClips(values: SettingValues, login: string): RenderClip[] {
  const beach = values as unknown as UrlaubValues;
  const names = { channel: beach.channelName, login };
  const stinger: UrlaubStingerOptions = {
    duration: beach.stingerDuration, cut: beach.stingerCut, waves: beach.stingerWaves, foam: beach.stingerFoam, palm: beach.stingerPalm, spray: beach.stingerSpray,
    text: fillTemplate(beach.stingerText, names), font: beach.stingerFont,
    sea: beach.stingerSea, seaDeep: beach.stingerSeaDeep, foamColor: beach.stingerFoamColor, textColor: beach.stingerTextColor, palmColor: beach.stingerPalmColor,
    look: urlaubStingerLook(beach),
  };
  const texts: UrlaubBannerOptions = {
    font: beach.profileFont, titleFont: beach.profileTitleFont, wood: beach.offlineWood, woodDark: beach.offlineWoodDark, textColor: beach.profileTextColor,
    textOnWood: beach.offlineTextColor, title: fillTemplate(beach.bannerTitle, names), profileText: beach.bannerProfileText,
    offlineTitle: beach.bannerOfflineTitle, offlineText: beach.bannerOfflineText, offlineLines: beach.bannerOfflineLines, layout: urlaubBannerLayout(beach),
  };
  // The offline banner has its own line with the channel and its own fonts
  const offlineTexts = { ...texts, title: fillTemplate(beach.bannerOfflineName, names), font: beach.offlineFont, titleFont: beach.offlineTitleFont };
  const day = bannerWorld(beach, beach.bannerSunHeight, profileBeach(beach));
  const dusk = bannerWorld(beach, beach.bannerSunset, offlineBeach(beach));
  const font = `400 24px "${beach.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawUrlaubStinger(context, time, stinger) }, options),
    {
      name: "profile", feature: "banners", group: "Profilbanner", font, ...PROFILE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.profileDraw(day, beach.exposure, texts), context => drawUrlaubProfileBanner(context, texts)),
    },
    {
      name: "offline", feature: "banners", group: "Offline-Banner", font, ...OFFLINE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.offlineDraw(dusk, beach.exposure, offlineTexts), context => drawUrlaubOfflineBanner(context, offlineTexts)),
    },
  ];
}

// Panel template of the Urlaub theme (panel designer): the sea as a gradient, a wooden plank with grain and the title in
// the title font on the wood
export function urlaubPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as UrlaubValues;
  const size = 30;
  return {
    height: PANEL_START_HEIGHT, background: look.seaDeep,
    layers: [
      rectLayer("sea", 0, 0, PANEL_WIDTH, PANEL_START_HEIGHT, look.sea, { fill2: look.seaDeep }),
      rectLayer("plank", 14, 16, PANEL_WIDTH - 28, PANEL_START_HEIGHT - 32, look.wood, { radius: 10, stroke: look.woodDark, strokeWidth: 3 }),
      rectLayer("grain", 26, 34, PANEL_WIDTH - 52, 2, look.woodDark, { opacity: 0.35 }),
      rectLayer("grain2", 40, 66, PANEL_WIDTH - 90, 2, look.woodDark, { opacity: 0.35 }),
      textLayer("title", 20, centeredTop(size) - 2, PANEL_WIDTH - 40, title, look.titleFont, size, look.textOnWood, { weight: 400 }),
    ],
  };
}
