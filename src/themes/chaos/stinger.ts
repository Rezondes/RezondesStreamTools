// Stinger of the Chaos theme: the scribble wall with its two brush X closes in from the left and the right with a ragged
// edge, energy swathes riding on both edges, and covers the whole picture at the transition point (cut); the text flares
// up there as sprayed graffiti, then the wall tears open to the top and the bottom. Transparent outside the wall. Pure
// function of time (the layers are built once per options), so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";
import { chance } from "./chance.ts";
import { browserPath, paintBrush, paintScribbles, paintSpray, paintSwath, paintWall, type ChaosColors, type MakePath } from "./paint.ts";
import { layoutScribbles } from "./scribbles.ts";
import { brushStroke, gestureLayout } from "./strokes.ts";
import { swathes, type Swathes } from "./swathes.ts";
import { blotches, dust } from "./wall.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type ChaosStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  text: string;
  titleFont: string;
  colors: ChaosColors;
  glow: number;
  drips: boolean;
  scribbleCount: number;
  scribbleWidth: number;
  swathDensity: number;
};

// How far the wall has closed (reach: share of the width from each side, 0.5 = closed) and opened again (open: share of
// the half height each half has moved away, 1 = gone)
export function stingerCover(time: number, cut: number, duration: number) {
  const hold = Math.min(0.15, (duration - cut) * 0.3);
  const reach = 0.5 * easeInOut(clamp01(time / Math.max(0.01, cut * 0.9)));
  const open = easeInOut(clamp01((time - cut - hold) / Math.max(0.01, duration - cut - hold)));
  return { reach, open };
}

const SEED = 1307;
const EDGE_STEP = 54;
const EDGE_JAG = 46;

// The ragged edge of one side: x offsets along the height
const edgeOf = (seed: number) => {
  const random = chance(seed);
  return Array.from({ length: Math.ceil(HEIGHT / EDGE_STEP) + 1 }, () => (random() - 0.5) * 2 * EDGE_JAG);
};

// Swathes ride on both edges of the closing wall and fade while it closes
function ride(context: CanvasRenderingContext2D, reach: number, [left, right]: readonly [Swathes, Swathes], options: ChaosStingerOptions, makePath: MakePath) {
  context.globalAlpha = Math.max(0, 1 - reach * 1.4);
  for (const [swath, shift] of [[left, reach * WIDTH - WIDTH * 0.3], [right, WIDTH * 0.3 - reach * WIDTH]] as const) {
    context.save();
    context.translate(shift, 0);
    paintSwath(context, swath, options.colors, options.glow, makePath);
    context.restore();
  }
  context.globalAlpha = 1;
}

export function makeChaosStinger(options: ChaosStingerOptions, makePath: MakePath = browserPath) {
  const marks = layoutScribbles(SEED, options.scribbleCount, { x: 0.3, y: 0.32, width: 0.4, height: 0.36 }, true);
  const random = chance(SEED + 1);
  const strokes = gestureLayout("zweix", SEED + 1).map(part => ({ ...part, brush: brushStroke(part.from, part.to, part.width, random) }));
  const stains = blotches(SEED + 2, 6);
  const dots = dust(SEED + 3, 1800);
  const left = swathes("left", SEED + 4, options.swathDensity);
  const right = swathes("right", SEED + 5, options.swathDensity);
  const [leftEdge, rightEdge] = [edgeOf(SEED + 6), edgeOf(SEED + 7)];
  const ink = { cyan: options.colors.accent2, magenta: options.colors.accent, main: options.colors.accent2 };

  const wall = (context: CanvasRenderingContext2D) => {
    paintWall(context, WIDTH, HEIGHT, options.colors, stains, dots, 1);
    paintScribbles(context, marks, options.colors, options.scribbleWidth, options.glow, 1, makePath);
    for (const stroke of strokes) paintBrush(context, stroke.brush, ink[stroke.color], options.colors.textColor, options.glow, options.drips, makePath);
  };
  // The closing wall: both sides up to their ragged edge
  const closing = (context: CanvasRenderingContext2D, reach: number) => {
    context.beginPath();
    const leftX = reach * WIDTH;
    context.moveTo(0, 0);
    leftEdge.forEach((jag, step) => context.lineTo(leftX + (reach > 0 ? jag : 0), step * EDGE_STEP));
    context.lineTo(0, HEIGHT);
    context.closePath();
    // The same turning direction as the left side, so the overlap in the middle stays inside the clip
    const rightX = WIDTH - reach * WIDTH;
    context.moveTo(WIDTH, HEIGHT);
    [...rightEdge].reverse().forEach((jag, step) => context.lineTo(rightX + (reach > 0 ? jag : 0), (rightEdge.length - 1 - step) * EDGE_STEP));
    context.lineTo(WIDTH, 0);
    context.closePath();
  };

  return function draw(context: CanvasRenderingContext2D, time: number) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    const { reach, open } = stingerCover(time, options.cut, options.duration);
    if (reach <= 0 || open >= 1) return;
    if (open <= 0) {
      context.save();
      closing(context, reach + EDGE_JAG / WIDTH);
      context.clip();
      wall(context);
      context.restore();
      ride(context, reach, [left, right], options, makePath);
    } else {
      // Torn open: the top half moves up, the bottom half down
      for (const [top, shift] of [[0, -open], [HEIGHT / 2, open]] as const) {
        context.save();
        context.translate(0, (shift * HEIGHT) / 2);
        context.beginPath();
        context.rect(0, top, WIDTH, HEIGHT / 2);
        context.clip();
        wall(context);
        context.restore();
      }
    }
    // Text in the middle, only while everything is covered
    const shown = 1 - clamp01(Math.abs(time - options.cut) / (Math.min(options.cut, options.duration - options.cut) * 0.6));
    if (shown <= 0) return;
    context.globalAlpha = shown;
    paintSpray(context, { text: options.text, x: WIDTH / 2, y: HEIGHT / 2 + 50, size: 170, font: options.titleFont, color: options.colors.accentText, glowColor: options.colors.accent, glow: options.glow, seed: SEED + 8, drips: options.drips }, makePath);
    context.globalAlpha = 1;
  };
}
