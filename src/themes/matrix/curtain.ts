// The rain curtain and the dissolve of the Matrix alert (PLAN-MATRIX.md package 3, refs/alert.html): before the box
// switches on, glyph heads pour down over its place and stop at its bottom edge, the trails fading; when the alert
// leaves, the box falls apart into glyphs, the bottom rows first, each falling once and gone at the end. Everything
// from seed and time (rule 21). Check: curtain.check.ts.
import { mix } from "./rain.ts";

export type Area = { width: number; height: number };
export type Glyph = { x: number; y: number; alpha: number; key: number; head: boolean };

// fixed: how long a curtain pours (s at speed 1), how spread the starts of its columns are (share), how fast a head falls
// (box heights per s), the trail (cells)
const CURTAIN = { length: 0.7, spread: 0.45, fall: 2.4, trail: 6 };
// fixed: how much of the dissolve the start delay of the rows takes (share), gravity (px/s²), sideways drift (px/s)
const DISSOLVE = { delay: 0.5, gravity: 1800, drift: 60 };

// How long the curtain pours at speed (s)
export const curtainLength = (speed: number) => CURTAIN.length / Math.max(speed, Number.EPSILON);

// The glyphs of the curtain over an area of cell px glyphs at seconds since it started; empty once it is over
export function curtainAt(area: Area, cell: number, seconds: number, speed: number, seed: number): Glyph[] {
  const length = curtainLength(speed);
  if (seconds < 0 || seconds >= length) return [];
  const columns = Math.floor(area.width / cell);
  const glyphs: Glyph[] = [];
  for (let column = 0; column < columns; column++) {
    const start = mix(seed, column, 1) * CURTAIN.spread * length;
    const head = (seconds - start) * CURTAIN.fall * speed * area.height;
    if (head < 0) continue;
    for (let behind = 0; behind < CURTAIN.trail; behind++) {
      const y = Math.min(head, area.height - cell / 2) - behind * cell;
      if (y < 0) break;
      const fade = 1 - seconds / length;
      glyphs.push({ x: (column + 0.5) * cell, y, alpha: (1 - behind / CURTAIN.trail) * fade, key: column * 97 + Math.floor(y / cell), head: behind === 0 });
    }
  }
  return glyphs;
}

// The cells of the box falling apart at seconds since the dissolve started (over duration s)
export function dissolveAt(area: Area, cell: number, seconds: number, duration: number, seed: number): Glyph[] {
  if (seconds < 0 || seconds >= duration) return [];
  const rows = Math.ceil(area.height / cell);
  const columns = Math.ceil(area.width / cell);
  const glyphs: Glyph[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const life = cellLife(row, rows, duration, mix(seed, row, column));
      const since = seconds - life.start;
      if (since >= life.length) continue;
      const falling = Math.max(0, since);
      glyphs.push({
        x: (column + 0.5) * cell + (mix(seed, column, row, 2) - 0.5) * DISSOLVE.drift * falling,
        y: (row + 0.5) * cell + (DISSOLVE.gravity * falling * falling) / 2,
        alpha: since < 0 ? 1 : 1 - since / life.length, key: row * 997 + column, head: false,
      });
    }
  }
  return glyphs;
}

// When a cell of a row starts falling and how long it falls: the bottom rows first, every cell gone at duration
export function cellLife(row: number, rows: number, duration: number, jitter: number): { start: number; length: number } {
  const lower = rows <= 1 ? 1 : row / (rows - 1);
  const start = (1 - lower) * DISSOLVE.delay * duration * (0.8 + 0.2 * jitter);
  return { start, length: duration - start };
}
