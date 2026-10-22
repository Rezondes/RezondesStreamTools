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
import type { BannerWorldOptions } from "./bannerWorld.ts";
import { drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions, OFFLINE_SIZE, PROFILE_SIZE } from "./banners.ts";
import type * as Clips3d from "./clips3d.ts";
import { TEAM_SET, type KothValues } from "./settings.ts";
import { smokeCover } from "./smokeStinger.ts";
import type { KothStingerOptions } from "./stinger.ts";

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

function bannerWorld(koth: KothValues, sky: { top: string; horizon: string }, flag: string): BannerWorldOptions {
  return {
    seed: koth.worldSeed, hillHeight: koth.hillHeight, mastHeight: koth.mastHeight, trees: koth.trees, rocks: koth.rocks,
    radius: koth.cameraRadius, height: koth.cameraHeight, sky, light: koth.sunColor,
    colors: { sand: koth.sandColor, hill: koth.hillColor, shade: koth.hillDark, mountain: koth.mountainColor, steel: koth.steel, pine: koth.hillDark, rock: koth.mountainColor, flag },
  };
}

// values: resolved against the KOTH schema; login for {login} in the texts
export function kothClips(values: SettingValues, login: string): RenderClip[] {
  const koth = values as unknown as KothValues;
  const names = { channel: koth.channelName, login };
  const [first, second] = TEAM_SET.variants.map(team => values[minimeTeamColorKey(team.id)] as string);
  const stinger: KothStingerOptions = {
    duration: koth.stingerDuration, cut: koth.stingerCut, flag: koth.stingerFlag, smoke: koth.smokeColor, flags: [first, second],
    pole: koth.steel, grenade: koth.olive, puffs: koth.stingerPuffs, seed: koth.worldSeed,
  };
  const label = { text: fillTemplate(koth.stingerText, names), font: koth.titleFont, color: koth.textColor };
  const texts: KothBannerOptions = {
    font: koth.font, titleFont: koth.titleFont, paper: koth.paper, ink: koth.ink, textColor: koth.textColor,
    title: fillTemplate(koth.bannerTitle, names), profileText: koth.bannerProfileText,
    offlineTitle: koth.bannerOfflineTitle, offlineText: koth.bannerOfflineText, offlineLines: koth.bannerOfflineLines,
  };
  const flag = values[minimeTeamColorKey(koth.flagFaction)] as string;
  const day = bannerWorld(koth, { top: koth.skyTop, horizon: koth.skyHorizon }, flag);
  const dusk = bannerWorld(koth, { top: koth.endingSkyTop, horizon: koth.endingSkyHorizon }, flag);
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
      name: "profile", feature: "banners", group: "Banner", font, ...PROFILE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.profileDraw(day, texts), context => drawKothProfileBanner(context, texts)),
    },
    {
      name: "offline", feature: "banners", group: "Banner", font, ...OFFLINE_SIZE, ...STILL, cut: null, prepare,
      draw: clipDraw(loaded => loaded.offlineDraw(dusk, texts), context => drawKothOfflineBanner(context, texts)),
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
