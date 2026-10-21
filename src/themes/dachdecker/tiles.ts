// Slate tiles of the Dachdecker theme as data (src/themes/dachdecker/docs/PLAN-DACHDECKER.md, package 1): position,
// rotation and the copper mark of every tile, rows from the eaves upwards, every second row offset by half a tile.
// Copper tiles come from chance with the seed of the settings. Check: tiles.check.ts.
import { chance } from "../../core/three/chance.ts";
import type { Point3 } from "../../core/three/beam.ts";
import { frameDepth, type FrameDims } from "./frame.ts";

// Size of a tile in metres: width along the rafter, height, depth along the ridge
export const TILE = { width: 0.5, height: 0.035, depth: 0.46 };

export type Tile = { position: Point3; rotation: Point3; copper: boolean; row: number; side: 1 | -1 };

// fixed: the tile size fits this many rows on a face; more rows than that are not laid
export const FACE_ROWS = 11;
// Tiles lie a little above the rafter line; every second row tilts the other way
const LIFT = 0.2;
const TILT = 0.04;
const TWIST = 0.05;
// Gables: tiles stay within the purlin ends
const GABLE = 0.5;

// rows: rows from the eaves (at most FACE_ROWS); sides: 1 = only the right face, 2 = both
export function tileLayout(dims: FrameDims, rows: number, seed: number, copperShare: number, sides: 1 | 2): Tile[] {
  const random = chance(seed);
  const half = dims.span / 2;
  const reach = 1 + dims.overhang;
  const slope = Math.atan2(dims.rise, half);
  const back = -frameDepth(dims) - GABLE;
  const laid = Math.min(FACE_ROWS, Math.max(0, Math.round(rows)));
  const tiles: Tile[] = [];
  const faces: readonly Tile["side"][] = sides === 2 ? [1, -1] : [1];
  for (const side of faces) {
    for (let row = 0; row < laid; row++) {
      // 0 at the eaves (with the overhang), 1 at the ridge
      const part = (row + 0.5) / FACE_ROWS;
      const x = side * half * reach * (1 - part);
      const y = -dims.rise * dims.overhang + part * dims.rise * reach + LIFT;
      const tilt = row % 2 ? TILT : -TILT;
      for (let depth = GABLE - TILE.depth / 2 - (row % 2) * (TILE.width / 2); depth - TILE.depth / 2 >= back; depth -= TILE.width) {
        tiles.push({ position: [x, y, depth], rotation: [tilt, 0, side * -(slope + TWIST)], copper: random.next() < copperShare, row, side });
      }
    }
  }
  return tiles;
}
