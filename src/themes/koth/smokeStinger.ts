// Smoke grenade of the KOTH stinger (PLAN-KOTH.md package 5): the grenade rolls in and pops, its smoke grows from
// burstAt until it covers the picture at the transition point, the flag changes in the smoke, then the smoke clears.
// Pure functions of the time and the seed; check: smokeStinger.check.ts.
import { hash } from "../../core/hash.ts";
import { burstAt } from "../../core/motion/burst.ts";

export type SmokeTiming = { duration: number; cut: number };
export type SmokePuff = { x: number; y: number; z: number; scale: number; opacity: number };

// fixed: the grenade pops after a quarter of the way to the cut and rolls in from 9 m left; the smoke cloud in m and s
const POP_SHARE = 0.25;
const ROLL = { from: -9, radius: 0.12 };
const CLOUD = { speed: [2, 7] as const, gravity: -0.6, drag: 0.8, spread: Math.PI * 1.6, depth: 4, grow: 3.5, size: 0.8 };

const smooth = (share: number) => share * share * (3 - 2 * share);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const popAt = (timing: SmokeTiming) => timing.cut * POP_SHARE;

// How much the smoke covers the picture: 0 until the pop, 1 at the cut, 0 again at the end
export function smokeCover(time: number, timing: SmokeTiming): number {
  const pop = popAt(timing);
  if (time <= pop || time >= timing.duration) return 0;
  if (time <= timing.cut) return smooth(clamp01((time - pop) / (timing.cut - pop)));
  return 1 - smooth(clamp01((time - timing.cut) / (timing.duration - timing.cut)));
}

// The grenade rolls to the middle until it pops, turning as it rolls; gone after the pop
export function grenadeAt(time: number, timing: SmokeTiming) {
  const share = clamp01(time / popAt(timing));
  const x = ROLL.from * (1 - share) ** 2;
  return { x, spin: (x - ROLL.from) / ROLL.radius, visible: time < popAt(timing) };
}

// The puffs of the cloud around the grenade, growing with the cover
export function smokePuffs(seed: number, count: number, time: number, timing: SmokeTiming): SmokePuff[] {
  const since = time - popAt(timing);
  const cover = smokeCover(time, timing);
  return burstAt(seed, count, since, {
    origin: { x: 0, y: 0 }, direction: -Math.PI / 2, spread: CLOUD.spread, speed: CLOUD.speed, gravity: CLOUD.gravity, drag: CLOUD.drag, life: timing.duration,
  }).map((puff, index) => ({
    x: puff.x,
    y: Math.max(0, -puff.y),
    z: (hash(seed * 29 + index) - 0.5) * CLOUD.depth,
    scale: CLOUD.size + cover * CLOUD.grow * (0.6 + hash(seed * 31 + index) * 0.8),
    opacity: since > 0 ? cover : 0,
  }));
}

// Which flag shows: the first faction before the cut, the second after it
export const flagSide = (time: number, cut: number) => (time < cut ? 0 : 1);
