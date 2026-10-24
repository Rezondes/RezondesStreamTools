// The scrolling meadow of the BRB scene of the Dogs theme (DESIGN-DOGS.md "BRB", prototype refs/px-brb.html): the sky
// stands, hills, trees, grass, fence and path scroll at their own parallax as strips that repeat after their period,
// each painted once; a strip shows its window at shiftOf (from the way the dog walked). Clouds drift as sprites.
// Places of the prototype on a world of 384 x 216 rows, scaled to the height of the world. Check: brbWorld.check.ts.
import { mixHex } from "../../core/color.ts";
import { blankImage, type PixelImage } from "./pixels.ts";
import { chanceOf, fence, fillRect, hill, skyBands, tree, type WorldColors } from "./world.ts";

// fixed: the layout of the prototype on 216 rows: horizon, fence, the path from 186 to 206 with the feet of the dog at
// 198 and the dog at x 200; the leash ends 2 pixels right of the world at row 112, swaying 1.5 pixels twice a second
export const BRB = { rows: 216, horizon: 150, fence: 140, pathTop: 186, pathBottom: 206, ground: 198, dogX: 200, leashY: 112, leashSway: 1.5, leashRate: 2, leashOut: 2 };
// fixed: the parallax of the prototype (clouds 0.05, hills 0.15, trees 0.45, grass and fence 0.8, path 1), the extra
// width after which each strip repeats, and how it is filled
const SKY_BANDS = 7;
const HILLS = { period: 200, left: -100, spacing: 130, count: 4, base: 1, width: [90, 30], height: [22, 6] };
const TREES = { period: 100, left: -50, spacing: 96, count: 5, jitter: 30, size: [0.8, 0.3] };
const GRASS = { period: 40, left: -20, top: 4, bottomRoom: 6, flowerEvery: 3 };
const FENCE_GAP = 16;
const PATH = { period: 20, left: -10, pebbles: 24, spacing: 23, jitter: 12, top: 3, spread: 14, edgeMix: 0.2 };
const CLOUDS = { spacing: 80, top: 66, rowGap: 14, rows: 3, wrap: 80, enter: 50, parallax: 0.05 };
const PARALLAX = { hills: 0.15, trees: 0.45, grass: 0.8, path: 1 };

export type Strip = { image: PixelImage; period: number; speed: number };
export type BrbOptions = { colors: WorldColors; path: string; flowers: number; fence: boolean; trees: boolean; seed: number };

// A row of the prototype on a world of height rows
export const brbRow = (height: number, row: number) => Math.round((row * height) / BRB.rows);

// The left edge of a strip at the way walked: it moves left by its parallax and starts over after its period
export const shiftOf = (strip: Strip, way: number) => -((((way * strip.speed) % strip.period) + strip.period) % strip.period);

// Paints an item at every copy of its place that reaches into the strip
function everyCopy(width: number, period: number, place: number, paint: (x: number) => void) {
  for (let x = (((place % period) + period) % period) - period; x < width + period; x += period) paint(x);
}

function strip(width: number, height: number, period: number, speed: number, paint: (image: PixelImage) => void): Strip {
  const image = blankImage(width + period, height);
  paint(image);
  return { image, period, speed };
}

// The sky as one image (it stands)
export function brbSky(width: number, height: number, colors: WorldColors): PixelImage {
  const image = blankImage(width, brbRow(height, BRB.horizon) + 1);
  skyBands(image, colors, image.height, SKY_BANDS);
  return image;
}

function paintGrass(image: PixelImage, top: number, period: number, options: BrbOptions) {
  const { colors } = options;
  fillRect(image, 0, top, image.width, image.height - top, colors.grass);
  fillRect(image, 0, top, image.width, 2, colors.grassLight);
  const tuft = mixHex(colors.grass, colors.ink, PATH.edgeMix);
  for (let item = 0; item < options.flowers; item++) {
    const y = top + GRASS.top + chanceOf(options.seed, item, 2) * (image.height - top - GRASS.bottomRoom);
    everyCopy(image.width, period, chanceOf(options.seed, item, 1) * period + GRASS.left, x => {
      if (item % GRASS.flowerEvery) {
        fillRect(image, x, y, 3, 1, tuft);
        fillRect(image, x + 1, y - 1, 1, 1, tuft);
        return;
      }
      const color = colors.flowers[item % colors.flowers.length];
      fillRect(image, x - 1, y + 1, 3, 1, color);
      fillRect(image, x, y, 1, 3, color);
      fillRect(image, x, y + 1, 1, 1, colors.flowers[1 % colors.flowers.length]);
    });
  }
}

function paintPath(image: PixelImage, top: number, bottom: number, period: number, options: BrbOptions) {
  const edge = mixHex(options.path, options.colors.ink, PATH.edgeMix);
  fillRect(image, 0, top, image.width, bottom - top, options.path);
  fillRect(image, 0, top, image.width, 1, edge);
  fillRect(image, 0, bottom - 1, image.width, 1, edge);
  fillRect(image, 0, bottom, image.width, image.height - bottom, options.colors.grass);
  for (let pebble = 0; pebble < PATH.pebbles; pebble++) {
    const y = top + PATH.top + chanceOf(options.seed, pebble, 7) * PATH.spread;
    everyCopy(image.width, period, pebble * PATH.spacing + chanceOf(options.seed, pebble, 6) * PATH.jitter + PATH.left, x => fillRect(image, x, y, 2, 1, edge));
  }
}

// The scrolling strips from far to near: hills, trees, grass, fence, path
export function brbStrips(width: number, height: number, options: BrbOptions): Strip[] {
  const { colors } = options;
  const horizon = brbRow(height, BRB.horizon);
  const hillPeriod = width + HILLS.period;
  const hills = strip(width, height, hillPeriod, PARALLAX.hills, image => {
    for (let index = 0; index < HILLS.count; index++) {
      const radiusX = HILLS.width[0] + (index % 2) * HILLS.width[1];
      const radiusY = HILLS.height[0] + (index % 3) * HILLS.height[1];
      everyCopy(image.width, hillPeriod, index * HILLS.spacing + HILLS.left, x => hill(image, x, horizon + HILLS.base, radiusX, radiusY, colors.hills[index % colors.hills.length]));
    }
  });
  const treePeriod = width + TREES.period;
  const trees = strip(width, height, treePeriod, PARALLAX.trees, image => {
    if (!options.trees) return;
    for (let index = 0; index < TREES.count; index++) {
      const place = index * TREES.spacing + chanceOf(options.seed, index, 3) * TREES.jitter + TREES.left;
      everyCopy(image.width, treePeriod, place, x => tree(image, x, horizon, TREES.size[0] + chanceOf(options.seed, index, 4) * TREES.size[1], index, colors));
    }
  });
  const grassPeriod = width + GRASS.period;
  const grass = strip(width, height, grassPeriod, PARALLAX.grass, image => paintGrass(image, horizon, grassPeriod, options));
  const fenceStrip = strip(width, height, FENCE_GAP, PARALLAX.grass, image => {
    if (options.fence) fence(image, brbRow(height, BRB.fence), colors);
  });
  const pathPeriod = width + PATH.period;
  const path = strip(width, height, pathPeriod, PARALLAX.path, image => paintPath(image, brbRow(height, BRB.pathTop), brbRow(height, BRB.pathBottom), pathPeriod, options));
  return [hills, trees, grass, fenceStrip, path];
}

export type CloudPlace = { x: number; y: number; small: boolean };

// The clouds at time after the dog walked way: they drift slowly and fall behind a little
export function brbCloudsAt(time: number, way: number, count: number, drift: number, width: number): CloudPlace[] {
  const span = width + CLOUDS.wrap;
  return Array.from({ length: count }, (_, cloud) => {
    const x = cloud * CLOUDS.spacing - way * CLOUDS.parallax + time * drift;
    return { x: Math.round((((x % span) + span) % span) - CLOUDS.enter), y: CLOUDS.top + (cloud % CLOUDS.rows) * CLOUDS.rowGap, small: cloud % 2 === 0 };
  });
}
