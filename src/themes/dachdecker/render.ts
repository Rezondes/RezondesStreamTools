// Renderable clips of the Dachdecker theme: the stinger (group Stinger) in 3D and the profile and offline banners
// (group Banner) in 2D, with the resolved settings. The 3D module loads only in prepare (clips3d.ts), so three.js stays
// out of the entry chunk; the stinger caption is drawn on top with the 2D context. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { type BannerOptions, drawOffline, drawProfile } from "./banners.ts";
import type { DachdeckerValues } from "./settings.ts";
import { coverage, STINGER_SIZE } from "./roll.ts";
import type { StingerOptions } from "./stinger.ts";
import type * as Clips3d from "./clips3d.ts";

export { STINGER_SIZE };
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

// The 3D draw function, loaded once by prepare
let parts: typeof Clips3d | null = null;
const prepare = async () => { parts ??= await import("./clips3d.ts"); };
// The stinger draws its 3D picture (built on the first frame after prepare) and its captions; until prepare has loaded
// the 3D part it draws the flat stand-in (the covered sheet as an area)
function clipDraw(build: (loaded: typeof Clips3d) => Draw, standIn: Draw, captions: (time: number) => readonly Caption[], font: string, width: number, height: number): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) {
      standIn(context, time);
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
  const stinger: StingerOptions = {
    duration: values.stingerDuration, cut: values.stingerCut, hold: values.stingerHold / PERCENT, grid: values.stingerGrid, roll: values.stingerRollSize,
    blueprint: values.blueprint, line: values.line, accent: values.accent, copper: values.copper, shadow: values.page,
  };
  const banner = (size: { width: number; height: number }): BannerOptions => ({
    width: size.width, height: size.height, loop: values.bannerDuration, font: values.font, titleSize: values.titleSize, fontSize: values.fontSize,
    grid: values.bannerGrid, glow: values.glow, rain: values.bannerRain, drops: values.bannerRainCount, seed: values.seed,
    colors: { blueprint: values.blueprint, page: values.page, accent: values.accent, copper: values.copper, line: values.line, rainColor: values.rain },
  });
  const profile = banner(PROFILE_SIZE);
  const offline = banner(OFFLINE_SIZE);
  const font = `700 24px "${values.font}"`;
  // The stinger text shows while the sheet covers the whole picture
  const covered = (time: number) => coverage(time, stinger) >= 1;
  return [
    {
      name: "stinger", feature: "stinger", group: "Stinger", font, ...STINGER_SIZE, duration: stinger.duration, cut: stinger.cut, prepare,
      draw: clipDraw(loaded => loaded.stingerDraw(stinger), (context, time) => {
        context.fillStyle = values.blueprint;
        context.fillRect(0, 0, STINGER_SIZE.width * coverage(time, stinger), STINGER_SIZE.height);
      }, time => [
        { text: covered(time) ? fillTemplate(values.stingerText, names) : "", size: values.titleSize * 2, color: values.accent, y: 0.5, glow: values.accent },
      ], values.font, STINGER_SIZE.width, STINGER_SIZE.height),
    },
    {
      name: "profile", feature: "banners", group: "Banner", font, ...PROFILE_SIZE, duration: profile.loop, cut: null,
      draw: (context, time) => drawProfile(context, time, profile, {
        title: fillTemplate(values.profileTitle, names), overline: fillTemplate(values.profileOverline, names), subtitle: fillTemplate(values.profileSubtitle, names),
      }),
    },
    {
      name: "offline", feature: "banners", group: "Banner", font, ...OFFLINE_SIZE, duration: offline.loop, cut: null,
      draw: (context, time) => drawOffline(context, time, offline, {
        title: fillTemplate(values.offlineText, names), overline: fillTemplate(values.offlineOverline, names), subtitle: fillTemplate(values.offlineSubtitle, names),
      }),
    },
  ];
}
