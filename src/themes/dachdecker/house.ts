// The finished house of the Ending scene of the Dachdecker theme as data (DESIGN-DACHDECKER.md "Abend"): plastered walls
// on a plinth with a timber frame (sills, top plates, corner posts, posts between the windows and beside the door, rails
// under the windows), four windows with sills and a door with its step on the front, closed gables front and back with a
// round window, the chimney on the back roof face, the foot of the topping-out wreath on the ridge above the front gable,
// and the smoke puffs of the chimney over time. The roof frame sits on the walls at roofBase. Check: house.check.ts.
import type { Point3 } from "../../core/three/beam.ts";
import { chance } from "../../core/three/chance.ts";
import { frameDepth, type FrameDims } from "./frame.ts";

export type HousePart = { center: Point3; size: Point3 };
export type Timber = { from: Point3; to: Point3 };
// A closed gable: triangle at depth z over the half width half, from base up by rise, with a round window
export type Gable = { z: number; half: number; base: number; rise: number; window: { center: Point3; radius: number } };
export type House = {
  wall: HousePart; plinth: HousePart; timbers: Timber[]; windows: HousePart[]; sills: HousePart[]; door: HousePart; step: HousePart;
  gables: Gable[]; chimney: HousePart; wreath: Point3; roofBase: number;
};

// Walls stand a little inside the trusses and a little longer than the frame
const INSET = 0.25;
const WALL_EXTRA = 0.4;
// Timber: width and thickness out of the wall; plinth height and how far it stands out
export const TIMBER = { width: 0.16, depth: 0.08 };
const PLINTH = { height: 0.3, out: 0.06 };
// Windows (width, height) at these shares of the half wall, door in the middle, both just in front of the wall
const WINDOW = { width: 0.9, height: 1, at: [-0.66, -0.25, 0.25, 0.66], level: 0.574 };
const SILL = { height: 0.07, depth: 0.16, extra: 0.12 };
const DOOR = { width: 0.95, share: 0.72 };
const STEP = { height: 0.12, depth: 0.45, extra: 0.4 };
const FRONT_GAP = 0.01;
// Posts between the outer and the inner windows; round gable window at this share of the gable height
const BETWEEN = 0.455;
const GABLE_WINDOW = { at: 0.42, radius: 0.32 };
// Chimney on the right face near the back, sticking out of the roof; foot of the wreath just above the ridge
const CHIMNEY = { size: [0.6, 1.6, 0.6] as Point3, x: 0.38, depth: 0.7, below: 0.3 };
const WREATH = { above: 0.15, front: 0.4 };

function timbers(width: number, height: number, front: number, back: number, rail: number, doorHalf: number): Timber[] {
  const lay = (along: number) => along + (along > back ? 1 : -1) * TIMBER.depth / 2;
  const across = (y: number, along: number, from = -width, to = width): Timber => ({ from: [from, y, lay(along)], to: [to, y, lay(along)] });
  const up = (x: number, along: number): Timber => ({ from: [x, PLINTH.height, lay(along)], to: [x, height, lay(along)] });
  const out = (x: number) => x + Math.sign(x) * TIMBER.depth / 2;
  const side = (x: number, y: number): Timber => ({ from: [out(x), y, front], to: [out(x), y, back] });
  const sideUp = (x: number, along: number): Timber => ({ from: [out(x), PLINTH.height, along], to: [out(x), height, along] });
  const sill = PLINTH.height + TIMBER.width / 2;
  const plate = height - TIMBER.width / 2;
  return [
    // Front: sill (open at the door), top plate, corner posts, posts between the windows, door posts, rails under the windows
    across(sill, front, -width, -doorHalf), across(sill, front, doorHalf, width), across(plate, front),
    up(-width, front), up(width, front), up(-width * BETWEEN, front), up(width * BETWEEN, front), up(-doorHalf, front), up(doorHalf, front),
    across(rail, front, -width, -doorHalf), across(rail, front, doorHalf, width),
    // Back and sides
    across(sill, back), across(plate, back), up(-width, back), up(width, back), up(0, back),
    side(-width, sill), side(width, sill), side(-width, plate), side(width, plate), sideUp(-width, (front + back) / 2), sideUp(width, (front + back) / 2),
  ];
}

export function house(dims: FrameDims, wallHeight: number): House {
  const width = dims.span / 2 - INSET;
  const depth = frameDepth(dims);
  const length = depth + WALL_EXTRA;
  const front = WALL_EXTRA / 2;
  const back = -depth - WALL_EXTRA / 2;
  const face = front + FRONT_GAP + TIMBER.depth;
  const windowBottom = wallHeight * WINDOW.level - WINDOW.height / 2;
  const doorHeight = wallHeight * DOOR.share;
  const doorHalf = DOOR.width / 2 + TIMBER.width / 2;
  // The gable sits under the rafters: same slope as the roof, over the wall width
  const rise = dims.rise * (width / (dims.span / 2));
  const gable = (along: number): Gable => ({ z: along, half: width, base: wallHeight, rise, window: { center: [0, wallHeight + rise * GABLE_WINDOW.at, along], radius: GABLE_WINDOW.radius } });
  return {
    wall: { center: [0, wallHeight / 2, -depth / 2], size: [width * 2, wallHeight, length] },
    plinth: { center: [0, PLINTH.height / 2, -depth / 2], size: [width * 2 + PLINTH.out * 2, PLINTH.height, length + PLINTH.out * 2] },
    timbers: timbers(width, wallHeight, front, back, windowBottom - SILL.height, doorHalf),
    windows: WINDOW.at.map(share => ({ center: [share * width, wallHeight * WINDOW.level, face], size: [WINDOW.width, WINDOW.height, 0] })),
    sills: WINDOW.at.map(share => ({ center: [share * width, windowBottom - SILL.height / 2, face + SILL.depth / 2], size: [WINDOW.width + SILL.extra, SILL.height, SILL.depth] })),
    door: { center: [0, PLINTH.height + (doorHeight - PLINTH.height) / 2, face], size: [DOOR.width, doorHeight - PLINTH.height, 0] },
    step: { center: [0, STEP.height / 2, front + PLINTH.out + STEP.depth / 2], size: [DOOR.width + STEP.extra, STEP.height, STEP.depth] },
    gables: [gable(front), gable(back)],
    chimney: { center: [(dims.span / 2) * CHIMNEY.x, wallHeight + dims.rise - CHIMNEY.below, -depth * CHIMNEY.depth], size: CHIMNEY.size },
    wreath: [0, wallHeight + dims.rise + WREATH.above, WREATH.front],
    roofBase: wallHeight,
  };
}

// Where the smoke leaves the chimney
export const chimneyTop = (home: House): Point3 => [home.chimney.center[0], home.chimney.center[1] + home.chimney.size[1] / 2, home.chimney.center[2]];

// A smoke puff rises for 6.3 s, the next one starts 0.45 s later; it drifts, grows and fades. null before its start
const PUFF = { life: 6.3, gap: 0.45, drift: [0.8, 1.6], rise: [2.5, 3.5], side: 0.4, from: 0.3, to: 1.6, opacity: 0.35 };
export type Puff = { offset: Point3; scale: number; opacity: number };

export function puff(index: number, count: number, time: number, seed: number): Puff | null {
  const start = index * PUFF.gap;
  if (time < start) return null;
  const round = Math.floor((time - start) / (count * PUFF.gap > PUFF.life ? count * PUFF.gap : PUFF.life));
  const part = ((time - start) % PUFF.life) / PUFF.life;
  const random = chance(seed * 53 + index * 7 + round);
  const rise = Math.sin((part * Math.PI) / 2);
  return {
    offset: [random.between(PUFF.drift[0], PUFF.drift[1]) * rise, random.between(PUFF.rise[0], PUFF.rise[1]) * rise, random.between(-PUFF.side, PUFF.side) * rise],
    scale: PUFF.from + (PUFF.to - PUFF.from) * part,
    opacity: PUFF.opacity * (1 - part * part),
  };
}
