// The code rain of the Matrix theme (PLAN-MATRIX.md package 1, refs/starting.html): columns in three depth layers (far
// small, dim and slow; near big, bright and fast), each with its own start, speed and trail from the seed; the row of
// the head from the rain time, starting again at the top after its run; the glyph of a cell changes now and then, at
// the head more often. Everything from seed and time (rule 21), so stills, stinger and banners match. Check:
// rain.check.ts.
import { hash } from "../../core/hash.ts";

export type RainColumn = { key: number; x: number; speed: number; start: number; trail: number };
export type RainOptions = { seed: number; width: number; density: number };

// fixed: the three layers of the prototype: alpha, speed range (px/s), trail range (cells), share of empty columns,
// how much later each layer starts (s) and how spread the starts are (s)
export const LAYERS = [
  { alpha: 0.32, speed: [70, 140], trail: [10, 26], empty: 0.15 },
  { alpha: 0.65, speed: [130, 240], trail: [12, 28], empty: 0.15 },
  { alpha: 1, speed: [240, 420], trail: [10, 22], empty: 0.55 },
] as const;
const START = { spread: 2.2, layer: 0.25 };
// fixed: cells behind the head that still count as its tip (they change faster)
const TIP = 3;

// A stable number in [0, 1) from several integers
export function mix(...parts: number[]): number {
  let seed = 0;
  for (const part of parts) seed = Math.imul(seed ^ (part | 0), 0x27d4eb2d) + 0x165667b1;
  return hash(seed);
}

// The columns of a layer (0 far, 1 mid, 2 near) with glyphs of size px over width; density 0 to 1 empties columns
export function rainColumns(layer: number, size: number, options: RainOptions): RainColumn[] {
  const look = LAYERS[Math.min(LAYERS.length - 1, Math.max(0, layer))];
  const columns: RainColumn[] = [];
  for (let index = 0, x = size / 2; x < options.width; index++, x += size) {
    const random = (salt: number) => mix(options.seed, layer, index, salt);
    if (random(4) >= (1 - look.empty) * options.density) continue;
    columns.push({
      key: layer * 1000 + index, x,
      speed: look.speed[0] + random(2) * (look.speed[1] - look.speed[0]),
      start: random(3) * START.spread + layer * START.layer,
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

// Glyph index (of count) for a cell behind cells behind the head; it changes change.tip times per second at the tip,
// change.trail times in the trail
export function glyphAt(seed: number, column: RainColumn, row: number, behind: number, seconds: number, count: number, change: { tip: number; trail: number }): number {
  const rate = behind < TIP ? change.tip : change.trail;
  return Math.floor(mix(seed, column.key, row, Math.floor(seconds * rate + behind * 0.3)) * count);
}
