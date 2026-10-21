// Fixed randomness for 3D scenes and clips (plans/PLAN-GRAFIK.md, package 3): a sequence of values from 0 to below 1 from
// a seed, built on the shared hash (rule 21). Same seed, same sequence; scenes and clips use the same interface.
import { hash } from "../hash.ts";

export type Chance = { next: () => number; between: (min: number, max: number) => number };

export function chance(seed: number): Chance {
  let index = 0;
  const next = () => hash(seed * 7919 + index++);
  return { next, between: (min, max) => min + (max - min) * next() };
}
