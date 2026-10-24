// The meadow of the Dogs theme as pixel images (DESIGN-DOGS.md "Wiese", prototype refs/pxworld.js): sky in bands (no
// soft gradient), clouds of three discs, hills as half ellipses, trees with an outlined trunk and four crown balls,
// a white picket fence, grass with a light top edge, tufts and flowers, cushions with piping. Everything on whole
// pixels; chance comes from hash with fixed seeds. In-between tones are mixed from the colors of the settings.
// Check: world.check.ts.
import { mixHex } from "../../core/color.ts";
import { hash } from "../../core/hash.ts";
import { blankImage, setPixel, type PixelImage } from "./pixels.ts";

export type WorldColors = {
  sky: string; skyLow: string; grass: string; grassLight: string; hills: readonly string[]; trunk: string; leaf: string;
  apple: string; light: string; ink: string; flowers: readonly string[];
};

// fixed: how in-between tones mix from the settings (cloud underside, crown shade and light, trunk shade, tufts, fence)
const MIX = { cloudUnder: 0.25, leafDark: 0.3, leafLight: 0.25, trunkDark: 0.2, tuft: 0.15, fenceShade: 0.12 };
const SALT = { column: 7919, row: 131 };
// Chance from 0 to below 1 for a seed and up to two parts
export const chanceOf = (seed: number, part: number, more = 0) => hash(seed * SALT.column + part * SALT.row + more);

export function fillRect(image: PixelImage, x: number, y: number, width: number, height: number, color: string) {
  const left = Math.round(x);
  const top = Math.round(y);
  for (let row = top; row < top + Math.round(height); row++) for (let column = left; column < left + Math.round(width); column++) setPixel(image, column, row, color);
}

// A filled ellipse of whole rows; half: only the upper half (hills)
export function disc(image: PixelImage, centerX: number, centerY: number, radiusX: number, radiusY: number, color: string, half = false) {
  for (let y = -radiusY; y <= (half ? 0 : radiusY); y++) {
    const reach = Math.round(radiusX * Math.sqrt(Math.max(0, 1 - (y / radiusY) ** 2)));
    fillRect(image, centerX - reach, centerY + y, 2 * reach + 1, 1, color);
  }
}

// An outlined disc: an ink ring one pixel wider, then the fill
export function outlinedDisc(image: PixelImage, centerX: number, centerY: number, radiusX: number, radiusY: number, color: string, ink: string) {
  disc(image, centerX, centerY, radiusX + 1, radiusY + 1, ink);
  disc(image, centerX, centerY, radiusX, radiusY, color);
}

// Sky from the top down to height in bands from sky to skyLow
export function skyBands(image: PixelImage, colors: WorldColors, height: number, bands: number) {
  for (let band = 0; band < bands; band++) {
    const color = mixHex(colors.sky, colors.skyLow, bands > 1 ? band / (bands - 1) : 0);
    fillRect(image, 0, Math.round((height * band) / bands), image.width, Math.ceil(height / bands) + 1, color);
  }
}

// fixed: the cloud of the prototype, three discs with a flat bottom, in cloud pixels (x, y, radius x, radius y)
const CLOUD_BLOBS = [[0, 2, 7, 4], [8, -1, 9, 7], [17, 2, 7, 4]] as const;
const CLOUD = { left: 7, top: 8, width: 32, height: 14, bottom: 4, flat: 30, flatHeight: 2 };

// A cloud as its own image (it drifts as a sprite); scale 1 or smaller
export function cloudImage(colors: WorldColors, scale: number): PixelImage {
  const image = blankImage(Math.ceil(CLOUD.width * scale) + 2, Math.ceil(CLOUD.height * scale) + 2);
  const under = mixHex(colors.light, colors.sky, MIX.cloudUnder);
  const origin = { x: CLOUD.left * scale, y: CLOUD.top * scale };
  for (const [x, y, radiusX, radiusY] of CLOUD_BLOBS) disc(image, origin.x + x * scale, origin.y + y * scale + 1, radiusX * scale, radiusY * scale, under);
  for (const [x, y, radiusX, radiusY] of CLOUD_BLOBS) disc(image, origin.x + x * scale, origin.y + y * scale, radiusX * scale, radiusY * scale, colors.light);
  fillRect(image, origin.x - (CLOUD.left - 1) * scale, origin.y + CLOUD.bottom * scale, CLOUD.flat * scale, CLOUD.flatHeight * scale, colors.light);
  return image;
}

export const hill = (image: PixelImage, centerX: number, base: number, radiusX: number, radiusY: number, color: string) => disc(image, centerX, base, radiusX, radiusY, color, true);

// fixed: the tree of the prototype in tree pixels: trunk, four crown balls (x, y, radius x, radius y), three apples
const CROWN = [[0, -24, 11, 9], [-7, -18, 8, 6], [8, -17, 8, 6], [1, -31, 7, 6]] as const;
const TRUNK = { height: 16, width: 6, shade: 2 };
const APPLES = { count: 3, chance: 0.6, spread: 16, top: -28, drop: 12, size: 2 };
const HIGHLIGHT = { shift: 0.3, rise: 3, radiusX: 2, radiusY: 1 };

export function tree(image: PixelImage, x: number, ground: number, scale: number, seed: number, colors: WorldColors) {
  fillRect(image, x - 3 * scale, ground - TRUNK.height * scale, TRUNK.width * scale + 2, TRUNK.height * scale, colors.ink);
  fillRect(image, x - 2 * scale, ground - TRUNK.height * scale, TRUNK.width * scale, TRUNK.height * scale, colors.trunk);
  fillRect(image, x - 2 * scale, ground - TRUNK.height * scale, TRUNK.shade * scale, TRUNK.height * scale, mixHex(colors.trunk, colors.ink, MIX.trunkDark));
  const dark = mixHex(colors.leaf, colors.ink, MIX.leafDark);
  for (const [bx, by, radiusX, radiusY] of CROWN) outlinedDisc(image, x + bx * scale + 1, ground + by * scale, radiusX * scale, radiusY * scale, dark, colors.ink);
  for (const [bx, by, radiusX, radiusY] of CROWN) disc(image, x + bx * scale + 1, ground + by * scale - 1, radiusX * scale - 1, radiusY * scale - 1, colors.leaf);
  const light = mixHex(colors.leaf, colors.light, MIX.leafLight);
  for (const [bx, by, radiusX] of CROWN) disc(image, x + bx * scale - radiusX * scale * HIGHLIGHT.shift, ground + by * scale - HIGHLIGHT.rise * scale, HIGHLIGHT.radiusX * scale, HIGHLIGHT.radiusY * scale, light);
  if (chanceOf(seed, 9) <= APPLES.chance) return;
  for (let apple = 0; apple < APPLES.count; apple++) {
    const appleX = x + (chanceOf(seed, apple) * APPLES.spread - APPLES.spread / 2) * scale;
    const appleY = ground + (APPLES.top + chanceOf(seed, apple, 2) * APPLES.drop) * scale;
    fillRect(image, appleX, appleY, APPLES.size, APPLES.size, colors.apple);
  }
}

// fixed: the picket fence of the prototype: two rails, a picket every 16 pixels with a pointed top
const FENCE = { rails: [4, 9], railHeight: 2, gap: 16, picket: 4, picketHeight: 14 };

// The fence across the whole width at y, shifted by offset pixels (scrolling)
export function fence(image: PixelImage, y: number, colors: WorldColors, offset = 0) {
  for (const rail of FENCE.rails) {
    fillRect(image, 0, y + rail - 1, image.width, FENCE.railHeight + 2, colors.ink);
    fillRect(image, 0, y + rail, image.width, FENCE.railHeight, colors.light);
  }
  const shade = mixHex(colors.light, colors.sky, MIX.fenceShade);
  const shift = ((Math.round(offset) % FENCE.gap) + FENCE.gap) % FENCE.gap;
  for (let x = -shift; x < image.width + FENCE.gap; x += FENCE.gap) {
    fillRect(image, x - 1, y - 1, FENCE.picket + 2, FENCE.picketHeight + 2, colors.ink);
    fillRect(image, x, y + 1, FENCE.picket, FENCE.picketHeight, colors.light);
    fillRect(image, x + FENCE.picket - 1, y + 1, 1, FENCE.picketHeight, shade);
    fillRect(image, x + 1, y - 2, 2, 1, colors.ink);
    fillRect(image, x + 1, y - 1, 2, 2, colors.light);
  }
}

// fixed: flowers and tufts may lie 20 pixels outside the image (they scroll in), every third one is a flower
const MEADOW = { overhang: 20, edge: 2, top: 4, bottomRoom: 6, flowerEvery: 3, salt: 2 };

// Grass from top down to the bottom with a light top edge, tufts and flowers; offset scrolls them
export function meadow(image: PixelImage, top: number, colors: WorldColors, count: number, seed: number, offset = 0) {
  fillRect(image, 0, top, image.width, image.height - top, colors.grass);
  fillRect(image, 0, top, image.width, MEADOW.edge, colors.grassLight);
  const span = image.width + 2 * MEADOW.overhang;
  const tuft = mixHex(colors.grass, colors.ink, MIX.tuft);
  for (let item = 0; item < count; item++) {
    const x = (((chanceOf(seed, item, 1) * span - offset) % span) + span) % span - MEADOW.overhang;
    const y = top + MEADOW.top + chanceOf(seed, item, MEADOW.salt) * (image.height - top - MEADOW.bottomRoom);
    if (item % MEADOW.flowerEvery) {
      fillRect(image, x, y, 3, 1, tuft);
      fillRect(image, x + 1, y - 1, 1, 1, tuft);
      continue;
    }
    const color = colors.flowers[item % colors.flowers.length];
    fillRect(image, x, y, 1, 1, color);
    fillRect(image, x - 1, y + 1, 3, 1, color);
    fillRect(image, x, y + 2, 1, 1, color);
    fillRect(image, x, y + 1, 1, 1, colors.flowers[1 % colors.flowers.length]);
  }
}

// fixed: a cushion is 4 pixels high, with piping 2 pixels inside its edge
const CUSHION = { height: 4, piping: 2, inner: 3 };

// A cushion or rug: an outlined flat ellipse with a light piping on top
export function cushion(image: PixelImage, centerX: number, y: number, radiusX: number, color: string, colors: WorldColors) {
  outlinedDisc(image, centerX, y + 1, radiusX, CUSHION.height, color, colors.ink);
  disc(image, centerX, y, radiusX - CUSHION.piping, CUSHION.piping, colors.light);
  disc(image, centerX, y, radiusX - CUSHION.inner, CUSHION.piping, color);
}
