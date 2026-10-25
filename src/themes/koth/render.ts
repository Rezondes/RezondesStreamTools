// Renderable clips of the KOTH theme (PLAN-KOTH.md package 5): the stinger in 3D (a smoke grenade covers the picture,
// the flag changes from the first faction to the second) and the profile and offline banners as the 3D hill with their
// texts. The 3D module loads only in prepare (clips3d.ts), so three.js stays out of the entry chunk; until then the
// stinger draws its smoke cover flat and the banners only their texts. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import { minimeTeamColorKey } from "../../core/minimeFields.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { BannerLens, BannerWorldOptions } from "./bannerWorld.ts";
import { type BannerLayout, drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions, OFFLINE_SIZE, PROFILE_SIZE } from "./banners.ts";
import type * as Clips3d from "./clips3d.ts";
import { TEAM_SET, type KothValues } from "./settings.ts";
import { type SmokeLook, smokeCover } from "./smokeStinger.ts";
import type { KothStingerOptions, StingerLook } from "./stinger.ts";

// A banner is one picture (the dashboard renders its first frame)
const STILL = { duration: 1, fps: 1 };

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// The 3D draw functions, loaded once by prepare
let parts: typeof Clips3d | null = null;
const prepare = async () => { parts ??= await import("./clips3d.ts"); };
// The 3D picture once prepare has loaded the 3D part, the flat stand-in before
function clipDraw(build: (loaded: typeof Clips3d) => Draw, standIn: Draw): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) return standIn(context, time);
    picture ??= build(parts);
    picture(context, time);
  };
}

// The own colors and lens of a banner (settings with the prefix profile or offline, they follow the theme until set)
type BannerLook = {
  sky: { top: string; horizon: string }; light: string; sand: string; hill: string; shade: string; mountain: string; steel: string; lens: BannerLens;
};

const profileLook = (koth: KothValues): BannerLook => ({
    sky: { top: koth.profileSkyTop, horizon: koth.profileSkyHorizon }, light: koth.profileLightColor, sand: koth.profileSandColor, hill: koth.profileHillColor,
    shade: koth.profileShadeColor, mountain: koth.profileMountainColor, steel: koth.profileSteelColor,
    lens: {
      fov: koth.profileFov, turn: koth.profileTurn, ambient: koth.profileAmbient, sun: koth.profileSun, fogNear: koth.profileFogNear, fogFar: koth.profileFogFar,
      fogMix: koth.profileFogMix, flag: [koth.profileFlagWidth, koth.profileFlagHeight],
    },
});
const offlineLook = (koth: KothValues): BannerLook => ({
    sky: { top: koth.offlineSkyTop, horizon: koth.offlineSkyHorizon }, light: koth.offlineLightColor, sand: koth.offlineSandColor, hill: koth.offlineHillColor,
    shade: koth.offlineShadeColor, mountain: koth.offlineMountainColor, steel: koth.offlineSteelColor,
    lens: {
      fov: koth.offlineFov, turn: koth.offlineTurn, ambient: koth.offlineAmbient, sun: koth.offlineSun, fogNear: koth.offlineFogNear, fogFar: koth.offlineFogFar,
      fogMix: koth.offlineFogMix, flag: [koth.offlineFlagWidth, koth.offlineFlagHeight],
    },
});

function bannerWorld(koth: KothValues, look: BannerLook, flag: string): BannerWorldOptions {
  return {
    seed: koth.worldSeed, hillHeight: koth.hillHeight, mastHeight: koth.mastHeight, trees: koth.trees, rocks: koth.rocks,
    radius: koth.cameraRadius, height: koth.cameraHeight, sky: look.sky, light: look.light, lens: look.lens,
    colors: { sand: look.sand, hill: look.hill, shade: look.shade, mountain: look.mountain, steel: look.steel, pine: look.shade, rock: look.mountain, flag },
  };
}

// The stinger scene and its cloud of the settings
export const kothStingerLook = (koth: KothValues): StingerLook => ({
  fov: koth.stingerFov, ambient: koth.stingerAmbient, sun: koth.stingerSun,
  cloth: { width: koth.stingerClothWidth, height: koth.stingerClothHeight, wind: koth.stingerWind },
  text: { y: koth.stingerTextY, width: koth.stingerTextWidth, height: koth.stingerTextHeight }, shown: koth.stingerShown,
});
export const kothStingerCloud = (koth: KothValues): SmokeLook => ({
  pop: koth.stingerPop, rollFrom: koth.stingerRollFrom, speed: [koth.stingerSpeedMin, koth.stingerSpeedMax], gravity: koth.stingerGravity,
  drag: koth.stingerDrag, depth: koth.stingerDepth, grow: koth.stingerGrow, size: koth.stingerPuffSize,
});

// Sizes and places of the banner texts (settings)
export const kothBannerLayout = (koth: KothValues): BannerLayout => ({
  profile: {
    titleSize: koth.profileTitleSize, titleX: koth.profileTitleX, titleY: koth.profileTitleY, textSize: koth.profileTextSize, textX: koth.profileTextX,
    textY: koth.profileTextY, shadowAlpha: koth.profileShadowAlpha, shadowBlur: koth.profileShadowBlur,
  },
  offline: {
    x: koth.offlineSheetX, y: koth.offlineSheetY, turn: koth.offlineSheetTurn, width: koth.offlineSheetWidth, height: koth.offlineSheetHeight,
    titleSize: koth.offlineTitleSize, titleY: koth.offlineTitleY, textSize: koth.offlineTextSize, textY: koth.offlineTextY,
    linesSize: koth.offlineLinesSize, linesY: koth.offlineLinesY, linesStep: koth.offlineLinesStep, linesMax: koth.offlineLinesMax,
  },
});

// values: resolved against the KOTH schema; login for {login} in the texts
export function kothClips(values: SettingValues, login: string): RenderClip[] {
  const koth = values as unknown as KothValues;
  const names = { channel: koth.channelName, login };
  const [first, second] = TEAM_SET.variants.map(team => values[minimeTeamColorKey(team.id)] as string);
  const stinger: KothStingerOptions = {
    duration: koth.stingerDuration, cut: koth.stingerCut, flag: koth.stingerFlag, smoke: koth.stingerSmoke, flags: [first, second],
    pole: koth.stingerPole, grenade: koth.stingerGrenade, puffs: koth.stingerPuffs, seed: koth.worldSeed, look: kothStingerLook(koth), cloud: kothStingerCloud(koth),
  };
  const label = { text: fillTemplate(koth.stingerText, names), font: koth.stingerFont, color: koth.stingerTextColor, size: koth.stingerTextSize };
  const texts: KothBannerOptions = {
    font: koth.profileFont, titleFont: koth.profileTitleFont, paper: koth.offlinePaper, ink: koth.offlineInk, textColor: koth.profileTextColor,
    title: fillTemplate(koth.bannerTitle, names), profileText: koth.bannerProfileText,
    offlineTitle: koth.bannerOfflineTitle, offlineText: koth.bannerOfflineText, offlineLines: koth.bannerOfflineLines, layout: kothBannerLayout(koth),
  };
  // The offline banner has its own line with the channel and its own fonts
  const offlineTexts = { ...texts, title: fillTemplate(koth.bannerOfflineName, names), font: koth.offlineFont, titleFont: koth.offlineTitleFont };
  const flag = values[minimeTeamColorKey(koth.flagFaction)] as string;
  const day = bannerWorld(koth, profileLook(koth), flag);
  const dusk = bannerWorld(koth, offlineLook(koth), flag);
  const font = `400 24px "${koth.titleFont}"`;
  const options = readStingerOptions(values);
  const coverOnly: Draw = (context, time) => {
    context.clearRect(0, 0, OFFLINE_SIZE.width, OFFLINE_SIZE.height);
    context.globalAlpha = smokeCover(time, stinger);
    context.fillStyle = stinger.smoke;
    context.fillRect(0, 0, OFFLINE_SIZE.width, OFFLINE_SIZE.height);
    context.globalAlpha = 1;
  };
  return [
    withStingerOptions({
      name: "stinger", feature: "stinger", group: "Stinger", font, ...OFFLINE_SIZE, fps: options.fps, duration: stinger.duration, cut: stinger.cut, prepare,
      draw: clipDraw(loaded => loaded.stingerDraw(stinger, label, options.fps), coverOnly),
    }, options),
    {
      name: "profile", feature: "banners", group: "Profilbanner", font, ...PROFILE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.profileDraw(day, texts), context => drawKothProfileBanner(context, texts)),
    },
    {
      name: "offline", feature: "banners", group: "Offline-Banner", font, ...OFFLINE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.offlineDraw(dusk, offlineTexts), context => drawKothOfflineBanner(context, offlineTexts)),
    },
  ];
}

// Panel template of the KOTH theme (panel designer): an olive metal plate with warning stripes on top, rivets in the
// corners and the title stenciled in the title font
export function kothPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as KothValues;
  const size = 28;
  const rivet = (id: string, x: number, y: number) => rectLayer(id, x, y, 6, 6, look.sandDark, { radius: 3 });
  return {
    height: PANEL_START_HEIGHT, background: look.oliveDark,
    layers: [
      rectLayer("plate", 10, 10, PANEL_WIDTH - 20, PANEL_START_HEIGHT - 20, look.olive, { fill2: look.oliveDark, radius: 4, stroke: look.sandDark, strokeWidth: 2 }),
      rectLayer("stripes", 10, 10, PANEL_WIDTH - 20, 7, look.accent, { radius: 2 }),
      rivet("rivet1", 18, 24), rivet("rivet2", PANEL_WIDTH - 24, 24), rivet("rivet3", 18, PANEL_START_HEIGHT - 24), rivet("rivet4", PANEL_WIDTH - 24, PANEL_START_HEIGHT - 24),
      textLayer("title", 30, centeredTop(size) + 3, PANEL_WIDTH - 60, title.toUpperCase(), look.titleFont, size, look.textColor, { weight: 400 }),
    ],
  };
}
