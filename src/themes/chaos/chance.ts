// Deterministic chance for the Chaos theme: a stream of values from a seed (built on the shared hash of the core, rule
// 21), so every scene, stinger and banner draws the same chaos for the same settings. Check: chance.check.ts.
import { hash } from "../../core/hash.ts";

// A stream of values from 0 to below 1; the same seed gives the same stream
export type Chance = () => number;

// Distance between two seeds, so streams of neighbouring seeds do not overlap
const SPREAD = 7919;

export function chance(seed: number): Chance {
  let step = 0;
  return () => hash(seed * SPREAD + step++);
}

// A value between low and high
export const between = (random: Chance, low: number, high: number) => low + random() * (high - low);

// One of the entries, each with its weight
export function weighted<T>(random: Chance, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}
