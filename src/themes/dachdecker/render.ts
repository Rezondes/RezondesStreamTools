// Renderable clips of the Dachdecker theme: the stinger (group Stinger) in 3D, a blueprint that rolls out and up with
// its printed drawing, and the profile and offline banners (group Banner) as still pictures in 2D, with the resolved
// settings. The 3D module loads only in prepare (clips3d.ts), so three.js stays out of the entry chunk. Check:
// render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { type BannerOptions, drawOffline, drawProfile } from "./banners.ts";
import { coverage, STINGER_SIZE } from "./roll.ts";
import type { DachdeckerValues } from "./settings.ts";
import type { SheetOptions } from "./sheet.ts";
import type { StingerOptions } from "./stinger.ts";
import type * as Clips3d from "./clips3d.ts";

export { STINGER_SIZE };
// Banners are one picture (the dashboard renders their first frame); duration and frame rate only fill the clip
export const PROFILE_SIZE = { width: 1200, height: 480, fps: 1 };
export const OFFLINE_SIZE = { width: 1920, height: 1080, fps: 1 };
const STILL = 1;
const PERCENT = 100;

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// The 3D draw function, loaded once by prepare
let parts: typeof Clips3d | null = null;
const prepare = async () => { parts ??= await import("./clips3d.ts"); };
// The stinger draws its 3D picture (built on the first frame after prepare); until prepare has loaded the 3D part it
// draws the flat stand-in (the covered share of the sheet as an area)
function clipDraw(build: (loaded: typeof Clips3d) => Draw, standIn: Draw): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) {
      context.clearRect(0, 0, STINGER_SIZE.width, STINGER_SIZE.height);
      standIn(context, time);
      return;
    }
    picture ??= build(parts);
    picture(context, time);
  };
}

export function dachdeckerClips(settings: SettingValues, login: string): RenderClip[] {
  const values = settings as unknown as DachdeckerValues;
  const names = { channel: values.channelName, login };
  const fill = (text: string) => fillTemplate(text, names);
  const stinger: StingerOptions = {
    duration: values.stingerDuration, cut: values.stingerCut, hold: values.stingerHold / PERCENT, roll: values.stingerRollSize, fps: values.stingerFps,
    blueprint: values.blueprint, line: values.line, copper: values.copper, shadow: values.page,
  };
  const sheet: SheetOptions = {
    ...STINGER_SIZE, grid: values.stingerGrid, font: values.font,
    colors: { blueprint: values.blueprint, line: values.line, accent: values.accent, copper: values.copper, muted: values.muted, brick: values.brick },
    title: fill(values.stingerText), subtitle: fill(values.stingerSubtitle), block: values.stingerBlockLines.map(fill), notes: values.stingerNotes.map(fill),
    stamp: fill(values.stingerStamp), span: values.span, rise: values.rise,
  };
  const banner = (size: { width: number; height: number }): BannerOptions => ({
    width: size.width, height: size.height, loop: STILL, font: values.font, fontSize: values.fontSize, alertWidth: values.alertWidth,
    grid: values.bannerGrid, glow: values.glow, rain: values.bannerRain, drops: values.bannerRainCount, seed: values.seed,
    colors: { blueprint: values.blueprint, page: values.page, accent: values.accent, copper: values.copper, line: values.line, rainColor: values.rain },
  });
  const profile = banner(PROFILE_SIZE);
  const offline = banner(OFFLINE_SIZE);
  const font = `700 24px "${values.font}"`;
  // The roll draws the hold itself (roll.ts), so the core only takes frame rate, curve and size
  return [
    withStingerOptions({
      name: "stinger", feature: "stinger", group: "Stinger", font, ...STINGER_SIZE, fps: stinger.fps, duration: stinger.duration, cut: stinger.cut, prepare,
      draw: clipDraw(loaded => loaded.stingerDraw(stinger, sheet), (context, time) => {
        context.fillStyle = values.blueprint;
        context.fillRect(0, 0, STINGER_SIZE.width * coverage(time, stinger), STINGER_SIZE.height);
      }),
    }, { ...readStingerOptions(settings), ownHold: true }),
    {
      name: "profile", feature: "banners", group: "Banner", font, ...PROFILE_SIZE, duration: STILL, cut: null,
      draw: (context, time) => drawProfile(context, time, profile, {
        dim: fill(values.profileOverline), tag: fill(values.profileTag), title: fill(values.profileTitle), line: fill(values.profileSubtitle),
      }),
    },
    {
      name: "offline", feature: "banners", group: "Banner", font, ...OFFLINE_SIZE, duration: STILL, cut: null,
      draw: (context, time) => drawOffline(context, time, offline, {
        dim: fill(values.offlineOverline), tag: fill(values.offlineTag), title: fill(values.offlineText), line: fill(values.offlineSubtitle),
      }),
    },
  ];
}

// Panel template of the Dachdecker theme (panel designer): a blueprint with a faint grid, a thin plan frame, the title
// in the mono font and a small sheet label in the corner
export function dachdeckerPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as DachdeckerValues;
  const size = 24;
  const grid = { opacity: 0.12 };
  const columns = [40, 80, 120, 160, 200, 240, 280].map(x => rectLayer(`grid${x}`, x, 0, 1, PANEL_START_HEIGHT, look.line, grid));
  const rows = [25, 50, 75].map(y => rectLayer(`row${y}`, 0, y, PANEL_WIDTH, 1, look.line, grid));
  return {
    height: PANEL_START_HEIGHT, background: look.page,
    layers: [
      rectLayer("paper", 0, 0, PANEL_WIDTH, PANEL_START_HEIGHT, look.blueprint, { fill2: look.page }),
      ...columns, ...rows,
      rectLayer("frame", 6, 6, PANEL_WIDTH - 12, PANEL_START_HEIGHT - 12, "transparent", { stroke: look.line, strokeWidth: 1.5 }),
      textLayer("title", 16, centeredTop(size) - 4, PANEL_WIDTH - 32, title.toUpperCase(), look.font, size, look.line),
      textLayer("sheet", PANEL_WIDTH - 110, PANEL_START_HEIGHT - 22, 96, "BLATT 1", look.font, 10, look.muted, { align: "right", weight: 400 }),
    ],
  };
}
