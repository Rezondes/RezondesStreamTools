// Renderable clips of the Bärenbande theme: stinger (group Stinger) and profile and offline banners (group Banner), drawn
// from the character model with the resolved settings. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawBearsOfflineBanner, drawBearsProfileBanner, type BearsBannerOptions } from "./banners.ts";
import type { Palette, WorldColors } from "./paint.ts";
import type { BearsValues } from "./settings.ts";
import { drawBearsStinger, FPS, HEIGHT, WIDTH, type BearsStingerOptions } from "./stinger.ts";

// The colors of the bears and their things from the settings
export function paletteOf(field: BearsValues): Palette {
  return {
    outline: field.outline, outlineWidth: field.outlineWidth,
    bears: {
      eisbaer: { fur: field.iceFur, shade: field.iceShade, limb: field.iceFur },
      grizzly: { fur: field.grizzlyFur, shade: field.grizzlyShade, limb: field.grizzlyFur },
      panda: { fur: field.pandaFur, shade: field.pandaShade, limb: field.pandaPatch },
    },
    patch: field.pandaPatch, patchShade: field.pandaPatchShade, eye: field.bearEye, nose: field.bearNose, mouth: field.grizzlyMouth,
    tongue: field.grizzlyTongue, teeth: field.bearTeeth, phoneCase: field.phoneCase, phoneScreen: field.phoneScreen, prop: field.prop,
    food: field.food, paper: field.paper, headphones: field.accent2,
  };
}

// The world colors for a sky
export function worldOf(field: BearsValues, skyTop: string, skyBottom: string, light: string): WorldColors {
  return {
    skyTop, skyBottom, light, cloud: field.cloud, hills: field.hills, city: field.city, cityWindow: field.cityWindow, water: field.water,
    bridge: field.bridge, meadow: field.meadow, meadowDark: field.meadowDark, road: field.road, wood: field.wood, treeLeaf: field.treeLeaf,
    fir: field.fir, firDark: field.firDark, cave: field.cave, caveDark: field.caveDark, flower: field.flower, outline: field.outline,
    sketch: field.sketchLines,
  };
}

// values: resolved against the Bärenbande schema; login for {login} in the texts
export function bearsClips(values: SettingValues, login: string): RenderClip[] {
  const field = values as unknown as BearsValues;
  const names = { channel: field.channelName, login };
  const palette = paletteOf(field);
  const stinger: BearsStingerOptions = {
    duration: field.stingerDuration, cut: field.stingerCut, bear: field.stingerBear, text: fillTemplate(field.stingerText, names),
    font: field.titleFont, waddle: field.stingerWaddle, palette, from: field.stingerFrom, open: field.stingerOpen,
    curtain: { color: field.stingerCurtain, shade: field.stingerCurtainShade, pattern: field.stingerCurtainPattern, folds: field.stingerFolds },
  };
  const banner: BearsBannerOptions = {
    loop: field.bannerLoop, font: field.font, titleFont: field.titleFont, palette,
    day: worldOf(field, field.skyDayTop, field.skyDayBottom, field.sun),
    evening: worldOf(field, field.skyEveningTop, field.skyEveningBottom, field.sun),
    profileBear: field.bannerProfileBear, offlineBear: field.bannerOfflineBear, title: fillTemplate(field.bannerTitle, names),
    profileText: field.bannerProfileText, offlineTitle: field.bannerOfflineTitle, offlineText: field.bannerOfflineText,
    offlineLines: field.bannerOfflineLines, lights: field.fairyLights, lightColors: [field.accent, field.sun, field.accent2],
    textDark: field.textDark, textDim: field.textDim, paperShade: field.paperShade, sleepText: field.bannerSleepText,
  };
  const font = `800 24px "${field.titleFont}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawBearsStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: field.bannerProfileFps, duration: banner.loop, cut: null, draw: (context, time) => drawBearsProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: field.bannerOfflineFps, duration: banner.loop, cut: null, draw: (context, time) => drawBearsOfflineBanner(context, time, banner) },
  ];
}
