// Movement of the Chaos screens after the build (DESIGN-CHAOS.md "Modernisierung"): scribbles boil like stop motion
// through three takes and drift a little, drips keep running and drop off, spray dust floats up. Everything from the
// time and the seed, so stills (?t=) show the same as the live scene; switched off, everything stands still.
// Check: idle.check.ts.
import { hash } from "../../core/hash.ts";

// fixed: neighbouring scribbles switch their take at different moments (phase share per index)
const PHASE = 0.37;
export const TAKES = 3;

// Take (0, 1, 2) of scribble index at seconds, fps takes per second; off = always the first take
export function boilTake(index: number, seconds: number, fps: number, on: boolean): number {
  if (!on || fps <= 0) return 0;
  return Math.floor(seconds * fps + index * PHASE) % TAKES;
}

// fixed: drift speeds of a scribble (x, y, turn) per second
const DRIFT = { x: 0.7, y: 0.5, turn: 0.6, lift: 1.4 };
export function driftAt(index: number, seconds: number, amount: number, on: boolean): { x: number; y: number; rotate: number } {
  if (!on || amount === 0) return { x: 0, y: 0, rotate: 0 };
  const phase = hash(index * 13 + 5) * 6;
  return {
    x: Math.sin(seconds * DRIFT.x + phase) * amount,
    y: Math.cos(seconds * DRIFT.y + phase) * amount * DRIFT.lift,
    rotate: Math.sin(seconds * DRIFT.turn + phase) * amount,
  };
}

// fixed: a drop forms at the tip of a run drip in the first share of a loop, then falls this far and fades
const DROP = { loop: 2.4, grow: 0.5, fall: 420 };
export type DripState = { run: number; drop: { offset: number; size: number; alpha: number } | null };

// A drip since seconds after the brush passed: it runs to its length; looping, a drop grows at its end, falls and a new
// one grows, the run itself never jumps back
export function dripAt(drip: { length: number; speed: number }, since: number, loop: boolean): DripState {
  if (since <= 0) return { run: 0, drop: null };
  const run = Math.min(drip.length, since * drip.speed);
  if (!loop || run < drip.length) return { run, drop: null };
  const phase = ((since - drip.length / drip.speed) % DROP.loop) / DROP.loop;
  if (phase < DROP.grow) return { run, drop: { offset: 0, size: phase / DROP.grow, alpha: 1 } };
  const fall = (phase - DROP.grow) / (1 - DROP.grow);
  return { run, drop: { offset: fall * fall * DROP.fall, size: 1, alpha: 1 - fall } };
}

// fixed: dust floats up through the stage and comes in again at the bottom
const STAGE = { width: 1920, height: 1080 };
const DUST = { sway: 30, speed: { min: 8, by: 18 }, size: { min: 1, by: 1.6 } };
export function dustAt(seed: number, index: number, seconds: number): { x: number; y: number; size: number; alpha: number; hot: boolean } {
  const random = (salt: number) => hash(seed * 7919 + index * 11 + salt);
  const phase = random(3) * 6;
  const rise = (random(1) * STAGE.height - seconds * (DUST.speed.min + random(2) * DUST.speed.by)) % STAGE.height;
  return {
    x: random(0) * STAGE.width + Math.sin(seconds * 0.4 + phase) * DUST.sway,
    y: rise < 0 ? rise + STAGE.height : rise,
    size: DUST.size.min + random(4) * DUST.size.by,
    alpha: 0.35 + 0.25 * Math.sin(seconds * 2 + phase),
    hot: random(5) > 0.5,
  };
}
