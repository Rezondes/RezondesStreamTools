// The wall of the Chaos theme: dark violet blotches that make it uneven and the dust of fine spray dots over everything,
// placed on the 1920x1080 stage. Only places and sizes; colors come from the settings. Pure and deterministic from a
// seed. Check: wall.check.ts.
import { STAGE } from "../../core/screens/screens.ts";
import { between, chance, weighted } from "./chance.ts";

export type Blotch = { x: number; y: number; radiusX: number; radiusY: number; deep: boolean; opacity: number };
type DustColor = "color1" | "color2" | "lilac" | "white";
export type Dust = { x: number; y: number; radius: number; color: DustColor; opacity: number };

// Large soft violet stains, a third of them deeper
export const blotches = (seed: number, count: number): Blotch[] => {
  const random = chance(seed);
  return Array.from({ length: count }, () => ({
    x: between(random, 0, STAGE.width),
    y: between(random, 0, STAGE.height),
    radiusX: between(random, 120, 360),
    radiusY: between(random, 80, 240),
    deep: random() < 1 / 3,
    opacity: between(random, 0.25, 0.5),
  }));
};

// Fine spray dots over the whole stage, mostly faint
export const dust = (seed: number, count: number): Dust[] => {
  const random = chance(seed);
  return Array.from({ length: count }, () => ({
    x: between(random, 0, STAGE.width),
    y: between(random, 0, STAGE.height),
    radius: between(random, 0.4, 1.3),
    color: weighted(random, [["lilac", 1], ["white", 1], ["color1", 1], ["color2", 1]] as const),
    opacity: between(random, 0.05, 0.35),
  }));
};
