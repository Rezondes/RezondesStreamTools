// A painted brush stroke of the Chaos theme for PixiJS (DESIGN-CHAOS.md "Modernisierung", refs/starting.html): many
// bristle tracks side by side with ragged ends and a dry tail over a paint body with frayed edges, drips under it; the
// stroke is painted up to a progress p (0 = nothing, 1 = whole). Bristles and drips come from the seed, their shimmer
// from the time. Also the spray edge that runs along a title while it is sprayed on. Check: brush.check.ts.
import { between, chance } from "./chance.ts";
import { gestureLayout, type GestureKind, type GestureStroke } from "./strokes.ts";

type Point = readonly [number, number];
export type Bristle = { offset: number; start: number; end: number; width: number; alpha: number; light: boolean; wobble: number };
export type Drip = { at: number; offset: number; length: number; speed: number; width: number };
export type Brush = { from: Point; along: Point; across: Point; length: number; width: number; bristles: Bristle[]; drips: Drip[] };
export type BrushFrame = { body: number[] | null; bristles: { points: number[]; width: number; alpha: number; light: boolean }[]; tip: { x: number; y: number } | null };

// fixed: the stroke of the prototype: bristle spacing, body steps and edge fray, bristle steps and wiggle
const BRISTLE_SPACING = 2.2;
const BODY_STEPS = 24;
const FRAY = 5;
const BRISTLE_STEPS = 12;
const WIGGLE = { size: 2.5, turns: 14, shimmer: 1.2 };

export function makeBrush(stroke: Pick<GestureStroke, "from" | "to" | "width">, seed: number): Brush {
  const random = chance(seed);
  const [dx, dy] = [stroke.to[0] - stroke.from[0], stroke.to[1] - stroke.from[1]];
  const length = Math.hypot(dx, dy);
  const along: Point = [dx / length, dy / length];
  const count = Math.round(stroke.width / BRISTLE_SPACING);
  const bristles = Array.from({ length: count }, (_, index) => {
    const offset = (index / count - 0.5) * stroke.width;
    const edge = Math.abs(offset) / stroke.width;
    return { offset, start: between(random, 0, 0.06) + edge * 0.08, end: between(random, 0.78, 1) - edge * 0.15, width: between(random, 1, 3.6), alpha: between(random, 0.35, 1), light: random() > 0.85, wobble: random() * 9 };
  });
  const drips = Array.from({ length: 3 + Math.floor(random() * 3) }, () => ({
    at: between(random, 0.15, 0.8), offset: between(random, 0.1, 0.5) * stroke.width, length: between(random, 60, 200), speed: between(random, 30, 70), width: between(random, 3, 7),
  }));
  return { from: stroke.from, along, across: [-along[1], along[0]], length, width: stroke.width, bristles, drips };
}

// Point at a share along the stroke and an offset across it
export function brushPoint(brush: Brush, share: number, offset: number): { x: number; y: number } {
  return {
    x: brush.from[0] + brush.along[0] * brush.length * share + brush.across[0] * offset,
    y: brush.from[1] + brush.along[1] * brush.length * share + brush.across[1] * offset,
  };
}

// The brush runs fast and slows down at the end of the stroke
export const reachOf = (progress: number) => 1 - (1 - Math.min(1, Math.max(0, progress))) ** 2;

// The stroke painted up to progress (0 to 1); seconds and shimmer let the bristles shimmer after the build
export function brushAt(brush: Brush, progress: number, seconds = 0, shimmer = 0): BrushFrame {
  if (progress <= 0) return { body: null, bristles: [], tip: null };
  const reach = reachOf(progress);
  let body: number[] | null = null;
  if (reach > 0.04) {
    const [front, back]: number[][] = [[], []];
    for (let step = 0; step <= BODY_STEPS; step++) {
      const share = 0.03 + ((reach - 0.03) * step) / BODY_STEPS;
      const half = brush.width * 0.42 * (1 - (Math.max(0, share - 0.7) / 0.3) ** 2 * 0.6);
      const near = brushPoint(brush, share, half + Math.sin(step * 2.7 + brush.width) * FRAY);
      const far = brushPoint(brush, share, -(half + Math.cos(step * 3.1 + brush.width) * FRAY));
      front.push(near.x, near.y);
      back.unshift(far.x, far.y);
    }
    body = [...front, ...back];
  }
  const bristles = brush.bristles.flatMap(bristle => {
    const end = Math.min(bristle.end, reach);
    if (end <= bristle.start) return [];
    const points = Array.from({ length: BRISTLE_STEPS + 1 }, (_, step) => {
      const share = bristle.start + ((end - bristle.start) * step) / BRISTLE_STEPS;
      const wiggle = Math.sin(share * WIGGLE.turns + bristle.wobble + seconds * 1.3 * shimmer) * WIGGLE.size + Math.sin(seconds * 2.1 + bristle.wobble + share * 5) * WIGGLE.shimmer * shimmer;
      const point = brushPoint(brush, share, bristle.offset + wiggle);
      return [point.x, point.y];
    }).flat();
    return [{ points, width: bristle.width, alpha: bristle.alpha, light: bristle.light }];
  });
  return { body, bristles, tip: brushPoint(brush, reach, 0) };
}

// Where the spray edge of a title is (x on the stage) while it is sprayed on from left to right, null before and after
export const SPRAY_EDGE = { from: 220, to: 1720 };
export function sprayEdgeAt(seconds: number, start: number, durationMs: number): number | null {
  const raw = (seconds - start) / (durationMs / 1000);
  // a hair over 1 is still the end (float rounding of start + duration)
  if (raw < 0 || raw > 1 + 1e-9) return null;
  const part = Math.min(1, raw);
  const eased = part < 0.5 ? 2 * part * part : 1 - 2 * (1 - part) * (1 - part);
  return SPRAY_EDGE.from + (SPRAY_EDGE.to - SPRAY_EDGE.from) * eased;
}

// fixed: when the strokes of a composition start (s, like the prototype, cycling for larger compositions)
const STARTS = [0.2, 0.55, 0.4, 0.75, 1.1, 1.2];
const NEXT_ROUND = 0.3;

// The strokes of a scene's composition as brushes with their color slot and start time
export function brushSchedule(kind: GestureKind, seed: number) {
  return gestureLayout(kind, seed).map((stroke, index) => ({
    brush: makeBrush(stroke, seed + index * 101),
    color: stroke.color,
    start: STARTS[index % STARTS.length] + Math.floor(index / STARTS.length) * NEXT_ROUND,
  }));
}
