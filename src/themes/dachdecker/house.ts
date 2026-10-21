// The finished house of the Ending scene of the Dachdecker theme as data (DESIGN-DACHDECKER.md "Abend"): timber frame
// walls under the roof frame, posts at the corners and between the windows, four windows and a door on the front, the
// chimney on the back roof face, the topping-out wreath above the front gable, and the smoke puffs of the chimney over
// time. The roof frame sits on the walls at roofBase. Check: house.check.ts.
import type { Point3 } from "../../core/three/beam.ts";
import { chance } from "../../core/three/chance.ts";
import { frameDepth, type FrameDims } from "./frame.ts";

export type HousePart = { center: Point3; size: Point3 };
export type Post = { from: Point3; to: Point3 };
export type House = { wall: HousePart; posts: Post[]; windows: HousePart[]; door: HousePart; chimney: HousePart; wreath: Point3; roofBase: number };

// Walls stand a little inside the trusses and a little longer than the frame
const INSET = 0.25;
const WALL_EXTRA = 0.4;
// Windows (width, height) at these shares of the half wall, door in the middle, both just in front of the wall
const WINDOW = { width: 0.9, height: 1, at: [-0.66, -0.25, 0.25, 0.66], level: 0.574 };
const DOOR = { width: 0.9, share: 0.667 };
const FRONT_GAP = 0.01;
// Chimney on the right face near the back, sticking out of the roof; wreath a little above the ridge at the front gable
const CHIMNEY = { size: [0.6, 1.6, 0.6] as Point3, x: 0.38, depth: 0.7, below: 0.3 };
const WREATH = { above: 0.3, front: 0.4 };

export function house(dims: FrameDims, wallHeight: number): House {
  const width = dims.span / 2 - INSET;
  const depth = frameDepth(dims);
  const length = depth + WALL_EXTRA;
  const front = WALL_EXTRA / 2;
  const back = -depth - WALL_EXTRA / 2;
  const post = (x: number, along: number): Post => ({ from: [x, 0, along], to: [x, wallHeight, along] });
  const face = front + FRONT_GAP;
  return {
    wall: { center: [0, wallHeight / 2, -depth / 2], size: [width * 2, wallHeight, length] },
    posts: [post(-width, front), post(width, front), post(-width, back), post(width, back), post(0, front), post(-width / 2, front), post(width / 2, front)],
    windows: WINDOW.at.map(share => ({ center: [share * width, wallHeight * WINDOW.level, face], size: [WINDOW.width, WINDOW.height, 0] })),
    door: { center: [0, (wallHeight * DOOR.share) / 2, face], size: [DOOR.width, wallHeight * DOOR.share, 0] },
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
