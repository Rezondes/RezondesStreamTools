// Renderable clips of the Dachdecker theme: the stinger (group Stinger) and the profile and offline banners (group
// Banner), drawn in 3D with the resolved settings. The 3D modules load only in prepare (clips3d.ts), so three.js stays
// out of the entry chunk; the captions are drawn on top with the 2D context. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type { BannerOptions } from "./banners.ts";
import { frameDims } from "./frame.ts";
import type { DachdeckerValues } from "./settings.ts";
import type { StingerOptions } from "./stinger.ts";
import type * as Clips3d from "./clips3d.ts";

export const STINGER_SIZE = { width: 1920, height: 1080, fps: 30 };
export const PROFILE_SIZE = { width: 1200, height: 480, fps: 15 };
export const OFFLINE_SIZE = { width: 1920, height: 1080, fps: 15 };
const PERCENT = 100;

type Draw = (context: CanvasRenderingContext2D, time: number) => void;
type Caption = { text: string; size: number; color: string; y: number; glow?: string };

// Captions centred over the picture, y as a share of the height; only non-empty lines
export function drawCaptions(context: CanvasRenderingContext2D, captions: readonly Caption[], font: string, width: number, height: number) {
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const caption of captions.filter(line => line.text)) {
    context.font = `700 ${caption.size}px "${font}"`;
    context.fillStyle = caption.color;
    context.shadowColor = caption.glow ?? "transparent";
    context.shadowBlur = caption.glow ? caption.size / 3 : 0;
    context.fillText(caption.text, width / 2, height * caption.y);
  }
  context.restore();
}

// The 3D draw functions, loaded once by prepare
let parts: typeof Clips3d | null = null;
const prepare = async () => { parts ??= await import("./clips3d.ts"); };
// A clip draws its 3D picture (built on the first frame after prepare) and its captions
// Until prepare has loaded the 3D part a clip shows its background color
function clipDraw(build: (loaded: typeof Clips3d) => Draw, captions: (time: number) => readonly Caption[], font: string, width: number, height: number, background: string): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      return;
    }
    picture ??= build(parts);
    picture(context, time);
    drawCaptions(context, captions(time), font, width, height);
  };
}

export function dachdeckerClips(settings: SettingValues, login: string): RenderClip[] {
  const values = settings as unknown as DachdeckerValues;
  const names = { channel: values.channelName, login };
  const colors = {
    accent: values.accent, line: values.line, muted: values.muted, slate: values.slate, copper: values.copper, brick: values.brick,
    card: values.card, slateDark: values.slateDark, blueprint: values.blueprint, page: values.page, dusk: values.dusk, rainColor: values.rain,
  };
  const stinger: StingerOptions = {
    duration: values.stingerDuration, cut: values.stingerCut, rows: values.stingerRows, shine: values.stingerShine,
    copperShare: values.stingerCopperShare / PERCENT, seed: values.seed, slate: values.slate, copper: values.copper, brick: values.brick, line: values.line,
  };
  const banner: BannerOptions = {
    dims: frameDims(values), wallHeight: values.wallHeight, seed: values.seed, copperShare: values.tileCopperShare / PERCENT, lineOpacity: values.lineOpacity,
    fillOpacity: values.fillOpacity, loop: values.bannerDuration, rain: values.bannerRain, drops: values.bannerRainCount, colors,
  };
  const font = `700 24px "${values.font}"`;
  // The stinger text shows while the tiles cover the picture
  const covered = (time: number) => Math.abs(time - stinger.cut) < stinger.cut / 2;
  return [
    {
      name: "stinger", feature: "stinger", group: "Stinger", font, ...STINGER_SIZE, duration: stinger.duration, cut: stinger.cut, prepare,
      draw: clipDraw(loaded => loaded.stingerDraw(stinger), time => [
        { text: covered(time) ? fillTemplate(values.stingerText, names) : "", size: values.titleSize * 2, color: values.line, y: 0.5, glow: values.accent },
      ], values.font, STINGER_SIZE.width, STINGER_SIZE.height, values.slate),
    },
    {
      name: "profile", feature: "banners", group: "Banner", font, ...PROFILE_SIZE, duration: banner.loop, cut: null, prepare,
      draw: clipDraw(loaded => loaded.profileDraw(banner), () => [
        { text: fillTemplate(values.profileTitle, names), size: values.titleSize, color: values.accent, y: 0.42, glow: values.brick },
        { text: values.profileSubtitle, size: values.fontSize, color: values.copper, y: 0.62 },
      ], values.font, PROFILE_SIZE.width, PROFILE_SIZE.height, values.blueprint),
    },
    {
      name: "offline", feature: "banners", group: "Banner", font, ...OFFLINE_SIZE, duration: banner.loop, cut: null, prepare,
      draw: clipDraw(loaded => loaded.offlineDraw(banner), () => [
        { text: values.offlineText, size: values.titleSize, color: values.line, y: 0.82, glow: values.muted },
      ], values.font, OFFLINE_SIZE.width, OFFLINE_SIZE.height, values.blueprint),
    },
  ];
}
