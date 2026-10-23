// The print of the wrapping paper (DESIGN-KEBAB.md "Einwickelpapier", prototype refs/stinger.html): a tile of 220 px
// with two small spits, slightly turned; and the spit itself as outlines around its middle, the same small spit the bag
// carries. Only shapes. Check: pattern.check.ts.

export const TILE = 220;
// fixed: where the two spits sit in a tile and how far they are turned (degrees), like the prototype
export const TILE_SPITS = [{ x: 55, y: 60, turn: -12 }, { x: 165, y: 165, turn: 14 }];
// The small spit around its middle: bar and rod, cone, the strokes of the meat
export const SPIT_ICON = [
  "M-12 -34 L12 -34 M0 -34 L0 -26 M0 30 L0 38",
  "M-11 -26 C-4 -28 4 -28 11 -26 C15 -8 15 10 9 22 L6 30 L-6 30 L-9 22 C-15 10 -15 -8 -11 -26 Z",
  "M-7 -16 Q-3 -18 1 -16 M-2 -6 Q2 -8 6 -6 M-8 4 Q-4 2 0 4 M-1 14 Q3 12 7 14",
];

// The spits of the print that touch a picture of the given size, tile by tile (with a margin so turned ones at the
// edges are not cut)
export function printSpits(width: number, height: number): { x: number; y: number; turn: number }[] {
  const spits = [];
  for (let top = -TILE; top < height + TILE; top += TILE) {
    for (let left = -TILE; left < width + TILE; left += TILE) {
      for (const spit of TILE_SPITS) spits.push({ x: left + spit.x, y: top + spit.y, turn: spit.turn });
    }
  }
  return spits;
}
