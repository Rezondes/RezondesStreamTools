// Pixel kit of the Dogs theme (DESIGN-DOGS.md "Pixel-Welt"): a grid of keys (one character per pixel, "." empty, "o"
// outline) filled with shapes, an automatic outline around everything filled and light and shadow rims, then painted
// with a palette into a PixelImage (one color per pixel or null). No DOM; textures come from pixi/textures.ts.
// Check: pixels.check.ts.
import { mixHex } from "../../core/color.ts";

export type Point = readonly [number, number];
export type Shape =
  | { kind: "ellipse"; center: Point; radius: Point }
  | { kind: "polygon"; points: readonly Point[] }
  | { kind: "rect"; from: Point; to: Point };

// rims: per pixel 0, LIGHT, SHADOW or FAR (far legs, darker); keys: per pixel one key
export type PixelGrid = { width: number; height: number; keys: string[]; rims: Int8Array };
export type PixelImage = { width: number; height: number; colors: (string | null)[] };
export type Palette = Readonly<Record<string, string>>;

// The key of an empty pixel (kept off an export line: the rule checker reads quotes after export as an import)
const EMPTY_KEY = ".";
export const EMPTY = EMPTY_KEY;
export const OUTLINE = "o";
export const RIM = { light: 1, shadow: -1, far: -2 } as const;
// Keys of coat areas: only they get light and shadow rims
export const COAT_KEYS = "OWSTMXd";
// fixed: the shading of DESIGN-DOGS.md, three tones per area and far legs 24 % darker, mixed toward white and black
const SHADE = { light: 0.16, shadow: 0.16, far: 0.24, white: "#ffffff", black: "#000000" };

export function pixelGrid(width: number, height: number): PixelGrid {
  return { width, height, keys: Array<string>(width * height).fill(EMPTY), rims: new Int8Array(width * height) };
}

export const keyAt = (grid: PixelGrid, x: number, y: number) => (x < 0 || y < 0 || x >= grid.width || y >= grid.height ? EMPTY : grid.keys[y * grid.width + x]);

export function setKey(grid: PixelGrid, x: number, y: number, key: string, rim = 0) {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return;
  grid.keys[y * grid.width + x] = key;
  grid.rims[y * grid.width + x] = rim;
}

const insidePolygon = (points: readonly Point[], x: number, y: number) => {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [ax, ay] = points[index];
    const [bx, by] = points[previous];
    if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
};

// Whether the middle of a pixel lies in the shape (rect: corners inclusive, like the prototype)
export function covers(shape: Shape, x: number, y: number): boolean {
  if (shape.kind === "ellipse") return ((x - shape.center[0]) / shape.radius[0]) ** 2 + ((y - shape.center[1]) / shape.radius[1]) ** 2 <= 1;
  if (shape.kind === "rect") return x >= shape.from[0] && x <= shape.to[0] + 1 && y >= shape.from[1] && y <= shape.to[1] + 1;
  return insidePolygon(shape.points, x, y);
}

// Fills the shape with key; only: the keys it may paint over (e.g. "O" keeps a marking on the coat)
export function fillShape(grid: PixelGrid, shape: Shape, key: string, only?: string) {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (!covers(shape, x + 0.5, y + 0.5)) continue;
      if (only !== undefined && !only.includes(keyAt(grid, x, y))) continue;
      setKey(grid, x, y, key);
    }
  }
}

// A line of the given width (pixels to the right), e.g. the collar
export function drawLine(grid: PixelGrid, from: Point, to: Point, key: string, width = 1) {
  const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) * 2 + 1;
  for (let step = 0; step <= steps; step++) {
    const x = Math.round(from[0] + ((to[0] - from[0]) * step) / steps);
    const y = Math.round(from[1] + ((to[1] - from[1]) * step) / steps);
    for (let column = 0; column < width; column++) setKey(grid, x + column, y, key);
  }
}

const filled = (grid: PixelGrid, x: number, y: number) => {
  const key = keyAt(grid, x, y);
  return key !== EMPTY && key !== OUTLINE;
};

// Outline of one pixel around everything filled, never into a filled pixel
export function outline(grid: PixelGrid) {
  const ring: number[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (keyAt(grid, x, y) !== EMPTY) continue;
      if (filled(grid, x - 1, y) || filled(grid, x + 1, y) || filled(grid, x, y - 1) || filled(grid, x, y + 1)) ring.push(y * grid.width + x);
    }
  }
  for (const index of ring) grid.keys[index] = OUTLINE;
}

// Light at the top and right edge of coat areas, shadow at the bottom and left (and two pixels above the bottom)
export function shadeRims(grid: PixelGrid, coatKeys = COAT_KEYS) {
  const edge = (x: number, y: number) => {
    const key = keyAt(grid, x, y);
    return key === OUTLINE || key === EMPTY;
  };
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (!coatKeys.includes(keyAt(grid, x, y))) continue;
      let rim = 0;
      if (edge(x, y - 1) || edge(x + 1, y)) rim = RIM.light;
      if (edge(x, y + 1) || edge(x - 1, y) || (edge(x, y + 2) && !edge(x, y - 1))) rim = RIM.shadow;
      grid.rims[y * grid.width + x] = rim;
    }
  }
}

// Outline and rims in one go, the last step of every figure
export function finish(grid: PixelGrid) {
  outline(grid);
  shadeRims(grid);
  return grid;
}

const shaded = new Map<string, string>();
// A tone of the palette color: light, shadow or a far leg; memoized, every pose paints the same few colors
export function toneOf(color: string, rim: number): string {
  if (rim === 0) return color;
  const memo = `${color}${rim}`;
  let tone = shaded.get(memo);
  if (!tone) {
    if (rim > 0) tone = mixHex(color, SHADE.white, SHADE.light);
    else tone = mixHex(color, SHADE.black, rim === RIM.shadow ? SHADE.shadow : SHADE.far);
    shaded.set(memo, tone);
  }
  return tone;
}

export const blankImage = (width: number, height: number): PixelImage => ({ width, height, colors: Array<string | null>(width * height).fill(null) });

export function setPixel(image: PixelImage, x: number, y: number, color: string | null) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  image.colors[y * image.width + x] = color;
}

// Paints grid into image at (left, top): keys to colors with their rims; a key missing in the palette stays empty
export function paintGrid(image: PixelImage, grid: PixelGrid, palette: Palette, left = 0, top = 0) {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const key = grid.keys[y * grid.width + x];
      const color = key === EMPTY ? undefined : palette[key];
      if (color) setPixel(image, left + x, top + y, toneOf(color, grid.rims[y * grid.width + x]));
    }
  }
}

// The grid as an image of its own size
export function paintImage(grid: PixelGrid, palette: Palette): PixelImage {
  const image = blankImage(grid.width, grid.height);
  paintGrid(image, grid, palette);
  return image;
}
