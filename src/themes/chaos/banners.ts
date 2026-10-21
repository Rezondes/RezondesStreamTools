// Twitch banners of the Chaos theme: profile banner (1200x480) and offline banner (1920x1080) on the scribble wall. The
// profile banner shows the two brush X and the channel name as sprayed graffiti with a line below; the offline banner a
// magenta X, "offline" as graffiti, a text and a scribble monster asleep in the corner with rising "z". The glow pulses
// once per loop, so the GIF loops seamlessly. The brush strokes are painted with bristles and run-down drips (brush.ts),
// a share of the scribbles are Rough shapes (takesOf, loaded lazily by render.ts) in their first take. Pure functions of
// time (layers built once per options). Check: banners.check.ts.
import { brushAt, brushSchedule } from "./brush.ts";
import { chance } from "./chance.ts";
import { browserPath, paintBrushDrips, paintBrushFrame, paintScribbles, paintSpray, paintWall, type ChaosColors, type MakePath } from "./paint.ts";
import type { RoughMix } from "./roughScribbles.ts";
import { layoutScribbles, scribbleShape } from "./scribbles.ts";
import type { TakesOf } from "./stinger.ts";
import type { GestureKind } from "./strokes.ts";
import { blotches, dust } from "./wall.ts";

export type ChaosBannerOptions = {
  loop: number; // seconds
  font: string;
  titleFont: string;
  colors: ChaosColors;
  glow: number;
  drips: boolean;
  scribbleCount: number;
  scribbleWidth: number;
  rough: Omit<RoughMix, "width">; // share 0 to 1
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
};

const TURN = Math.PI * 2;
const STAGE_WIDTH = 1920;

// The wall of a banner: the stage scaled to the banner width, the brush composition and the pulse of the glow
function bannerWall(options: ChaosBannerOptions, seed: number, width: number, gesture: GestureKind, makePath: MakePath, takesOf?: TakesOf) {
  const scale = width / STAGE_WIDTH;
  const marks = layoutScribbles(seed, Math.round(options.scribbleCount * scale), { x: 0.22, y: 0.25, width: 0.56, height: 0.5 }, true);
  const rough = { ...options.rough, width: options.scribbleWidth };
  const takes = takesOf ? marks.map((mark, index) => takesOf(mark, index, seed, rough)[0]) : null;
  const takeOf = takes ? (index: number) => takes[index] : undefined;
  const strokes = brushSchedule(gesture, seed + 1).map(stroke => ({ ...stroke, frame: brushAt(stroke.brush, 1) }));
  const stains = blotches(seed + 2, 6);
  const dots = dust(seed + 3, Math.round(1800 * scale));
  const ink = { cyan: options.colors.accent2, magenta: options.colors.accent, main: options.colors.accent };
  return (context: CanvasRenderingContext2D, height: number, glow: number) => {
    paintWall(context, width, height, options.colors, stains, dots, scale);
    context.save();
    context.scale(scale, scale);
    paintScribbles(context, marks, options.colors, options.scribbleWidth, glow, 1, makePath, takeOf);
    for (const stroke of strokes) {
      paintBrushFrame(context, stroke.frame, ink[stroke.color], options.colors.textColor, glow);
      if (options.drips) paintBrushDrips(context, stroke.brush, ink[stroke.color], Infinity, makePath);
    }
    context.restore();
  };
}

// The glow pulses once per loop (the same at the start and the end)
const pulse = (options: ChaosBannerOptions, time: number) => options.glow * (0.8 + 0.2 * Math.sin((time / options.loop) * TURN));

function write(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, font: string) {
  context.font = `600 ${size}px "${font}", sans-serif`;
  context.textAlign = "center";
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.textAlign = "start";
}

// Profile banner 1200x480; at the bottom left Twitch puts the profile picture over it, so the text is right of center
export function makeChaosProfileBanner(options: ChaosBannerOptions, makePath: MakePath = browserPath, takesOf?: TakesOf) {
  const [width, height] = [1200, 480];
  const wall = bannerWall(options, 2203, width, "zweix", makePath, takesOf);
  return function draw(context: CanvasRenderingContext2D, time: number) {
    const glow = pulse(options, time);
    wall(context, height, glow);
    paintSpray(context, { text: options.title, x: width * 0.58, y: 250, size: 120, font: options.titleFont, color: options.colors.accentText, glowColor: options.colors.accent, glow, seed: 2210, drips: options.drips }, makePath);
    write(context, options.profileText, width * 0.58, 340, 34, options.colors.textColor, options.font);
  };
}

// Offline banner 1920x1080 with the sleeping monster at the bottom right
export function makeChaosOfflineBanner(options: ChaosBannerOptions, makePath: MakePath = browserPath, takesOf?: TakesOf) {
  const [width, height] = [1920, 1080];
  const wall = bannerWall(options, 3307, width, "x", makePath, takesOf);
  const monster = scribbleShape("monster", chance(3310));
  const sleep = scribbleShape("scrawl", chance(3311));
  return function draw(context: CanvasRenderingContext2D, time: number) {
    const glow = pulse(options, time);
    wall(context, height, glow);
    write(context, options.title, width / 2, 330, 46, options.colors.mutedColor, options.font);
    paintSpray(context, { text: options.offlineTitle, x: width / 2, y: 540, size: 200, font: options.titleFont, color: options.colors.accentText, glowColor: options.colors.accent, glow, seed: 3312, drips: options.drips }, makePath);
    write(context, options.offlineText, width / 2, 700, 46, options.colors.textColor, options.font);
    // The monster sleeps, its "z" rise and fade once per loop
    context.save();
    context.translate(1700, 930);
    context.scale(170, 170);
    context.strokeStyle = options.colors.scribbles[1];
    context.lineWidth = 0.035;
    context.lineCap = "round";
    for (const path of monster) context.stroke(makePath(path));
    context.restore();
    const rise = (time / options.loop) % 1;
    context.save();
    context.globalAlpha = 1 - rise;
    context.translate(1760, 800 - rise * 90);
    context.scale(70, 70);
    context.strokeStyle = options.colors.lilac;
    context.lineWidth = 0.05;
    for (const path of sleep) context.stroke(makePath(path));
    context.restore();
  };
}
