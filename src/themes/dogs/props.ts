// Props of the Dogs theme as pixel sprites (DESIGN-DOGS.md "Requisiten", prototype refs/pxworld.js): heart, paw, ball,
// bone, frisbee, treat, "Z" and the butterfly in two frames as text rows (one key per pixel, "." empty), the paw marker
// of the Starting scene. The palette maps the keys to the colors of the settings. Check: props.check.ts.
import { mixHex } from "../../core/color.ts";
import { blankImage, setPixel, type Palette, type PixelImage } from "./pixels.ts";
import { fillRect, outlinedDisc } from "./world.ts";

export const SPRITES = {
  heart: [".oo.oo.", "oRRoRRo", "oRWRRRo", "oRRRRRo", ".oRRRo.", "..oRo..", "...o..."],
  paw: ["W.W.W", ".....", ".WWW.", "WWWWW", ".WWW."],
  ball: ["..oooo..", ".oYYYYo.", "oYWWYYyo", "oYWYYYyo", "oYYYYyyo", "oyYYyyyo", ".oyyyyo.", "..oooo.."],
  bone: [".ooo...ooo.", "oCCCoooCCCo", ".oCCCCCCCo.", ".oCCCCCCco.", "occcoooccco", ".ooo...ooo."],
  frisbee: ["..ooooooo..", ".oRrrrrrRo.", "oRRRRRRRRRo", ".ooooooooo."],
  treat: ["..oooo..", ".oBBBBo.", "oBbBBbBo", "oBBBBBBo", "oBBbBBbo", ".oBBBBo.", "..oooo.."],
  zz: ["ooooo", "...o.", "..o..", ".o...", "ooooo"],
  fly1: ["oP.Po", "PPoPP", ".PoP.", "P.o.P"],
  fly2: [".....", "oPoPo", "PPoPP", "..o.."],
} as const;
export type SpriteName = keyof typeof SPRITES;

export type PropColors = { ink: string; accent: string; light: string; ball: string; cream: string; edge: string; brown: string; pink: string };

// fixed: lighter and darker tones of the props, mixed from the settings
const MIX = { accentLight: 0.25, ballDark: 0.2, brownDark: 0.3 };
const BLACK = "#000000"; // fixed: darker tones mix toward black

export function propPalette(colors: PropColors): Palette {
  return {
    o: colors.ink, R: colors.accent, r: mixHex(colors.accent, colors.light, MIX.accentLight), W: colors.light,
    Y: colors.ball, y: mixHex(colors.ball, BLACK, MIX.ballDark), C: colors.cream, c: colors.edge,
    B: colors.brown, b: mixHex(colors.brown, BLACK, MIX.brownDark), P: colors.pink,
  };
}

// A sprite as an image; keys missing in the palette stay empty
export function spriteImage(rows: readonly string[], palette: Palette): PixelImage {
  const image = blankImage(Math.max(...rows.map(row => row.length)), rows.length);
  rows.forEach((row, y) => [...row].forEach((key, x) => {
    const color = palette[key];
    if (color) setPixel(image, x, y, color);
  }));
  return image;
}

// fixed: the marker of the prototype: a disc of radius 6 with a point of 4 rows below, the paw from 80 % of its size;
// the middle of the disc sits at MARKER_CENTER in the image
export const MARKER = { radius: 6, point: 4, pawFrom: 0.8, size: 16 };
export const MARKER_CENTER = MARKER.radius + 1;

// The paw marker at a size from 0 to 1 (it pops in and out)
export function markerImage(colors: PropColors, share: number): PixelImage {
  const image = blankImage(MARKER.size, MARKER.size + MARKER.point);
  if (share <= 0) return image;
  const radius = Math.max(1, Math.round(MARKER.radius * share));
  for (let row = 0; row < MARKER.point; row++) {
    fillRect(image, MARKER_CENTER - (MARKER.point - row), MARKER_CENTER + radius + row, 2 * (MARKER.point - row) + 1, 1, colors.ink);
    fillRect(image, MARKER_CENTER - (MARKER.point - 1 - row), MARKER_CENTER + radius + row, 2 * (MARKER.point - 1 - row) + 1, 1, colors.accent);
  }
  outlinedDisc(image, MARKER_CENTER, MARKER_CENTER, radius, radius, colors.accent, colors.ink);
  if (share >= MARKER.pawFrom) {
    const paw = spriteImage(SPRITES.paw, { W: colors.light });
    paw.colors.forEach((color, index) => {
      if (color) setPixel(image, MARKER_CENTER - 2 + (index % paw.width), MARKER_CENTER - 2 + Math.floor(index / paw.width), color);
    });
  }
  return image;
}
