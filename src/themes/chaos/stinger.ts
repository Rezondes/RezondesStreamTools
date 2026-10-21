// Stinger of the Chaos theme: one clear wipe from left to right. The scribble wall comes in from the left behind a thick
// magenta brush stroke along its ragged, slanted edge, covers the whole picture at the transition point (cut), where the
// text is sprayed on big with glow and drips; then the wall wipes out to the right behind a cyan brush stroke and takes
// the text with it. Transparent outside the wall. Pure function of time (the layers are built once per options), so it
// can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";
import { chance } from "./chance.ts";
import { browserPath, paintBrush, paintScribbles, paintSpray, paintWall, type ChaosColors, type MakePath } from "./paint.ts";
import { layoutScribbles } from "./scribbles.ts";
import { brushStroke, type BrushStroke } from "./strokes.ts";
import { blotches, dust } from "./wall.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type ChaosStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  text: string;
  textSize: number; // px
  titleFont: string;
  colors: ChaosColors;
  glow: number;
  drips: boolean;
  scribbleCount: number;
  scribbleWidth: number;
};

const SEED = 1307;
// Width of the brush stroke on the edge, how far the edge leans over the height, ragged steps along the edge
const BRUSH = 190;
const LEAN = 160;
const EDGE_STEP = 45;
const EDGE_JAG = 26;
// The edges start and end this far outside the picture, so the stroke and its splatter come in and leave completely
const PAD = 340;
// Shares of the time to the cut: the wall is in at ENTER_END, the text sprays in from TEXT_FROM; the exit waits HOLD of
// the time after the cut and is out at EXIT_END of the duration
const ENTER_END = 0.85;
const TEXT_FROM = 0.65;
const HOLD = 0.3;
const EXIT_END = 0.95;

// Where the two edges are: enter and exit run from 0 (edge left outside) to 1 (edge right outside); the wall lies
// between the exit edge on the left and the enter edge on the right
export function stingerEdges(time: number, cut: number, duration: number) {
  const enter = easeInOut(clamp01(time / Math.max(0.01, cut * ENTER_END)));
  const exitFrom = cut + (duration - cut) * HOLD;
  const exit = easeInOut(clamp01((time - exitFrom) / Math.max(0.01, duration * EXIT_END - exitFrom)));
  return { enter, exit };
}

// How far the text is sprayed on: 0 before, 1 from the cut on
export const stingerText = (time: number, cut: number) => clamp01((time - cut * TEXT_FROM) / Math.max(0.01, cut * (1 - TEXT_FROM)));

const edgeX = (share: number) => -PAD + share * (WIDTH + PAD * 2);

export function makeChaosStinger(options: ChaosStingerOptions, makePath: MakePath = browserPath) {
  const marks = layoutScribbles(SEED, options.scribbleCount, { x: 0.22, y: 0.3, width: 0.56, height: 0.4 }, true);
  const stains = blotches(SEED + 2, 6);
  const dots = dust(SEED + 3, 1800);
  const random = chance(SEED + 1);
  const jags = Array.from({ length: Math.ceil(HEIGHT / EDGE_STEP) + 1 }, () => (random() - 0.5) * 2 * EDGE_JAG);
  // One stroke per edge along the slanted edge through x = 0, moved with the edge
  const stroke = (): BrushStroke => brushStroke([-LEAN * 0.1, -120], [LEAN * 1.1, HEIGHT + 120], BRUSH, random);
  const [enterStroke, exitStroke] = [stroke(), stroke()];
  // The edge at height y for an edge position x: slanted and ragged
  const boundary = (x: number) => jags.map((jag, step) => [x + LEAN * ((step * EDGE_STEP) / HEIGHT) + jag, step * EDGE_STEP] as const);

  const wall = (context: CanvasRenderingContext2D, text: number) => {
    paintWall(context, WIDTH, HEIGHT, options.colors, stains, dots, 1);
    paintScribbles(context, marks, options.colors, options.scribbleWidth, options.glow, 1, makePath);
    if (text <= 0) return;
    // Sprayed on: fades in and settles from a little bigger
    const size = options.textSize * (1 + 0.12 * (1 - text));
    context.globalAlpha = text;
    paintSpray(context, { text: options.text, x: WIDTH / 2, y: HEIGHT / 2 + size * 0.35, size, font: options.titleFont, color: options.colors.accentText, glowColor: options.colors.accent, glow: options.glow, seed: SEED + 8, drips: options.drips }, makePath);
    context.globalAlpha = 1;
  };
  const brush = (context: CanvasRenderingContext2D, stroke: BrushStroke, x: number, ink: string) => {
    context.save();
    context.translate(x, 0);
    paintBrush(context, stroke, ink, options.colors.textColor, options.glow, false, makePath);
    context.restore();
  };

  return function draw(context: CanvasRenderingContext2D, time: number) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    const { enter, exit } = stingerEdges(time, options.cut, options.duration);
    if (enter <= 0 || exit >= 1) return;
    const [left, right] = [edgeX(exit), edgeX(enter)];
    context.save();
    context.beginPath();
    boundary(left).forEach(([x, y], step) => (step ? context.lineTo(x, y) : context.moveTo(x, y)));
    [...boundary(right)].reverse().forEach(([x, y]) => context.lineTo(x, y));
    context.closePath();
    context.clip();
    wall(context, stingerText(time, options.cut));
    context.restore();
    if (enter < 1) brush(context, enterStroke, right, options.colors.accent);
    if (exit > 0) brush(context, exitStroke, left, options.colors.accent2);
  };
}
