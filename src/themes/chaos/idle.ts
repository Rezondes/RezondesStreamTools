// Movement of the Chaos screens after the build (DESIGN-CHAOS.md "Modernisierung"): scribbles boil like stop motion
// through three takes and drift a little, drips keep running and drop off, spray dust floats up. Everything from the
// time and the seed, so stills (?t=) show the same as the live scene; switched off, everything stands still.
// Check: idle.check.ts.
import { hash } from "../../core/hash.ts";

// fixed: neighbouring scribbles switch their take at different moments (phase share per index)
const PHASE = 0.37;
export const TAKES = 3;

// Take (0, 1, 2) of scribble index at seconds, fps takes per second; off = always the first take. At 0 every scribble
// shows the first take and leaves it at its own moment within the first step, so a boil that starts never switches
// many at once
export function boilTake(index: number, seconds: number, fps: number, on: boolean): number {
  if (!on || fps <= 0) return 0;
  const phase = (index * PHASE) % 1;
  return Math.floor(Math.max(0, seconds) * fps + phase) % TAKES;
}

// How far the movement after the build has come in, since seconds after it started: 0 before, smoothly up to 1 after
// ease seconds, so drift, shimmer and dust grow in instead of jumping on in one frame
export function idleShare(since: number, ease: number): number {
  if (since <= 0) return 0;
  if (since >= ease) return 1;
  const share = since / ease;
  return share * share * (3 - 2 * share);
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
type DripState = { run: number; drop: { offset: number; size: number; alpha: number } | null };

// A drip since seconds after the brush passed: it runs to its length; looping from loopFrom on (seconds since the brush
// passed, null without the loop), a drop grows at its end, falls and a new one grows; the first drop starts small even
// when the loop starts late, the run itself never jumps back
export function dripAt(drip: { length: number; speed: number }, since: number, loopFrom: number | null): DripState {
  if (since <= 0) return { run: 0, drop: null };
  const run = Math.min(drip.length, since * drip.speed);
  const start = Math.max(drip.length / drip.speed, loopFrom ?? Infinity);
  if (since < start) return { run, drop: null };
  const phase = ((since - start) % DROP.loop) / DROP.loop;
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

// fixed: where the neon dips within its cycle (share of the cycle, how long, how deep times the flicker strength)
const FLICKER = [{ at: 0.41, length: 0.02, depth: 0.7 }, { at: 0.71, length: 0.01, depth: 0.5 }] as const;

// Opacity of the neon scribbles at seconds: 1, but twice per cycle it dips for a moment
export function flickerAt(seconds: number, cycle: number, strength: number): number {
  const phase = (((seconds % cycle) + cycle) % cycle) / cycle;
  const dip = FLICKER.find(step => phase >= step.at && phase < step.at + step.length);
  return dip ? 1 - strength * dip.depth : 1;
}

// fixed: the glitch at the end of each glitchEvery: two slices (share of the cycle, how long, shift factor, clip)
const GLITCH = [
  { at: 0.96, length: 0.01, shift: 1, clip: "inset(10% 0% 55% 0%)" },
  { at: 0.97, length: 0.01, shift: -0.6, clip: "inset(48% 0% 18% 0%)" },
] as const;
type GlitchSlice = { shift: number; clip: string };

// The slice of the title glitch shown at seconds, null between the glitches
export function glitchAt(seconds: number, every: number): GlitchSlice | null {
  const phase = (((seconds % every) + every) % every) / every;
  const slice = GLITCH.find(step => phase >= step.at && phase < step.at + step.length);
  return slice ? { shift: slice.shift, clip: slice.clip } : null;
}
