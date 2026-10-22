// Renderable clips of the Plantage theme: stinger (group Stinger) and profile and offline banners (group Banner),
// drawn with the resolved settings. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawPlantageOfflineBanner, drawPlantageProfileBanner, type PlantageBannerOptions } from "./banners.ts";
import type { PaintOptions } from "./paint.ts";
import type { PlantageValues } from "./settings.ts";
import { drawPlantageStinger, HEIGHT, WIDTH, type PlantageStingerOptions } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame); the loop only scales the time inside the drawing
const BANNER_LOOP = 6;
const BANNER_FPS = 1;

// The world of the scenes for a banner: day or evening sky, the world settings, the channel name on the crate
function paintOf(field: PlantageValues, sky: [string, string], label: string): PaintOptions {
  return {
    colors: {
      skyTop: sky[0], skyBottom: sky[1], sky: sky[1], sun: field.sun, hill: field.hillColor, hillFar: field.hillFarColor, soil: field.soil, soilDark: field.soilDark,
      grass: field.accent2, cloud: field.paper, wood: field.wood, woodDark: field.woodDark, trunk: field.trunk, trunkDark: field.woodDark,
      leafDark: field.leafDark, leaf: field.leaf, leafLight: field.accent2, mango: field.mango, mangoBlush: field.mangoBlush, gloss: field.paper, shadow: field.textOnWood,
    },
    seed: field.worldSeed, treeRowsFar: field.treeRowsFar, treeRowsMid: field.treeRowsMid, farBlur: field.farBlur, hazeFar: field.hazeFar / 100,
    sway: field.swayAmount, loop: BANNER_LOOP, label: field.crates && field.crateName ? label : "", labelFont: field.titleFont,
  };
}

// values: resolved against the Plantage schema; login for {login} in the texts
export function plantageClips(values: SettingValues, login: string): RenderClip[] {
  const field = values as unknown as PlantageValues;
  const names = { channel: field.channelName, login };
  const stinger: PlantageStingerOptions = {
    duration: field.stingerDuration, cut: field.stingerCut, leaves: field.stingerLeaves, leafCount: field.stingerLeafCount, seed: field.worldSeed,
    text: fillTemplate(field.stingerText, names), font: field.titleFont,
    mango: field.mango, blush: field.mangoBlush, leaf: field.leaf, leafDark: field.leafDark, paper: field.paper, shadow: field.soilDark,
    textColor: field.textColor,
  };
  const label = field.channelName.toUpperCase();
  const banner: PlantageBannerOptions = {
    loop: BANNER_LOOP, font: field.font, titleFont: field.titleFont, textColor: field.textColor, textOnWood: field.textOnWood, paper: field.paper, shadow: field.soilDark,
    day: paintOf(field, [field.skyDayTop, field.skyDayBottom], label), evening: paintOf(field, [field.skyEveningTop, field.skyEveningBottom], label),
    title: fillTemplate(field.bannerTitle, names), profileText: field.bannerProfileText,
    offlineTitle: field.bannerOfflineTitle, offlineText: field.bannerOfflineText, offlineLines: field.bannerOfflineLines,
  };
  const font = `700 24px "${field.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawPlantageStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawPlantageProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawPlantageOfflineBanner(context, time, banner) },
  ];
}

// Panel template of the Plantage theme (panel designer): leaves as a gradient, a slightly tilted harvest slip with a
// mango in the corner and the title in the title font
export function plantagePanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as PlantageValues;
  const size = 30;
  return {
    height: PANEL_START_HEIGHT, background: look.leafDark,
    layers: [
      rectLayer("leaves", 0, 0, PANEL_WIDTH, PANEL_START_HEIGHT, look.leaf, { fill2: look.leafDark }),
      rectLayer("slip", 22, 16, PANEL_WIDTH - 44, PANEL_START_HEIGHT - 32, look.paper, { radius: 8, stroke: look.woodDark, strokeWidth: 2, rotate: -1.5 }),
      rectLayer("mango", PANEL_WIDTH - 46, 8, 28, 28, look.mango, { fill2: look.mangoBlush, radius: 14 }),
      textLayer("title", 30, centeredTop(size) - 2, PANEL_WIDTH - 60, title, look.titleFont, size, look.textOnWood, { rotate: -1.5 }),
    ],
  };
}
