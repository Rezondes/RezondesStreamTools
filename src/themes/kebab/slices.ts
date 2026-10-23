// The stinger "messer" as pure functions of the time (DESIGN-KEBAB.md "Stinger", prototype refs/stinger.html): a long
// knife crosses the picture from bottom left to top right, slices of meat slide in behind it from the left (the lowest
// first) and cover the picture at the cut, then they fall off with a turn. Shavings fly off the blade. Sizes in px of
// the 1920 x 1080 picture, times in s of a stinger of 1.6 s with its cut at 0.8 s. Check: slices.check.ts.
import { hash } from "../../core/hash.ts";
import { PICTURE } from "./wrap.ts";

// fixed: the timing and the moves of the prototype
const KNIFE = { start: 0.02, cross: 0.75, from: { x: -1500, y: 1250 }, way: { x: 3800, y: -1500 }, angle: -21.5, length: 1500 };
export const SLICE = { enter: 0.1, stagger: 0.04, slide: 0.34, fall: 0.9, fallSpread: 0.12, drop: 0.6, depth: 1300, turn: 24, from: -2000 };
const SHAVINGS = { born: 0.06, every: 0.012, life: 0.9, along: { min: 300, spread: 1100 }, below: 80, drift: 500, sink: { min: 150, spread: 300 }, gravity: 1800 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const inOut = (share: number) => (share < 0.5 ? 2 * share * share : 1 - (-2 * share + 2) ** 2 / 2);

// Where the back of the blade is at a time and its angle in degrees
export function knifeAt(time: number): { x: number; y: number; angle: number } {
  const share = inOut(clamp01((time - KNIFE.start) / KNIFE.cross));
  return { x: KNIFE.from.x + share * KNIFE.way.x, y: KNIFE.from.y + share * KNIFE.way.y, angle: KNIFE.angle };
}

// Where one slice is: its shift from the left, its drop and turn (degrees) after the cut
export function sliceAt(row: number, rows: number, time: number, seed: number): { x: number; y: number; turn: number } {
  const enter = SLICE.enter + (rows - 1 - row) * SLICE.stagger;
  const slid = 1 - (1 - clamp01((time - enter) / SLICE.slide)) ** 3;
  const fallStart = SLICE.fall + hash(seed * 100 + row) * SLICE.fallSpread;
  const fallen = clamp01((time - fallStart) / SLICE.drop) ** 2;
  // + 0 turns a -0 at rest into 0
  return { x: SLICE.from * (1 - slid) + 0, y: fallen * SLICE.depth, turn: fallen * (hash(seed * 100 + row + 50) - 0.5) * SLICE.turn + 0 };
}

export const sliceHeight = (rows: number) => PICTURE.height / Math.max(1, rows);

// Shavings that left the edge of the blade, each born at its own time, falling and fading
export function shavingsOffKnife(time: number, count: number, seed: number): { x: number; y: number; spin: number; alpha: number }[] {
  const radians = (KNIFE.angle * Math.PI) / 180;
  return Array.from({ length: count }, (_, index) => {
    const born = SHAVINGS.born + index * SHAVINGS.every;
    const age = time - born;
    if (age < 0 || age > SHAVINGS.life) return null;
    const origin = knifeAt(born);
    const along = SHAVINGS.along.min + hash(seed * 1000 + index) * SHAVINGS.along.spread;
    const x = origin.x + Math.cos(radians) * along + (hash(seed * 1000 + index + 9) - 0.5) * SHAVINGS.drift * age;
    const y = origin.y + Math.sin(radians) * along + SHAVINGS.below + (SHAVINGS.sink.min + hash(seed * 1000 + index + 19) * SHAVINGS.sink.spread) * age + 0.5 * SHAVINGS.gravity * age * age;
    return { x, y, spin: hash(seed * 1000 + index + 29) * 6 + age * 10, alpha: 1 - age / SHAVINGS.life };
  }).filter(shaving => shaving !== null);
}
