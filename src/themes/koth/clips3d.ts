// The 3D draw functions of the KOTH clips, loaded lazily by render.ts (prepare) so three.js stays out of the entry
// chunk: the stinger scene of stinger.ts with its text printed once on a canvas, and the banners as the 3D hill of
// bannerWorld.ts with the texts of banners.ts drawn over it.
import { glClip } from "../../core/three/glClip.ts";
import { type BannerWorldOptions, bannerSetup } from "./bannerWorld.ts";
import { drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions, OFFLINE_SIZE, PROFILE_SIZE } from "./banners.ts";
import { HEIGHT, type KothStingerOptions, stingerSetup, WIDTH } from "./stinger.ts";

export type StingerText = { text: string; font: string; color: string };

// fixed: the text canvas of the stinger and its type, a banner is one picture
const TEXT_CANVAS = { width: 1400, height: 250, size: 150 };
const STILL = { duration: 1, fps: 1 };

function printed(label: StingerText) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXT_CANVAS.width;
  canvas.height = TEXT_CANVAS.height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = label.color;
    context.font = `400 ${TEXT_CANVAS.size}px "${label.font}", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label.text, TEXT_CANVAS.width / 2, TEXT_CANVAS.height / 2);
  }
  return canvas;
}

export const stingerDraw = (options: KothStingerOptions, label: StingerText, fps: number) =>
  glClip({ width: WIDTH, height: HEIGHT, fps, duration: options.duration }, () => stingerSetup(options, printed(label)));

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

function banner(size: { width: number; height: number }, world: BannerWorldOptions, texts: (context: CanvasRenderingContext2D) => void): Draw {
  const picture = glClip({ ...size, ...STILL }, () => bannerSetup(size, world));
  return (context, time) => {
    picture(context, time);
    texts(context);
  };
}

export const profileDraw = (world: BannerWorldOptions, texts: KothBannerOptions) =>
  banner(PROFILE_SIZE, world, context => drawKothProfileBanner(context, texts));
export const offlineDraw = (world: BannerWorldOptions, texts: KothBannerOptions) =>
  banner(OFFLINE_SIZE, world, context => drawKothOfflineBanner(context, texts));
