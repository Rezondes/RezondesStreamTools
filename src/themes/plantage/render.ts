// Renderable clips of the Plantage theme: stinger (group Stinger) and profile banner (group Profilbanner) and offline banner (group Offline-Banner),
// drawn with the resolved settings. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawPlantageOfflineBanner, drawPlantageProfileBanner, type PlantageBannerLayout, type PlantageBannerOptions } from "./banners.ts";
import type { PaintOptions } from "./paint.ts";
import type { PlantageValues } from "./settings.ts";
import { drawPlantageStinger, HEIGHT, type PlantageStingerLook, type PlantageStingerOptions, WIDTH } from "./stinger.ts";

// Banners are one picture (the dashboard saves their first frame as a PNG); duration and frame rate only fill the clip
const STILL = 1;

// The motion of the stinger (settings)
export const plantageStingerLook = (field: PlantageValues): PlantageStingerLook => ({
  startRadius: field.stingerStartRadius, coverRadius: field.stingerCoverRadius,
  whirl: { lead: field.stingerWhirlLead, speed: [field.stingerWhirlSpeedMin, field.stingerWhirlSpeedMax], gravity: field.stingerWhirlGravity, drag: field.stingerWhirlDrag, life: field.stingerWhirlLife },
  leafMin: field.stingerLeafMin, leafRange: field.stingerLeafRange, gloss: field.stingerGlossAlpha, textSize: field.stingerTextSize, textBlur: field.stingerTextBlur,
  textLift: field.stingerTextLift, shown: field.stingerShown,
});

// Places and sizes of the banner texts and the offline card (settings)
export const plantageBannerLayout = (field: PlantageValues): PlantageBannerLayout => ({
  profile: { title: field.profileTitleY, text: field.profileTextY, titleSize: field.profileTitleSize, textSize: field.profileTextSize, glow: field.profileGlow },
  offline: {
    title: field.offlineTitleY, text: field.offlineTextY, line: field.offlineLineY, lineStep: field.offlineLineStep, titleSize: field.offlineTitleSize,
    textSize: field.offlineTextSize, lineSize: field.offlineLineSize, lines: field.offlineLines,
  },
  card: {
    left: field.offlineCardLeft, top: field.offlineCardTop, width: field.offlineCardWidth, height: field.offlineCardHeight, round: field.offlineCardRound,
    alpha: field.offlineCardAlpha, blur: field.offlineCardBlur, lift: field.offlineCardLift, inset: field.offlineCardInset,
  },
});

// The world of the scenes for a banner: its own sky and sun, the world settings, the channel name on the crate
function paintOf(field: PlantageValues, sky: [string, string], sun: string, label: string): PaintOptions {
  return {
    colors: {
      skyTop: sky[0], skyBottom: sky[1], sky: sky[1], sun, hill: field.hillColor, hillFar: field.hillFarColor, soil: field.soil, soilDark: field.soilDark,
      grass: field.accent2, cloud: field.paper, wood: field.wood, woodDark: field.woodDark, trunk: field.trunk, trunkDark: field.woodDark,
      leafDark: field.leafDark, leaf: field.leaf, leafLight: field.accent2, mango: field.mango, mangoBlush: field.mangoBlush, gloss: field.paper, shadow: field.textOnWood,
    },
    seed: field.worldSeed, treeRowsFar: field.treeRowsFar, treeRowsMid: field.treeRowsMid, farBlur: field.farBlur, hazeFar: field.hazeFar / 100,
    sway: field.swayAmount, label: field.crates && field.crateName ? label : "", labelFont: field.titleFont,
  };
}

// values: resolved against the Plantage schema; login for {login} in the texts
export function plantageClips(values: SettingValues, login: string): RenderClip[] {
  const field = values as unknown as PlantageValues;
  const names = { channel: field.channelName, login };
  const stinger: PlantageStingerOptions = {
    duration: field.stingerDuration, cut: field.stingerCut, leaves: field.stingerLeaves, leafCount: field.stingerLeafCount, seed: field.worldSeed,
    text: fillTemplate(field.stingerText, names), font: field.stingerFont,
    mango: field.stingerMango, blush: field.stingerBlush, leaf: field.stingerLeaf, leafDark: field.stingerLeafDark, paper: field.stingerGloss, shadow: field.stingerShadow,
    textColor: field.stingerTextColor, look: plantageStingerLook(field),
  };
  const label = field.channelName.toUpperCase();
  const banner: PlantageBannerOptions = {
    font: field.profileFont, titleFont: field.profileTitleFont, textColor: field.profileTextColor, textOnWood: field.offlineTextColor, paper: field.offlinePaper, shadow: field.profileShadow,
    day: paintOf(field, [field.profileSkyTop, field.profileSkyBottom], field.profileSun, label),
    evening: paintOf(field, [field.offlineSkyTop, field.offlineSkyBottom], field.offlineSun, label),
    title: fillTemplate(field.bannerTitle, names), profileText: field.bannerProfileText,
    offlineTitle: field.bannerOfflineTitle, offlineText: field.bannerOfflineText, offlineLines: field.bannerOfflineLines, layout: plantageBannerLayout(field),
  };
  // The offline banner has its own fonts and card shadow
  const offline = { ...banner, title: fillTemplate(field.bannerOfflineName, names), font: field.offlineFont, titleFont: field.offlineTitleFont, shadow: field.offlineShadow };
  const font = `700 24px "${field.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawPlantageStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Profilbanner", font, width: 1200, height: 480, fps: STILL, duration: STILL, cut: null, draw: context => drawPlantageProfileBanner(context, banner) },
    { name: "offline", feature: "banners", group: "Offline-Banner", font, width: 1920, height: 1080, fps: STILL, duration: STILL, cut: null, draw: context => drawPlantageOfflineBanner(context, offline) },
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
