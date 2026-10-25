// Twitch banners of the Chaos theme: profile banner (1200x480) and offline banner (1920x1080) on the scribble wall. The
// profile banner shows the two brush X and the channel name as sprayed graffiti with a line below; the offline banner a
// magenta X, "offline" as graffiti, a text and a scribble monster asleep in the corner with a "z" above it. Both are
// still pictures (the dashboard saves a PNG). The brush strokes are painted with bristles and run-down drips (brush.ts),
// a share of the scribbles are Rough shapes (takesOf, loaded lazily by render.ts) in their first take. The layers are
// built once per options.
// Check: banners.check.ts.
import { brushAt, brushSchedule } from "./brush.ts";
import { chance } from "./chance.ts";
import { browserPath, paintBrushDrips, paintBrushFrame, paintScribbles, paintSpray, paintWall, type ChaosColors, type MakePath } from "./paint.ts";
import type { RoughMix } from "./roughScribbles.ts";
import { layoutScribbles, scribbleShape } from "./scribbles.ts";
import type { TakesOf } from "./stinger.ts";
import type { GestureKind } from "./strokes.ts";
import { blotches, dust } from "./wall.ts";

export type ChaosBannerOptions = {
  font: string;
  titleFont: string;
  colors: ChaosColors;
  glow: number;
  drips: boolean;
  shimmer: number; // strength of the bristle shimmer, factor (0 = none)
  scribbleCount: number;
  scribbleWidth: number;
  rough: Omit<RoughMix, "width">; // share 0 to 1
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  layout: ChaosBannerLayout;
};
// Colors, places and sizes of the settings in px: the title and line of the profile banner, the channel line, title, text,
// sleeping monster and its z of the offline banner; titleX is a share of the width
export type ChaosBannerLayout = {
  profile: { titleColor: string; glowColor: string; textColor: string; titleX: number; titleY: number; titleSize: number; textY: number; textSize: number };
  offline: {
    titleColor: string; glowColor: string; textColor: string; nameColor: string; monsterColor: string; sleepColor: string;
    nameY: number; nameSize: number; titleY: number; titleSize: number; textY: number; textSize: number;
    monsterX: number; monsterY: number; monsterSize: number; sleepX: number; sleepY: number; sleepSize: number;
  };
};

const STAGE_WIDTH = 1920;

// The wall of a banner: the stage scaled to the banner width and the brush composition
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
      paintBrushFrame(context, stroke.frame, ink[stroke.color], options.colors.textColor, glow, { at: 0, strength: options.shimmer });
      if (options.drips) paintBrushDrips(context, stroke.brush, ink[stroke.color], Infinity, makePath);
    }
    context.restore();
  };
}

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
  return function draw(context: CanvasRenderingContext2D) {
    const { glow } = options;
    const look = options.layout.profile;
    wall(context, height, glow);
    paintSpray(context, { text: options.title, x: width * look.titleX, y: look.titleY, size: look.titleSize, font: options.titleFont, color: look.titleColor, glowColor: look.glowColor, glow, seed: 2210, drips: options.drips }, makePath);
    write(context, options.profileText, width * look.titleX, look.textY, look.textSize, look.textColor, options.font);
  };
}

// Offline banner 1920x1080 with the sleeping monster at the bottom right
export function makeChaosOfflineBanner(options: ChaosBannerOptions, makePath: MakePath = browserPath, takesOf?: TakesOf) {
  const [width, height] = [1920, 1080];
  const wall = bannerWall(options, 3307, width, "x", makePath, takesOf);
  const monster = scribbleShape("monster", chance(3310));
  const sleep = scribbleShape("scrawl", chance(3311));
  return function draw(context: CanvasRenderingContext2D) {
    const { glow } = options;
    const look = options.layout.offline;
    wall(context, height, glow);
    write(context, options.title, width / 2, look.nameY, look.nameSize, look.nameColor, options.font);
    paintSpray(context, { text: options.offlineTitle, x: width / 2, y: look.titleY, size: look.titleSize, font: options.titleFont, color: look.titleColor, glowColor: look.glowColor, glow, seed: 3312, drips: options.drips }, makePath);
    write(context, options.offlineText, width / 2, look.textY, look.textSize, look.textColor, options.font);
    // The monster sleeps, a "z" above it
    context.save();
    context.translate(look.monsterX, look.monsterY);
    context.scale(look.monsterSize, look.monsterSize);
    context.strokeStyle = look.monsterColor;
    context.lineWidth = 0.035;
    context.lineCap = "round";
    for (const path of monster) context.stroke(makePath(path));
    context.restore();
    context.save();
    context.translate(look.sleepX, look.sleepY);
    context.scale(look.sleepSize, look.sleepSize);
    context.strokeStyle = look.sleepColor;
    context.lineWidth = 0.05;
    for (const path of sleep) context.stroke(makePath(path));
    context.restore();
  };
}
