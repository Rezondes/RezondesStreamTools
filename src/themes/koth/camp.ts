// Layout of the camp on the KOTH hill (DESIGN-KOTH.md "Modernisierung"): sandbag rings, bunker, tents, crate stacks,
// fence posts, pines, rocks, jeep, flag pole and the marker flags of the other factions, as data from the seed and the
// settings. Every item stands with its base on the ground (y from hillHeight); stacked items lift above it. Nothing lies
// in the free space around the mast. Pure; check: camp.check.ts.
import { chance } from "../../core/three/chance.ts";
import { hillHeight } from "./terrain.ts";

export type CampKind = "sandbag" | "bunker" | "tent" | "crate" | "post" | "tree" | "rock" | "jeep" | "pole" | "marker";
// size: the scale of the item (tree height, rock size); lift: height above the ground for stacked items; index: running
// number within its kind (stagger of the build, faction of a marker)
export type CampItem = { kind: CampKind; x: number; z: number; y: number; turn: number; size: number; lift: number; index: number };

export type CampOptions = {
  seed: number;
  hillHeight: number;
  sandbags: boolean;
  bunker: boolean;
  tents: number;
  crateStacks: number;
  fence: boolean;
  trees: number;
  rocks: number;
  jeep: boolean;
  markerFlags: boolean;
};

// fixed: radius around the mast foot that stays free (mast legs and guy wire roots)
export const MAST_CLEARANCE = 1.5;
// fixed: places from the prototype (refs/starting.html); the settings choose how many are used
export const FLAG_POLE = { x: 2.6, z: 1.2 };
const BAG_RINGS = [[-3.4, 2.4, -0.6, 7], [3.8, -2.6, 2.4, 6], [-1.5, -4.2, 1.2, 6]] as const;
const BAG_RADIUS = 2.2;
const BAG_STEP = 0.22;
const BAG_ROW = 0.3;
const BUNKER = { x: -4.6, z: 4.2, turn: 0.6 };
const TENTS = [[5.6, 3.2, -0.5], [7.4, -1, 0.2], [-6.8, -2.4, 1.4], [1.2, 7.2, 2.6], [-7.6, 1.8, 0.9], [6.2, -5.6, -1.1]] as const;
const CRATES = [[2.4, 3.8, 0.3, 5], [-2.8, -3.2, 1.2, 3], [4.2, -4.4, -0.4, 4], [-5.4, -5.2, 0.8, 3], [0.6, -6.4, 2.2, 4], [5.4, 5.8, -1.6, 3], [-7.8, 4.6, 0.4, 2], [7.8, 1.6, 1.9, 3]] as const;
const CRATE_SIZE = { width: 0.5, height: 0.5 };
const FENCE = { posts: 26, radius: 9.5, wave: 0.6, waves: 3 };
const TREES = { near: 12, far: 38, low: 1.6, high: 3.4 };
const ROCKS = { near: 5, far: 35, small: 0.3, big: 0.9 };
const JEEP = { x: 9.5, z: 6.5, turn: -2.2 };
const MARKERS = [[-15, -3], [14, -6]] as const;

export function campLayout(options: CampOptions): CampItem[] {
  const items: CampItem[] = [];
  const add = (kind: CampKind, x: number, depth: number, turn = 0, size = 1, lift = 0) => {
    const index = items.filter(item => item.kind === kind).length;
    items.push({ kind, x, z: depth, y: hillHeight(x, depth, options.hillHeight), turn, size, lift, index });
  };
  add("pole", FLAG_POLE.x, FLAG_POLE.z);
  if (options.sandbags) {
    for (const [centerX, centerZ, from, count] of BAG_RINGS) {
      for (let row = 0; row < 2; row++) {
        for (let bag = 0; bag < count - row; bag++) {
          const angle = from + (bag + row * 0.5) * BAG_STEP;
          add("sandbag", centerX + Math.cos(angle) * BAG_RADIUS, centerZ + Math.sin(angle) * BAG_RADIUS, -angle, 1, row * BAG_ROW);
        }
      }
    }
  }
  if (options.bunker) add("bunker", BUNKER.x, BUNKER.z, BUNKER.turn);
  for (const [x, depth, turn] of TENTS.slice(0, options.tents)) add("tent", x, depth, turn);
  for (const [x, depth, turn, count] of CRATES.slice(0, options.crateStacks)) {
    // a stack: two crates side by side per layer, turned with the stack
    for (let crate = 0; crate < count; crate++) {
      const side = (crate % 2) * CRATE_SIZE.width;
      add("crate", x + Math.cos(turn) * side, depth - Math.sin(turn) * side, turn + (crate % 3) * 0.2, 1, Math.floor(crate / 2) * CRATE_SIZE.height);
    }
  }
  if (options.fence) {
    for (let post = 0; post < FENCE.posts; post++) {
      const angle = (post / FENCE.posts) * Math.PI * 2;
      const radius = FENCE.radius + Math.sin(angle * FENCE.waves) * FENCE.wave;
      add("post", Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  }
  const random = chance(options.seed);
  for (let tree = 0; tree < options.trees; tree++) {
    const angle = random.between(0, Math.PI * 2);
    const distance = random.between(TREES.near, TREES.far);
    add("tree", Math.cos(angle) * distance, Math.sin(angle) * distance, random.between(0, 3), random.between(TREES.low, TREES.high));
  }
  for (let rock = 0; rock < options.rocks; rock++) {
    const angle = random.between(0, Math.PI * 2);
    const distance = random.between(ROCKS.near, ROCKS.far);
    add("rock", Math.cos(angle) * distance, Math.sin(angle) * distance, random.between(0, 3), random.between(ROCKS.small, ROCKS.big));
  }
  if (options.jeep) add("jeep", JEEP.x, JEEP.z, JEEP.turn);
  if (options.markerFlags) for (const [x, depth] of MARKERS) add("marker", x, depth);
  return items;
}
