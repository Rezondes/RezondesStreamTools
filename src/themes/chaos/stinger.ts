// Stinger of the Chaos theme: one clear wipe from left to right. The scribble wall comes in from the left behind a thick
// painted magenta brush stroke (bristles, brush.ts) along its ragged, slanted edge with spray mist blowing off it, covers
// the whole picture at the transition point (cut), where the text is sprayed on big with glow and drips; then the wall
// wipes out to the right behind a cyan brush stroke and takes the text with it. The scribbles boil through their takes,
// a share of them Rough shapes (takesOf, loaded lazily by render.ts). Transparent outside the wall. Pure function of
// time (the layers are built once per options), so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";
import { burstAt } from "../../core/motion/burst.ts";
import { brushAt, makeBrush, type Brush } from "./brush.ts";
import { chance } from "./chance.ts";
import { boilTake } from "./idle.ts";
import { browserPath, paintBrushFrame, paintMist, paintScribbles, paintSpray, paintWall, type ChaosColors, type MakePath } from "./paint.ts";
import type { RoughMix, scribbleTakes } from "./roughScribbles.ts";
import { layoutScribbles } from "./scribbles.ts";
import { blotches, dust } from "./wall.ts";

// Builds the takes of a scribble (scribbleTakes of roughScribbles.ts); without it every mark keeps its own hand
export type TakesOf = typeof scribbleTakes;

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
  rough: Omit<RoughMix, "width">; // share 0 to 1
  boilFps: number; // 0 = the scribbles stand still
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
// fixed: spray mist along each moving edge: puffs over the height, dots per puff, how the dots fly
const MIST_PUFFS = 7;
const MIST_DOTS = 40;
const MIST = { spread: Math.PI * 0.9, speed: [60, 420] as const, gravity: 60, drag: 2.5, life: 1 };

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

export function makeChaosStinger(options: ChaosStingerOptions, makePath: MakePath = browserPath, takesOf?: TakesOf) {
  const marks = layoutScribbles(SEED, options.scribbleCount, { x: 0.22, y: 0.3, width: 0.56, height: 0.4 }, true);
  const rough = { ...options.rough, width: options.scribbleWidth };
  const takes = takesOf ? marks.map((mark, index) => takesOf(mark, index, SEED, rough)) : null;
  const stains = blotches(SEED + 2, 6);
  const dots = dust(SEED + 3, 1800);
  const random = chance(SEED + 1);
  const jags = Array.from({ length: Math.ceil(HEIGHT / EDGE_STEP) + 1 }, () => (random() - 0.5) * 2 * EDGE_JAG);
  // One painted stroke per edge along the slanted edge through x = 0, moved with the edge
  const stroke = (seed: number): Brush => makeBrush({ from: [-LEAN * 0.1, -120], to: [LEAN * 1.1, HEIGHT + 120], width: BRUSH }, seed);
  const [enterStroke, exitStroke] = [stroke(SEED + 5), stroke(SEED + 6)];
  // The edge at height y for an edge position x: slanted and ragged
  const boundary = (x: number) => jags.map((jag, step) => [x + LEAN * ((step * EDGE_STEP) / HEIGHT) + jag, step * EDGE_STEP] as const);

  const wall = (context: CanvasRenderingContext2D, time: number, text: number) => {
    paintWall(context, WIDTH, HEIGHT, options.colors, stains, dots, 1);
    const takeOf = takes ? (index: number) => takes[index][boilTake(index, time, options.boilFps, options.boilFps > 0)] : undefined;
    paintScribbles(context, marks, options.colors, options.scribbleWidth, options.glow, 1, makePath, takeOf);
    if (text <= 0) return;
    // Sprayed on: fades in and settles from a little bigger
    const size = options.textSize * (1 + 0.12 * (1 - text));
    context.globalAlpha = text;
    paintSpray(context, { text: options.text, x: WIDTH / 2, y: HEIGHT / 2 + size * 0.35, size, font: options.titleFont, color: options.colors.accentText, glowColor: options.colors.accent, glow: options.glow, seed: SEED + 8, drips: options.drips }, makePath);
    context.globalAlpha = 1;
  };
  // The stroke on an edge with its bristles shimmering, and mist blowing off it: ahead of the entering edge, behind the
  // leaving one; each puff breathes with the time
  const edge = (context: CanvasRenderingContext2D, brush: Brush, x: number, ink: string, time: number, salt: number, direction: number) => {
    context.save();
    context.translate(x, 0);
    paintBrushFrame(context, brushAt(brush, 1, time, 1), ink, options.colors.textColor, options.glow);
    context.restore();
    for (let puff = 0; puff < MIST_PUFFS; puff++) {
      const y = ((puff + 0.5) / MIST_PUFFS) * HEIGHT;
      const age = 0.3 + 0.2 * Math.sin(time * 7 + puff * 1.7);
      paintMist(context, burstAt(SEED + salt + puff, MIST_DOTS, age, { ...MIST, origin: { x: x + LEAN * (y / HEIGHT) + Math.cos(direction) * BRUSH * 0.45, y }, direction }), ink);
    }
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
    wall(context, time, stingerText(time, options.cut));
    context.restore();
    if (enter < 1) edge(context, enterStroke, right, options.colors.accent, time, 20, 0);
    if (exit > 0) edge(context, exitStroke, left, options.colors.accent2, time, 40, Math.PI);
  };
}
