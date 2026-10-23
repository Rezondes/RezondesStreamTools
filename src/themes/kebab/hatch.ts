// The meat on the spit (DESIGN-KEBAB.md "Spieß"): rows of short wavy strokes that repeat every `period` units, so
// sliding them sideways by the offset of the time turns the spit without a seam. The strokes are clipped to the cone
// (MEAT in chef.ts). Check: hatch.check.ts.
import { hash } from "../../core/hash.ts";

// fixed: the cone spans these heights of the grid; strokes start left of it and reach right of it, so the slide
// never shows an end
const TOP = 209;
const HEIGHT = 196;
const FROM_X = 240;
const COPIES = 10;
// fixed: stroke length from 15 to 27 units and wave height from 1.6 to 3, like the prototype
const LENGTH = { min: 15, spread: 12 };
const LIFT = { min: 1.6, spread: 1.4 };
// fixed: salts of the random values per row (offset, length, lift)
const SALT = { offset: 0, length: 40, lift: 80, seed: 1000 };

const fixed = (value: number) => value.toFixed(1);

export function meatHatch(seed: number, rows: number, period: number): string {
  const parts: string[] = [];
  for (let row = 0; row < rows; row++) {
    const salt = seed * SALT.seed + row;
    const y = TOP + (row * HEIGHT) / Math.max(1, rows - 1);
    const offset = hash(salt + SALT.offset) * period;
    const length = LENGTH.min + hash(salt + SALT.length) * LENGTH.spread;
    const lift = LIFT.min + hash(salt + SALT.lift) * LIFT.spread;
    for (let copy = -2; copy < COPIES - 2; copy++) {
      const x = FROM_X + offset + copy * period;
      parts.push(`M${fixed(x)} ${fixed(y)} q${fixed(length / 4)} ${fixed(-lift)} ${fixed(length / 2)} 0 t${fixed(length / 2)} 0`);
    }
  }
  return parts.join(" ");
}

// Slide of the strokes at time t in units (0 to -period): speed in units per second
export const hatchOffset = (time: number, speed: number, period: number) => (period > 0 ? -((time * speed) % period) : 0);
