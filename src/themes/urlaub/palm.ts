// The palms of the realistic Urlaub beach (PLAN-URLAUB.md package 5): where they stand (left and right of the view, the
// foot set into the sand at its height), the trunk as a curve leaning into the view, the fronds as bent strips hanging
// outward and down toward their tips, and their sway from the time. World units as in shore.ts. Check: palm.check.ts.
import { shoreHeight } from "./shore.ts";

type Point = [number, number, number];
export type Palm = { base: Point; height: number; lean: number; turn: number };

// fixed: the palms of the prototype per side (x, z, height, lean into the view, turn of the crown), up to three each
const LEFT = [[-12.5, 13, 12, 2.4, 0.3], [-16, 10, 9.5, 1.6, 1.2], [-20, 15, 10.5, 2, 2.4]] as const;
const RIGHT = [[13.5, 12, 11, -2.2, 2], [17, 9, 9, -1.4, 0.7], [21, 14, 10, -1.8, 1.6]] as const;
// fixed: how deep the foot sits in the sand
const SUNK = 0.2;

export function palmLayout(left: number, right: number): Palm[] {
  const place = ([x, depth, height, lean, turn]: readonly number[]): Palm => ({ base: [x, shoreHeight(x, depth) - SUNK, depth], height, lean, turn });
  return [...LEFT.slice(0, left).map(place), ...RIGHT.slice(0, right).map(place)];
}

// The trunk from the foot to the crown: four points of a smooth curve
export function trunkPoints(palm: Palm): Point[] {
  const [x, y, depth] = palm.base;
  return [[0, 0], [0.3, 0.35], [0.75, 0.7], [1, 1]].map(([lean, up]) => [x + palm.lean * lean, y + palm.height * up, depth] as Point);
}

// fixed: a frond is this long, this wide, its tip hangs this far, and it gets narrower toward the tip
export const FROND = { length: 6.5, width: 1.7, droop: 3.2, narrow: 0.3, cup: 0.35 };

// A point of a frond in its own frame: along (0 at the crown to 1 at the tip) and across (-0.5 to 0.5); the frond hangs
// down quadratically toward its tip and cups a little
export function frondPoint(along: number, across: number): Point {
  const width = FROND.width * across * (1 - along * FROND.narrow);
  return [along * FROND.length, width, -along * along * FROND.droop + Math.abs(width) * FROND.cup];
}

// The sway of a frond in radians at seconds: its phase, the palm, the sway in degrees
export const frondSway = (seconds: number, phase: number, palm: number, degrees: number) =>
  Math.sin(seconds * 1.3 + phase + palm) * ((degrees * Math.PI) / 180);
