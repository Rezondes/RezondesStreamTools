// The code rain of the Matrix theme (PLAN-MATRIX.md package 1, refs/starting.html): columns in three depth layers (far
// small, dim and slow; near big, bright and fast), each with its own start, speed and trail from the seed; the row of
// the head from the rain time, starting again at the top after its run; the glyph of a cell changes now and then, at
// the head more often. Everything from seed and time (rule 21), so stills, stinger and banners match. Check:
// rain.check.ts.
import { hash } from "../../core/hash.ts";
import type { MatrixValues } from "./settings.ts";

export type RainColumn = { key: number; x: number; speed: number; start: number; trail: number };
// One depth layer (settings): alpha, speed range (px/s), trail range (cells), share of empty columns
export type RainLayer = { alpha: number; speed: readonly [number, number]; trail: readonly [number, number]; empty: number };
// The layers far, mid, near; how spread the starts are and how much later each nearer layer starts (s)
export type RainLook = { layers: readonly [RainLayer, RainLayer, RainLayer]; spread: number; layerDelay: number };
export type RainOptions = { seed: number; width: number; density: number; look: RainLook };

// fixed: the rain has three depth layers (far, mid, near)
export const LAYER_COUNT = 3;

export const rainLookOf = (values: MatrixValues): RainLook => ({
  layers: [
    { alpha: values.rainFarAlpha, speed: [values.rainFarSpeedMin, values.rainFarSpeedMax], trail: [values.rainFarTrailMin, values.rainFarTrailMax], empty: values.rainFarEmpty },
    { alpha: values.rainMidAlpha, speed: [values.rainMidSpeedMin, values.rainMidSpeedMax], trail: [values.rainMidTrailMin, values.rainMidTrailMax], empty: values.rainMidEmpty },
    { alpha: values.rainNearAlpha, speed: [values.rainNearSpeedMin, values.rainNearSpeedMax], trail: [values.rainNearTrailMin, values.rainNearTrailMax], empty: values.rainNearEmpty },
  ],
  spread: values.rainStartSpread,
  layerDelay: values.rainLayerDelay,
});

// How often glyphs change per second at the tip and in the trail, and how many cells behind the head count as the tip
export type GlyphChange = { tip: number; trail: number; tipCells: number };

// A stable number in [0, 1) from several integers
export function mix(...parts: number[]): number {
  let seed = 0;
  for (const part of parts) seed = Math.imul(seed ^ (part | 0), 0x27d4eb2d) + 0x165667b1;
  return hash(seed);
}

// The columns of a layer (0 far, 1 mid, 2 near) with glyphs of size px over width; density 0 to 1 empties columns
export function rainColumns(layer: number, size: number, options: RainOptions): RainColumn[] {
  const look = options.look.layers[Math.min(LAYER_COUNT - 1, Math.max(0, layer))];
  const columns: RainColumn[] = [];
  for (let index = 0, x = size / 2; x < options.width; index++, x += size) {
    const random = (salt: number) => mix(options.seed, layer, index, salt);
    if (random(4) >= (1 - look.empty) * options.density) continue;
    columns.push({
      key: layer * 1000 + index, x,
      speed: look.speed[0] + random(2) * (look.speed[1] - look.speed[0]),
      start: random(3) * options.look.spread + layer * options.look.layerDelay,
      trail: Math.round(look.trail[0] + random(1) * (look.trail[1] - look.trail[0])),
    });
  }
  return columns;
}

// Row of the head and its run at rainSeconds (the time already scaled by the speed of the rain), null before the start
export function headAt(column: RainColumn, size: number, height: number, rainSeconds: number): { row: number; run: number } | null {
  const since = rainSeconds - column.start;
  if (since <= 0) return null;
  const span = height + column.trail * size;
  const travelled = since * column.speed;
  return { row: Math.floor((travelled % span) / size), run: Math.floor(travelled / span) };
}

// Glyph index (of count) for a cell behind cells behind the head; it changes change.tip times per second at the tip
// (the first change.tipCells cells), change.trail times in the trail
export function glyphAt(seed: number, column: RainColumn, row: number, behind: number, seconds: number, count: number, change: GlyphChange): number {
  const rate = behind < change.tipCells ? change.tip : change.trail;
  return Math.floor(mix(seed, column.key, row, Math.floor(seconds * rate + behind * 0.3)) * count);
}

// A speed of the rain that changes over time: the base factor, and now and then a pull (every s of base, then length s
// at boost), like the BRB trying to reconnect
export type Tempo = { base: number; pulls?: { every: number; length: number; boost: number } };

// The rain time at seconds: the integral of the speed factor, so the heads never jump when the speed changes
export function rainTime(seconds: number, tempo: Tempo): number {
  const plain = seconds * tempo.base;
  const pulls = tempo.pulls;
  if (!pulls || pulls.length <= 0) return plain;
  const period = pulls.every + pulls.length;
  const done = Math.floor(seconds / period);
  const pulled = done * pulls.length + Math.min(pulls.length, Math.max(0, seconds - done * period - pulls.every));
  return plain + pulled * (pulls.boost - tempo.base);
}
