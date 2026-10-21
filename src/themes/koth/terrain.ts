// Ground of the KOTH world (DESIGN-KOTH.md "Modernisierung"): a low-poly hill in the middle, small dunes around it and a
// ring of far mountains. Everything that stands on the ground takes its height from hillHeight, nothing floats. Pure;
// check: terrain.check.ts.
import { chance } from "../../core/three/chance.ts";

// fixed: size of the ground in m and its divisions (the low-poly look)
export const WORLD_SIZE = 160;
export const WORLD_SEGMENTS = 90;
// fixed: width of the hill (gauss spread in m²)
const SPREAD = 90;

// Height in m at x, depth (the z axis): the hill falls off from the summit, the dunes take over where it ends. The dunes
// fade towards the summit, so the summit stays the highest point.
export function hillHeight(x: number, depth: number, height: number): number {
  const hill = Math.exp(-(x * x + depth * depth) / SPREAD);
  const dunes = 0.55 * Math.sin(x * 0.45) * Math.cos(depth * 0.38) + 0.3 * Math.sin(x * 1.3 + depth * 0.7);
  return height * hill + dunes * (1 - hill);
}

export type Mountain = { x: number; z: number; radius: number; height: number; sides: number; turn: number };

// fixed: number of mountains in the ring
const MOUNTAINS = 16;

// The far ring: low cones around the world, faded by the fog
export function mountainRing(seed: number): Mountain[] {
  const random = chance(seed);
  return Array.from({ length: MOUNTAINS }, (_, index) => {
    const angle = (index / MOUNTAINS) * Math.PI * 2 + random.between(0, 0.2);
    const distance = random.between(170, 195);
    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      height: random.between(9, 18),
      radius: random.between(34, 52),
      sides: 5 + Math.floor(random.between(0, 3)),
      turn: random.between(0, 3),
    };
  });
}
