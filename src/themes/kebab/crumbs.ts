// Onion rings and meat curls that fly off when a stamp hits or a bag lands (DESIGN-KEBAB.md "Bewegung"): a burst of the
// core (burstAt) upwards and to the sides, every third piece an onion ring, the others curls; pure function of the time
// since the hit. Check: crumbs.check.ts.
import { burstAt } from "../../core/motion/burst.ts";

type Crumb = { x: number; y: number; angle: number; opacity: number; ring: boolean; size: number };

// fixed: up with a wide spread, speeds in px/s, gravity, a little drag, life in s, sizes in px, like the prototype
const BURST = { direction: -Math.PI / 2, spread: 3.2, speed: [260, 780] as const, gravity: 1400, drag: 0.4, life: 1.4 };
const SIZE = { ring: 5, curl: 7, spread: 6 };
const RING_EVERY = 3;

export const CRUMB_LIFE = BURST.life;

export function crumbsAt(seed: number, count: number, time: number, origin: { x: number; y: number }): Crumb[] {
  if (time < 0 || time >= BURST.life) return [];
  return burstAt(seed, count, time, { origin, ...BURST }).map((particle, index) => ({
    ...particle,
    ring: index % RING_EVERY === 0,
    size: (index % RING_EVERY === 0 ? SIZE.ring : SIZE.curl) + ((index * 7) % SIZE.spread),
  }));
}
