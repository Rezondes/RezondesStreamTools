// The meadow behind the Starting scene of the Dogs theme (DESIGN-DOGS.md "Starting", prototype refs/px-starting.html):
// sky bands down to the horizon, three hills, four trees, the fence, grass with flowers, the cushions of the row and
// the red rug in front, painted once into one image of the world size; the clouds drift as sprites (cloudsAt).
// Places of the prototype on a world of 384 x 216, scaled to the world. Check: backdrop.check.ts.
import { blankImage, type PixelImage } from "./pixels.ts";
import { LAYOUT, scaledRow, type StartingPlan } from "./starting.ts";
import { cushion, fence, hill, meadow, skyBands, tree, type WorldColors } from "./world.ts";

// fixed: the meadow of the prototype on a world 384 pixels wide: hills (x, radius x, radius y, color index), trees
// (x, ground above the horizon, size, seed), seven sky bands, cushions 6 pixels narrower than their dog, the rug
const WIDTH = 384;
const HILLS = [[60, 90, 26, 0], [300, 120, 32, 1], [190, 70, 18, 2]] as const;
const TREES = [[26, 0, 1, 1], [58, 2, 0.8, 2], [330, 0, 1, 3], [362, 2, 0.8, 4]] as const;
const SKY_BANDS = 7;
const CUSHION_INSET = 6;
const RUG = { radius: 34 };
const MEADOW_SEED = 1;

export type BackdropOptions = { colors: WorldColors; cushions: readonly string[]; rug: string; flowers: number; fence: boolean; trees: boolean };

export function startingBackdrop(plan: StartingPlan, options: BackdropOptions): PixelImage {
  const { width, height, dogs } = plan.sizes;
  const { colors } = options;
  const image = blankImage(width, height);
  const across = width / WIDTH;
  const horizon = scaledRow(plan.sizes, LAYOUT.horizon);
  skyBands(image, colors, horizon, SKY_BANDS);
  for (const [x, radiusX, radiusY, color] of HILLS) hill(image, Math.round(x * across), horizon + 1, Math.round(radiusX * across), radiusY, colors.hills[color]);
  if (options.trees) for (const [x, above, size, seed] of TREES) tree(image, Math.round(x * across), horizon - above, size, seed, colors);
  meadow(image, horizon, colors, options.flowers, MEADOW_SEED);
  if (options.fence) fence(image, scaledRow(plan.sizes, LAYOUT.fence), colors);
  dogs.forEach((dog, index) => cushion(image, plan.xs[index] + dog.width / 2, plan.row + 1, Math.round(dog.width / 2) - CUSHION_INSET, options.cushions[index % options.cushions.length], colors));
  cushion(image, Math.round(width / 2), plan.front + 1, Math.round(RUG.radius * across), options.rug, colors);
  return image;
}

// fixed: clouds of the prototype: 75 pixels apart, in three rows 22 pixels apart from 16, every other one smaller;
// they wrap 80 pixels wider than the world and start 50 pixels left of it
const CLOUDS = { spacing: 75, top: 16, rowGap: 22, rows: 3, small: 0.8, wrap: 80, enter: 50 };
export const CLOUD_SCALE = { small: CLOUDS.small, big: 1 };

export type CloudPlace = { x: number; y: number; small: boolean };

// The clouds at time: count clouds drifting right at speed pixels per s
export function cloudsAt(time: number, count: number, speed: number, width: number): CloudPlace[] {
  return Array.from({ length: count }, (_, cloud) => ({
    x: Math.round(((cloud * CLOUDS.spacing + time * speed) % (width + CLOUDS.wrap)) - CLOUDS.enter),
    y: CLOUDS.top + (cloud % CLOUDS.rows) * CLOUDS.rowGap,
    small: cloud % 2 === 0,
  }));
}
