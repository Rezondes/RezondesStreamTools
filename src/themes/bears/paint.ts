// Drawing of the Bärenbande character model on a canvas for stinger and banners: a bear in a pose (the same layers of the
// rig as Bear.tsx: limbs, body with outline, one shade tone and panda patches clipped to the body, face and props), the
// tower and the watercolor world (without filters: flat surfaces, far things mixed with the sky). Colors come in a
// palette from the settings, mixed with mix() instead of CSS color-mix. Paths become Path2D in the browser; without
// Path2D (checks in Node) the path text goes to the canvas as is, a recording mock only counts the calls.
// Check: paint.check.ts.
import { BEARS, isBearChoice, TOWER, TOWER_LEVELS, type BearId, type BodyShape, type PartKind } from "./bears.ts";
import { poseOf, POSES, towerLayout, type Drops, type PoseName } from "./rig.ts";
import { blocksPath, CITY, CITY_BASE, FIR_BASE, FIRS, firPath, firShadePath, FLOWERS, flowerPath, SHAPES, TREES, TUFTS, tuftPath, windowsPath, WORLD } from "./world.ts";

export type BearColors = { fur: string; shade: string; limb: string };
export type Palette = {
  outline: string;
  outlineWidth: number;
  bears: Record<BearId, BearColors>;
  patch: string;
  patchShade: string;
  eye: string;
  nose: string;
  mouth: string;
  tongue: string;
  teeth: string;
  phoneCase: string;
  phoneScreen: string;
  prop: string;
  food: string;
  paper: string;
  headphones: string;
};

export type WorldColors = {
  skyTop: string; skyBottom: string; light: string; cloud: string; hills: string; city: string; cityWindow: string; water: string; bridge: string;
  meadow: string; meadowDark: string; road: string; wood: string; treeLeaf: string; fir: string; firDark: string; cave: string; caveDark: string;
  flower: string; outline: string; sketch: number;
};

const cache = new Map<string, Path2D>();
// A path for fill, stroke and clip: Path2D in the browser, the text itself without it
export function shapeOf(path: string): Path2D {
  if (typeof Path2D !== "function") return path as unknown as Path2D;
  let shape = cache.get(path);
  if (!shape) {
    shape = new Path2D(path);
    cache.set(path, shape);
  }
  return shape;
}

// Mix two hex colors (#rrggbb): part of the second one from 0 to 1
export function mix(base: string, other: string, part: number): string {
  const channels = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
  const [from, to] = [channels(base), channels(other)];
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * part).toString(16).padStart(2, "0")).join("")}`;
}

// Fill color of a part, null = an open line in the outline color
function fillOf(kind: PartKind, bear: BearId, pose: PoseName, palette: Palette): string | null {
  const colors = palette.bears[bear];
  const phone = pose === "phone" || pose === "selfie";
  const fills: Partial<Record<PartKind, string>> = {
    back: colors.limb, limb: colors.limb, patch: palette.patch, eye: palette.eye, nose: palette.nose, mouth: palette.mouth, tongue: palette.tongue,
    teeth: palette.teeth, pad: bear === "panda" ? palette.patchShade : colors.shade, screen: palette.phoneScreen, paper: palette.paper,
    food: palette.food, prop: pose === "headphones" ? palette.headphones : phone ? palette.phoneCase : palette.prop,
  };
  return fills[kind] ?? null;
}

function strokeLine(context: CanvasRenderingContext2D, path: string, palette: Palette) {
  context.strokeStyle = palette.outline;
  context.lineWidth = palette.outlineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke(shapeOf(path));
}

// The body blob: fur, the shade and the panda patches clipped to it, the outline
function drawBody(context: CanvasRenderingContext2D, body: BodyShape, colors: BearColors, patched: boolean, palette: Palette) {
  context.fillStyle = colors.fur;
  context.fill(shapeOf(body.silhouette));
  context.save();
  context.clip(shapeOf(body.silhouette));
  context.fillStyle = colors.shade;
  for (const path of body.shade) context.fill(shapeOf(path));
  if (patched) {
    context.fillStyle = palette.patch;
    for (const path of body.patches) context.fill(shapeOf(path));
    context.clip(shapeOf(body.patches.join(" ")));
    context.fillStyle = palette.patchShade;
    for (const path of body.shade) context.fill(shapeOf(path));
  }
  context.restore();
  strokeLine(context, body.silhouette, palette);
}

// One bear standing with its feet on (x, baseY), height in px; facing -1 mirrors it, turn turns it around its upright
// axis (radians, positive toward the camera), drops let legs reach further down. Draws the layers of the rig in order.
export function drawBear(context: CanvasRenderingContext2D, bear: BearId, pose: PoseName, x: number, baseY: number, height: number, palette: Palette, facing = 1, turn = 0, drops: Drops = {}) {
  const shape = poseOf(bear, pose, turn, drops);
  const { scaleX, scaleY, patched } = BEARS[bear];
  const size = height / shape.height;
  const colors = palette.bears[bear];
  context.save();
  context.translate(x, baseY);
  context.scale(facing * size * scaleX, size * scaleY);
  context.translate(-shape.width / 2, -shape.height);
  for (const layer of shape.layers) {
    if (layer.body) {
      drawBody(context, layer.body, colors, patched, palette);
      continue;
    }
    for (const part of layer.parts) {
      if (part.kind === "patch" && !patched) continue;
      const fill = fillOf(part.kind, bear, pose, palette);
      if (fill) {
        context.fillStyle = fill;
        context.fill(shapeOf(part.d));
      }
      if (!fill || part.kind === "back") strokeLine(context, part.d, palette);
    }
  }
  context.restore();
}

// The tower: every level stands on the back of the one below (rig.ts towerLayout), its size in the units of the box of
// the bottom level
const TOWER_PLACED = towerLayout(TOWER_LEVELS);
const TOWER_LEFT = Math.min(...TOWER_PLACED.map(level => level.x));
const TOWER_RIGHT = Math.max(...TOWER_PLACED.map(level => level.x)) + POSES.four.width;
export const TOWER_SIZE = { width: TOWER_RIGHT - TOWER_LEFT, height: POSES.four.height - Math.min(...TOWER_PLACED.map(level => level.y)) };

// The tower of all three bears standing on (x, baseY), height in px, bottom level first
export function drawTower(context: CanvasRenderingContext2D, x: number, baseY: number, height: number, palette: Palette, facing = 1) {
  const size = height / TOWER_SIZE.height;
  const middle = (TOWER_LEFT + TOWER_RIGHT) / 2;
  for (const level of TOWER_PLACED) {
    const offsetX = (level.x + POSES.four.width / 2 - middle) * size * facing;
    drawBear(context, level.bear, level.pose, x + offsetX, baseY + level.y * size, POSES.four.height * size, palette, facing, 0, level.drops);
  }
}

// The bear of a choice (one bear in its pose or the tower)
export function drawHero(context: CanvasRenderingContext2D, choice: string, poses: Record<BearId, PoseName>, x: number, baseY: number, height: number, palette: Palette, facing = 1) {
  const picked = isBearChoice(choice) ? choice : "grizzly";
  if (picked === TOWER) drawTower(context, x, baseY, height, palette, facing);
  else drawBear(context, picked, poses[picked], x, baseY, height, palette, facing);
}

function surface(context: CanvasRenderingContext2D, path: string, fill: string, colors: WorldColors) {
  context.fillStyle = fill;
  context.fill(shapeOf(path));
  if (colors.sketch > 0) {
    context.strokeStyle = mix(fill, colors.outline, colors.sketch * 0.4);
    context.lineWidth = 2.5;
    context.stroke(shapeOf(path));
  }
}

// fixed: shapes of the world built once
const FIR_SHAPES = FIRS.map(([x, height, width]) => [firPath(x, FIR_BASE, height, width), firShadePath(x, FIR_BASE, height, width)] as const);
const CITY_SHAPES = [blocksPath(CITY, CITY_BASE), windowsPath(CITY, CITY_BASE)] as const;
const GROUND = [TUFTS.map(([x, y, size]) => tuftPath(x, y, size)).join(" "), FLOWERS.map(([x, y, size]) => flowerPath(x, y, size)).join(" ")] as const;
const CLOUDS = 4;

// Sky with sun or moon and clouds; drift 0..1 moves the clouds once across (1 = back at the start)
function drawSky(context: CanvasRenderingContext2D, colors: WorldColors, drift: number, light: readonly [number, number], night: boolean) {
  const sky = context.createLinearGradient(0, 0, 0, WORLD.height * 0.7);
  sky.addColorStop(0, colors.skyTop);
  sky.addColorStop(1, colors.skyBottom);
  context.fillStyle = sky;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.save();
  context.translate(light[0], light[1]);
  context.fillStyle = colors.light;
  context.fill(shapeOf(night ? SHAPES.moon : SHAPES.sun));
  context.restore();
  for (let index = 0; index < CLOUDS; index++) {
    const size = 1.4 + (index % 3) * 0.5;
    context.save();
    context.translate(((index / CLOUDS + drift) % 1) * (WORLD.width + 400) - 400, 60 + ((index * 83) % 240));
    context.scale(size, size);
    context.fillStyle = colors.cloud;
    context.fill(shapeOf(SHAPES.cloud));
    context.restore();
  }
}

// The far things mixed with the sky: hills, city, water, bridge
function drawFar(context: CanvasRenderingContext2D, colors: WorldColors) {
  const far = (color: string, part: number) => mix(color, colors.skyBottom, part);
  surface(context, SHAPES.hills, far(colors.hills, 0.35), colors);
  surface(context, CITY_SHAPES[0], far(colors.city, 0.3), colors);
  context.fillStyle = far(colors.cityWindow, 0.3);
  context.fill(shapeOf(CITY_SHAPES[1]));
  context.fillStyle = far(colors.water, 0.3);
  context.fill(shapeOf(SHAPES.water));
  context.fillStyle = far(colors.bridge, 0.25);
  context.fill(shapeOf(SHAPES.bridgeTowers));
  context.fill(shapeOf(SHAPES.bridgeDeck));
  context.strokeStyle = far(colors.bridge, 0.25);
  context.lineWidth = 4;
  context.stroke(shapeOf(SHAPES.bridgeCables));
}

// Meadow, path, trees, cave hill, firs, tufts and flowers
function drawLand(context: CanvasRenderingContext2D, colors: WorldColors) {
  surface(context, SHAPES.meadow, colors.meadow, colors);
  context.fillStyle = mix(colors.meadow, colors.meadowDark, 0.55);
  context.fill(shapeOf(SHAPES.meadowPatches));
  surface(context, SHAPES.path, colors.road, colors);
  for (const [x, base, scale] of TREES) {
    context.save();
    context.translate(x, base);
    context.scale(scale, scale);
    surface(context, SHAPES.trunk, colors.wood, colors);
    surface(context, SHAPES.crown, colors.treeLeaf, colors);
    context.restore();
  }
  surface(context, SHAPES.mound, mix(colors.cave, colors.meadowDark, 0.3), colors);
  context.fillStyle = colors.caveDark;
  context.fill(shapeOf(SHAPES.cave));
  for (const [body, shade] of FIR_SHAPES) {
    surface(context, body, colors.fir, colors);
    context.fillStyle = mix(colors.fir, colors.firDark, 0.6);
    context.fill(shapeOf(shade));
  }
  context.fillStyle = colors.meadowDark;
  context.fill(shapeOf(GROUND[0]));
  context.fillStyle = colors.flower;
  context.fill(shapeOf(GROUND[1]));
}

// The whole world in its 1920 x 1080 space
export function drawWorld(context: CanvasRenderingContext2D, colors: WorldColors, drift: number, light: readonly [number, number], night: boolean) {
  drawSky(context, colors, drift, light, night);
  drawFar(context, colors);
  drawLand(context, colors);
}
