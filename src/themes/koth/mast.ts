// Radio mast on the KOTH summit (DESIGN-KOTH.md "Modernisierung"): a lattice tower of three legs with zigzag braces as
// line segments in build order from the bottom to the top, guy wires to three anchors on the ground, and the heights of
// dish, platform and beacon. Pure; check: mast.check.ts.
import type { Point3 } from "../../core/three/beam.ts";

export type Segment = { from: Point3; to: Point3 };

// fixed: the shape of the tower from the prototype (refs/starting.html)
const LEGS = 3;
const FOOT = 0.9;
const TAPER = 0.075;
const LEVEL = 0.9;
const ANCHOR_RADIUS = 7.5;
const ANCHOR_TURN = 0.5;
const WIRE_HEIGHTS = [0.85, 0.5];
export const DISH_HEIGHT = 0.7;
export const PLATFORM_HEIGHT = 0.55;

// Point of a leg at a height above the base; the tower tapers towards the top (never below a thin top)
function legAt(leg: number, lift: number, base: number): Point3 {
  const angle = (leg * Math.PI * 2) / LEGS;
  const spread = Math.max(0.15, FOOT - lift * TAPER);
  return [Math.cos(angle) * spread, base + lift, Math.sin(angle) * spread];
}

// Per level of 0.9 m: the three legs and one brace per side, level by level from the bottom
export function mastSegments(base: number, height: number): Segment[] {
  const segments: Segment[] = [];
  for (let lift = 0; lift < height - 1e-9; lift += LEVEL) {
    const top = Math.min(height, lift + LEVEL);
    for (let leg = 0; leg < LEGS; leg++) {
      segments.push({ from: legAt(leg, lift, base), to: legAt(leg, top, base) });
      segments.push({ from: legAt(leg, lift, base), to: legAt((leg + 1) % LEGS, top, base) });
    }
  }
  return segments;
}

// Two guy wires per anchor (from 85 % and 50 % of the height), the anchors on the ground
export function mastWires(base: number, height: number, ground: (x: number, depth: number) => number): Segment[] {
  return Array.from({ length: LEGS }, (_, leg) => {
    const angle = (leg * Math.PI * 2) / LEGS + ANCHOR_TURN;
    const x = Math.cos(angle) * ANCHOR_RADIUS;
    const depth = Math.sin(angle) * ANCHOR_RADIUS;
    const anchor: Point3 = [x, ground(x, depth), depth];
    return WIRE_HEIGHTS.map(share => ({ from: [0, base + height * share, 0] as Point3, to: anchor }));
  }).flat();
}
