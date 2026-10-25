// The rain curtain and the dissolve of the Matrix alert (PLAN-MATRIX.md package 3, refs/alert.html): before the box
// switches on, glyph heads pour down over its place and stop at its bottom edge, the trails fading; when the alert
// leaves, the box falls apart into glyphs, the bottom rows first, each falling once and gone at the end. Everything
// from seed and time (rule 21). Check: curtain.check.ts.
import { mix } from "./rain.ts";
import type { MatrixValues } from "./settings.ts";

export type Area = { width: number; height: number };
export type Glyph = { x: number; y: number; alpha: number; key: number; head: boolean };

// The look (settings): how long a curtain pours (s at speed 1), how spread the starts of its columns are (share), how
// fast a head falls (box heights per s), the trail (cells); how much of the dissolve the start delay of the rows takes
// (share), gravity (px/s²), sideways drift (px/s)
export type CurtainLook = { length: number; spread: number; fall: number; trail: number; delay: number; gravity: number; drift: number };

export const curtainLookOf = (values: MatrixValues): CurtainLook => ({
  length: values.alertCurtainLength, spread: values.alertCurtainSpread, fall: values.alertCurtainFall, trail: values.alertCurtainTrail,
  delay: values.alertDissolveDelay, gravity: values.alertDissolveGravity, drift: values.alertDissolveDrift,
});

// How long the curtain pours at speed (s)
export const curtainLength = (speed: number, look: CurtainLook) => look.length / Math.max(speed, Number.EPSILON);

// The glyphs of the curtain over an area of cell px glyphs at seconds since it started; empty once it is over
export function curtainAt(area: Area, cell: number, seconds: number, speed: number, seed: number, look: CurtainLook): Glyph[] {
  const length = curtainLength(speed, look);
  if (seconds < 0 || seconds >= length) return [];
  const columns = Math.floor(area.width / cell);
  const glyphs: Glyph[] = [];
  for (let column = 0; column < columns; column++) {
    const start = mix(seed, column, 1) * look.spread * length;
    const head = (seconds - start) * look.fall * speed * area.height;
    if (head < 0) continue;
    for (let behind = 0; behind < look.trail; behind++) {
      const y = Math.min(head, area.height - cell / 2) - behind * cell;
      if (y < 0) break;
      const fade = 1 - seconds / length;
      glyphs.push({ x: (column + 0.5) * cell, y, alpha: (1 - behind / look.trail) * fade, key: column * 97 + Math.floor(y / cell), head: behind === 0 });
    }
  }
  return glyphs;
}

// The cells of the box falling apart at seconds since the dissolve started (over duration s)
export function dissolveAt(area: Area, cell: number, seconds: number, duration: number, seed: number, look: CurtainLook): Glyph[] {
  if (seconds < 0 || seconds >= duration) return [];
  const rows = Math.ceil(area.height / cell);
  const columns = Math.ceil(area.width / cell);
  const glyphs: Glyph[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const life = cellLife(row, rows, duration, mix(seed, row, column), look.delay);
      const since = seconds - life.start;
      if (since >= life.length) continue;
      const falling = Math.max(0, since);
      glyphs.push({
        x: (column + 0.5) * cell + (mix(seed, column, row, 2) - 0.5) * look.drift * falling,
        y: (row + 0.5) * cell + (look.gravity * falling * falling) / 2,
        alpha: since < 0 ? 1 : 1 - since / life.length, key: row * 997 + column, head: false,
      });
    }
  }
  return glyphs;
}

// When a cell of a row starts falling and how long it falls: the bottom rows first, every cell gone at duration; delay:
// how much of the duration the start delay of the top row takes
export function cellLife(row: number, rows: number, duration: number, jitter: number, delay: number): { start: number; length: number } {
  const lower = rows <= 1 ? 1 : row / (rows - 1);
  const start = (1 - lower) * delay * duration * (0.8 + 0.2 * jitter);
  return { start, length: duration - start };
}
