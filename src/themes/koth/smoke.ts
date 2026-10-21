// Smoke columns at the foot of the KOTH hill (DESIGN-KOTH.md "Modernisierung"): soft puffs that rise, drift, grow and
// fade, each placed from the time alone (periodic in the life of a puff, works for any still image). Pure; check:
// smoke.check.ts.
import { hash } from "../../core/hash.ts";

// fixed: places of the columns and their shade from the prototype (refs/starting.html), more for more columns
export const SMOKE_SPOTS = [[-16, -10, 0], [14, -14, 1], [-24, 8, 2], [22, 10, 1], [-6, -22, 0], [8, 24, 2]] as const;
// fixed: rise of one puff from the prototype
export const SMOKE_LIFE = 7;
const RISE = 14;
const DRIFT = 4;
const SWAY = 0.8;
const GROW = { from: 1.2, by: 5 };
const OPACITY = 0.55;

export type Puff = { x: number; y: number; z: number; scale: number; opacity: number };

// Puff index of count in a column (offset from its spot) at a time; puffs are spread evenly over the life
export function smokeAt(seed: number, index: number, count: number, time: number): Puff {
  const age = (((time / SMOKE_LIFE + index / count) % 1) + 1) % 1;
  const sway = hash(seed * 31 + index) * 6;
  return {
    x: Math.sin(age * 3 + sway) * SWAY + age * DRIFT,
    y: age * RISE,
    z: 0,
    scale: GROW.from + age * GROW.by,
    opacity: OPACITY * Math.sin(age * Math.PI),
  };
}
