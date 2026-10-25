// Onion rings and meat curls that fly off when a stamp hits or a bag lands (DESIGN-KEBAB.md "Bewegung"): a burst of the
// core (burstAt) upwards and to the sides, every third piece an onion ring, the others curls; pure function of the time
// since the hit. Check: crumbs.check.ts.
import { burstAt } from "../../core/motion/burst.ts";
import type { KebabValues } from "./settings.ts";

type Crumb = { x: number; y: number; angle: number; opacity: number; ring: boolean; size: number };

// The burst of the settings: speeds in px/s, gravity, drag, life in s, spread in radians, sizes in px
export type CrumbLook = { speed: readonly [number, number]; gravity: number; drag: number; life: number; spread: number; ring: number; curl: number };

// fixed: the burst goes up, every third piece is a ring and each piece is up to 6 px bigger, like the prototype
const DIRECTION = -Math.PI / 2;
const SIZE_SPREAD = 6;
const RING_EVERY = 3;

export const crumbLookOf = (values: KebabValues): CrumbLook => ({
  speed: [values.crumbSpeedMin, values.crumbSpeedMax], gravity: values.crumbGravity, drag: values.crumbDrag, life: values.crumbLife,
  spread: values.crumbSpread, ring: values.crumbRing, curl: values.crumbCurl,
});

export function crumbsAt(seed: number, count: number, time: number, origin: { x: number; y: number }, look: CrumbLook): Crumb[] {
  if (time < 0 || time >= look.life) return [];
  const { speed, gravity, drag, life, spread } = look;
  return burstAt(seed, count, time, { origin, direction: DIRECTION, spread, speed, gravity, drag, life }).map((particle, index) => ({
    ...particle,
    ring: index % RING_EVERY === 0,
    size: (index % RING_EVERY === 0 ? look.ring : look.curl) + ((index * 7) % SIZE_SPREAD),
  }));
}
