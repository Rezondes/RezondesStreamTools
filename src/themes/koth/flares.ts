// Flares over the KOTH hill in the Ending (PLAN-KOTH.md package 3): a rocket rises from the foot of the hill, bursts at
// its highest point and its sparks sink and fade (burstAt of the core turned around the vertical axis). A new flare
// every few seconds, colors in turn. Pure function of the time; check: flares.check.ts.
import { hash } from "../../core/hash.ts";
import { burstAt } from "../../core/motion/burst.ts";
import type { Point3 } from "../../core/three/beam.ts";

export type FlareOptions = { every: number; sparks: number; colors: number };
export type Spark = { position: Point3; opacity: number };
export type Flare = { index: number; color: number; rocket: Point3 | null; sparks: Spark[] };

// fixed: flight of a flare in m and s, the burst of its sparks
const RISE = { seconds: 1.4, from: 12, to: 17, spread: 22 };
const BURST = { speed: [4, 9] as const, gravity: 3.5, drag: 1.2, life: 2.6 };
export const FLARE_LIFE = RISE.seconds + BURST.life;

const outQuad = (share: number) => 1 - (1 - share) ** 2;

function flareAt(seed: number, index: number, age: number, options: FlareOptions): Flare {
  const random = (salt: number) => hash(seed * 977 + index * 7 + salt);
  const x = (random(0) - 0.5) * RISE.spread;
  const depth = (random(1) - 0.5) * RISE.spread;
  const apex = RISE.from + random(2) * (RISE.to - RISE.from);
  const color = index % options.colors;
  if (age < RISE.seconds) return { index, color, rocket: [x, apex * outQuad(age / RISE.seconds), depth], sparks: [] };
  const burst = burstAt(seed * 131 + index, options.sparks, age - RISE.seconds, {
    origin: { x: 0, y: 0 }, direction: -Math.PI / 2, spread: Math.PI * 2, speed: BURST.speed, gravity: BURST.gravity, drag: BURST.drag, life: BURST.life,
  });
  const sparks = burst.map((spark, sparkIndex) => {
    const turn = hash(seed * 53 + index * 1009 + sparkIndex) * Math.PI * 2;
    return { position: [x + spark.x * Math.cos(turn), apex - spark.y, depth + spark.x * Math.sin(turn)] as Point3, opacity: spark.opacity };
  });
  return { index, color, rocket: null, sparks };
}

// All flares in the air at a time since the first launch
export function flaresAt(seed: number, time: number, options: FlareOptions): Flare[] {
  if (time < 0 || options.every <= 0) return [];
  const latest = Math.floor(time / options.every);
  const first = Math.max(0, latest - Math.ceil(FLARE_LIFE / options.every));
  const flares: Flare[] = [];
  for (let index = first; index <= latest; index++) {
    const age = time - index * options.every;
    if (age < FLARE_LIFE) flares.push(flareAt(seed, index, age, options));
  }
  return flares;
}
