// The room at night of the Ending of the Dogs theme (DESIGN-DOGS.md "Zimmer", prototype refs/px-ending.html): wall with
// stripes, skirting, wooden floor, window with night sky, moon and stars, a picture with a paw, the side table with
// the lamp, the rug, and the basket (back rim and cushion behind the dog, woven front rim in front of it). The room is
// one image; what changes (lamp shade, glow, twinkling stars) are small images of their own. In-between tones are mixed
// from the settings. Places of the prototype on a world of 384 x 216. Check: room.check.ts.
import { mixHex } from "../../core/color.ts";
import { blankImage, setPixel, type PixelImage, type Point } from "./pixels.ts";
import { spriteImage, SPRITES } from "./props.ts";
import { chanceOf, disc, fillRect, outlinedDisc } from "./world.ts";

export type RoomColors = {
  night: string; windowSky: string; floor: string; rug: string; lamp: string; basket: string; pillow: string; cream: string; edge: string;
  ink: string; light: string; trunk: string; accent: string; lilac: string; picture: string;
};

// fixed: the room of the prototype: floor from row 168, the basket at x 196 with its rim at row 198, the window
// (x, y, width, height), the picture, the table at x 100 with the lamp, the rug 70 wide
export const ROOM = { floor: 168, basketX: 196, basketY: 198, skirting: 6, stripeEvery: 24, stripeFrom: 6, board: 8, boardJoint: 60 };
const WINDOW = { x: 282, y: 34, width: 78, height: 74, frame: 6, lowShare: 0.6, bar: 4, sill: 10 };
const MOON = { x: 54, y: 20, radius: 10 };
const PICTURE = { x: 46, y: 66, width: 34, height: 28, paw: [58, 75] };
const TABLE = { x: 100, top: 150, width: 32, legs: [2, 25], legHeight: 30, lampFoot: 138, shadeTop: 126, shadeRows: 12, shadeWidth: 18, shadeSlope: 2.5 };
const RUG = { radiusX: 70, radiusY: 10, inner: 6, below: 4 };
const BASKET = { radiusX: 44, radiusY: 12, rim: 4, cushion: [38, 7], rows: 9, curve: 11, weaveEvery: 3, foot: 30 };
// fixed: how in-between tones mix: wall stripes, skirting, boards, window sky, moon spots, table legs, dim shade, glow
const MIX = { stripe: 0.08, skirting: 0.35, skirtingLight: 0.2, board: 0.18, skyLow: 0.06, moon: 0.4, moonSpot: 0.08, leg: 0.2, dim: 0.55, rugLight: 0.15, basketInner: 0.22, weave: 0.12, dark: 0.7 };
const GLOW = { center: [15, 132], discs: [{ radius: [46, 40], alpha: 0.18, light: 0 }, { radius: [26, 22], alpha: 0.22, light: 0.4 }] };

export const roomRow = (height: number, row: number) => Math.round((row * height) / 216);

// The stars in the window, from a fixed seed: each with its place and how fast it twinkles
export function starsOf(count: number, seed: number): { x: number; y: number; rate: number }[] {
  return Array.from({ length: count }, (_, star) => ({
    x: Math.round(WINDOW.x + 2 + chanceOf(seed, star, 1) * (WINDOW.width - 4)),
    y: Math.round(WINDOW.y + 2 + chanceOf(seed, star, 2) * (WINDOW.height - 6)),
    rate: 1.5 + chanceOf(seed, star, 3) * 2,
  }));
}

// fixed: a star twinkles while the sine of its clock is above 0.6
export const twinkles = (star: { rate: number }, index: number, time: number) => Math.sin(time * star.rate + index) > 0.6;

function windowPart(image: PixelImage, colors: RoomColors, stars: readonly { x: number; y: number }[], moon: boolean) {
  const { x, y, width, height, frame } = WINDOW;
  fillRect(image, x - frame, y - frame, width + 2 * frame, height + 2 * frame, colors.ink);
  fillRect(image, x - frame + 1, y - frame + 1, width + 2 * frame - 2, height + 2 * frame - 2, colors.cream);
  fillRect(image, x, y, width, height, colors.windowSky);
  fillRect(image, x, y + height * WINDOW.lowShare, width, height * (1 - WINDOW.lowShare), mixHex(colors.windowSky, colors.light, MIX.skyLow));
  for (const star of stars) setPixel(image, star.x, star.y, colors.cream);
  if (moon) {
    const glow = mixHex(colors.lamp, colors.light, MIX.moon);
    disc(image, x + MOON.x, y + MOON.y, MOON.radius, MOON.radius, glow);
    disc(image, x + MOON.x - 4, y + MOON.y - 3, 2, 2, mixHex(glow, colors.ink, MIX.moonSpot));
    disc(image, x + MOON.x + 3, y + MOON.y + 5, 3, 2, mixHex(glow, colors.ink, MIX.moonSpot));
  }
  fillRect(image, x + width / 2 - WINDOW.bar / 2, y, WINDOW.bar, height, colors.cream);
  fillRect(image, x, y + height / 2 - WINDOW.bar / 2, width, WINDOW.bar, colors.cream);
  fillRect(image, x - WINDOW.sill, y + height + frame, width + 2 * WINDOW.sill, 4, colors.ink);
  fillRect(image, x - WINDOW.sill + 1, y + height + frame, width + 2 * WINDOW.sill - 2, 3, colors.edge);
}

function furniture(image: PixelImage, colors: RoomColors) {
  const { x, y, width, height } = PICTURE;
  fillRect(image, x, y, width, height, colors.ink);
  fillRect(image, x + 1, y + 1, width - 2, height - 2, colors.trunk);
  fillRect(image, x + 4, y + 4, width - 8, height - 8, colors.picture);
  const paw = spriteImage(SPRITES.paw, { W: colors.accent });
  paw.colors.forEach((color, index) => { if (color) setPixel(image, PICTURE.paw[0] + (index % paw.width), PICTURE.paw[1] + Math.floor(index / paw.width), color); });
  fillRect(image, TABLE.x - 1, TABLE.top, TABLE.width, 5, colors.ink);
  fillRect(image, TABLE.x, TABLE.top + 1, TABLE.width - 2, 3, colors.trunk);
  for (const leg of TABLE.legs) {
    fillRect(image, TABLE.x + leg - 1, TABLE.top + 4, 5, TABLE.legHeight, colors.ink);
    fillRect(image, TABLE.x + leg, TABLE.top + 4, 3, TABLE.legHeight - 1, mixHex(colors.trunk, colors.ink, MIX.leg));
  }
  fillRect(image, TABLE.x + 12, TABLE.lampFoot, 6, 13, colors.ink);
  fillRect(image, TABLE.x + 13, TABLE.lampFoot + 1, 4, 12, colors.lilac);
}

// The room without what changes; stars: from starsOf
export function roomImage(width: number, height: number, colors: RoomColors, stars: readonly { x: number; y: number }[], moon: boolean): PixelImage {
  const image = blankImage(width, height);
  const floor = roomRow(height, ROOM.floor);
  fillRect(image, 0, 0, width, floor, colors.night);
  for (let x = ROOM.stripeFrom; x < width; x += ROOM.stripeEvery) fillRect(image, x, 0, 2, floor, mixHex(colors.night, colors.light, MIX.stripe));
  fillRect(image, 0, floor - ROOM.skirting, width, ROOM.skirting, mixHex(colors.night, colors.ink, MIX.skirting));
  fillRect(image, 0, floor - ROOM.skirting, width, 1, mixHex(colors.night, colors.light, MIX.skirtingLight));
  fillRect(image, 0, floor, width, height - floor, colors.floor);
  const joint = mixHex(colors.floor, colors.ink, MIX.board);
  for (let y = floor + ROOM.skirting; y < height; y += ROOM.board) fillRect(image, 0, y, width, 1, joint);
  for (let y = floor; y < height; y += ROOM.board) {
    for (let x = (y / ROOM.board) % 2 ? 0 : ROOM.boardJoint / 2; x < width; x += ROOM.boardJoint) fillRect(image, x, y, 1, ROOM.board - 1, joint);
  }
  windowPart(image, colors, stars, moon);
  furniture(image, colors);
  const rugY = roomRow(height, ROOM.basketY) + RUG.below;
  outlinedDisc(image, ROOM.basketX, rugY, RUG.radiusX, RUG.radiusY, colors.rug, colors.ink);
  disc(image, ROOM.basketX, rugY, RUG.radiusX - RUG.inner, RUG.radiusY - 2, mixHex(colors.rug, colors.light, MIX.rugLight));
  disc(image, ROOM.basketX, rugY, RUG.radiusX - RUG.inner - 4, RUG.radiusY - 3, colors.rug);
  return image;
}

// The lamp shade, lit or dimmed, at its place on the table (left, top)
export function shadeImage(colors: RoomColors, lit: boolean): { image: PixelImage; at: Point } {
  const image = blankImage(Math.ceil(TABLE.shadeWidth + (2 * TABLE.shadeRows) / TABLE.shadeSlope) + 4, TABLE.shadeRows);
  const middle = image.width / 2;
  const color = lit ? colors.lamp : mixHex(colors.lamp, colors.trunk, MIX.dim);
  for (let row = 0; row < TABLE.shadeRows; row++) {
    const half = TABLE.shadeWidth / 2 + row / TABLE.shadeSlope;
    fillRect(image, middle - half - 1, row, 2 * half + 2, 1, colors.ink);
    fillRect(image, middle - half, row, 2 * half, 1, color);
  }
  return { image, at: [Math.round(TABLE.x + TABLE.shadeWidth / 2 + 6 - middle), TABLE.shadeTop] };
}

// The warm glow of the lamp: two discs with their alpha at full light
export function glowImages(colors: RoomColors): { image: PixelImage; at: Point; alpha: number }[] {
  return GLOW.discs.map(({ radius: [radiusX, radiusY], alpha, light }) => {
    const image = blankImage(2 * radiusX + 1, 2 * radiusY + 1);
    disc(image, radiusX, radiusY, radiusX, radiusY, mixHex(colors.lamp, colors.light, light));
    return { image, at: [TABLE.x + GLOW.center[0] - radiusX, GLOW.center[1] - radiusY], alpha };
  });
}

// A star that twinkles: a cross of five pixels in cream, its middle on the star
export function twinkleImage(colors: RoomColors): PixelImage {
  const image = blankImage(3, 3);
  for (const [x, y] of [[0, 1], [1, 0], [1, 1], [2, 1], [1, 2]]) setPixel(image, x, y, colors.cream);
  return image;
}

export type Basket = { back: PixelImage; front: PixelImage; left: number; backTop: number; frontTop: number };

// The basket: the back rim and the cushion (behind the dog) and the woven front rim (in front of it), with their places
export function basketImages(colors: RoomColors, height: number): Basket {
  const rim = roomRow(height, ROOM.basketY);
  const width = 2 * BASKET.radiusX + 5;
  const middle = Math.floor(width / 2);
  const centerY = BASKET.radiusY + 1;
  const back = blankImage(width, centerY + BASKET.rim + BASKET.cushion[1] + 2);
  disc(back, middle, centerY, BASKET.radiusX + 1, BASKET.radiusY + 1, colors.ink, true);
  disc(back, middle, centerY, BASKET.radiusX, BASKET.radiusY, colors.basket, true);
  disc(back, middle, centerY, BASKET.radiusX - 4, BASKET.radiusY - 3, mixHex(colors.basket, colors.ink, MIX.basketInner), true);
  outlinedDisc(back, middle, centerY + 3, BASKET.cushion[0], BASKET.cushion[1], colors.pillow, colors.ink);
  const front = blankImage(width, BASKET.rows + 2);
  for (let row = 0; row < BASKET.rows; row++) {
    const reach = Math.round(BASKET.radiusX * Math.sqrt(1 - (row / BASKET.curve) ** 2));
    fillRect(front, middle - reach - 1, row, 2 * reach + 3, 1, colors.ink);
    fillRect(front, middle - reach, row, 2 * reach + 1, 1, row % BASKET.weaveEvery === 1 ? mixHex(colors.basket, colors.ink, MIX.weave) : colors.basket);
  }
  fillRect(front, middle - BASKET.foot, BASKET.rows, 2 * BASKET.foot + 1, 1, colors.ink);
  return { back, front, left: ROOM.basketX - middle, backTop: rim - BASKET.rim - centerY, frontTop: rim - 1 };
}

// The darkness over the room when the lamp dims (its color; the stage gives it the alpha)
export const darknessOf = (colors: RoomColors) => mixHex(colors.night, colors.ink, MIX.dark);

// The "Z" of a sleeping dog in the cream of the signs
export const zImage = (colors: RoomColors) => spriteImage(SPRITES.zz, { o: colors.cream });
