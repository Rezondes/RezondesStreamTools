// Renderable clips of the Bärenbande theme: stinger (group Stinger) and profile banner (group Profilbanner) and offline banner (group Offline-Banner), drawn
// from the character model with the resolved settings. The banners paint their world as watercolor; Rough.js loads
// only in prepare (clipWorld.ts), so it stays out of the entry chunk, until then the world is flat. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import { mixHex } from "../../core/color.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawBearsOfflineBanner, drawBearsProfileBanner, type BearsBannerOptions, type WorldPainter } from "./banners.ts";
import type * as ClipWorld from "./clipWorld.ts";
import type { Palette, WorldColors } from "./paint.ts";
import type { BearsValues } from "./settings.ts";
import { drawBearsStinger, HEIGHT, WIDTH, type BearsStingerOptions } from "./stinger.ts";
import type { TimeOfDay } from "./world.ts";

// Banners are one picture (the dashboard saves their first frame as a PNG); duration and frame rate only fill the clip
const STILL = 1;

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// The watercolor world, loaded once by prepare
let clipWorld: typeof ClipWorld | null = null;
const prepare = async () => { clipWorld ??= await import("./clipWorld.ts"); };
// The picture with the watercolor world once prepare has loaded it, with the flat world before; each built once
function clipDraw(build: (world?: WorldPainter) => Draw, painter: (loaded: typeof ClipWorld) => WorldPainter): Draw {
  let [flat, painted]: (Draw | null)[] = [null, null];
  return (context, time) => {
    if (clipWorld) (painted ??= build(painter(clipWorld)))(context, time);
    else (flat ??= build())(context, time);
  };
}

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

// fixed: how far the land takes on the color of the upper sky per time of day (morning haze, evening light, night)
export const DUSK: Record<TimeOfDay, number> = { morgen: 0.06, mittag: 0, abend: 0.14, nacht: 0.42 };
// The surfaces of the land that take on the light of the time of day (the sky, the light and the clouds keep theirs)
const LIT = ["hills", "city", "cityWindow", "water", "bridge", "meadow", "meadowDark", "road", "wood", "treeLeaf", "fir", "firDark", "cave", "caveDark", "flower"] as const;

// The world colors of a time of day: its sky, sun or moon, and the land mixed toward the upper sky by its dusk
export function worldAt(field: BearsValues, time: TimeOfDay): WorldColors {
  const [top, bottom] = {
    morgen: [field.skyMorningTop, field.skyMorningBottom], mittag: [field.skyDayTop, field.skyDayBottom],
    abend: [field.skyEveningTop, field.skyEveningBottom], nacht: [field.skyNightTop, field.skyNightBottom],
  }[time];
  const colors = worldOf(field, top, bottom, time === "nacht" ? field.moon : field.sun);
  for (const surface of LIT) colors[surface] = mixHex(colors[surface], top, DUSK[time]);
  return colors;
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
    font: field.font, titleFont: field.titleFont, palette,
    day: worldAt(field, "mittag"),
    evening: worldAt(field, "abend"),
    profileBear: field.bannerProfileBear, offlineBear: field.bannerOfflineBear, title: fillTemplate(field.bannerTitle, names),
    profileText: field.bannerProfileText, offlineTitle: field.bannerOfflineTitle, offlineText: field.bannerOfflineText,
    offlineLines: field.bannerOfflineLines, lights: field.fairyLights, lightColors: [field.accent, field.sun, field.accent2],
    textDark: field.textDark, textDim: field.textDim, paperShade: field.paperShade, sleepText: field.bannerSleepText,
  };
  const look = { seed: field.worldSeed, layers: field.washLayers, alpha: field.washAlpha, roughness: field.washRoughness, sketch: field.sketchLines, grain: 0 };
  const show = { city: field.showCity, bridge: field.showBridge, cave: field.showCave, flowers: field.flowers };
  const painter = (loaded: typeof ClipWorld) => loaded.watercolorWorld(look, show);
  const font = `800 24px "${field.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawBearsStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Profilbanner", font, width: 1200, height: 480, fps: STILL, duration: STILL, cut: null, prepare, draw: clipDraw(world => context => drawBearsProfileBanner(context, { ...banner, world }), painter) },
    { name: "offline", feature: "banners", group: "Offline-Banner", font, width: 1920, height: 1080, fps: STILL, duration: STILL, cut: null, prepare, draw: clipDraw(world => context => drawBearsOfflineBanner(context, { ...banner, title: fillTemplate(field.bannerOfflineName, names), world }), painter) },
  ];
}

// Panel template of the Bärenbande theme (panel designer): a paper card with the shade band and the outline on the
// sky, the title in the title font
export function bearsPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as BearsValues;
  const size = 30;
  const card = { radius: 22 };
  return {
    height: PANEL_START_HEIGHT, background: look.accent2,
    layers: [
      rectLayer("shade", 10, 12, PANEL_WIDTH - 20, PANEL_START_HEIGHT - 24, look.paperShade, card),
      rectLayer("paper", 10, 12, PANEL_WIDTH - 20, PANEL_START_HEIGHT - 32, look.paper, card),
      rectLayer("outline", 10, 12, PANEL_WIDTH - 20, PANEL_START_HEIGHT - 24, "transparent", { ...card, stroke: look.outline, strokeWidth: 3 }),
      textLayer("title", 24, centeredTop(size) - 3, PANEL_WIDTH - 48, title, look.titleFont, size, look.textDark, { weight: 800 }),
    ],
  };
}
