// The Bärenbande world as watercolor with Rough.js (PLAN-BEARS.md package 11, DESIGN-BEARS.md "Modernisierung"): every
// surface is several soft washes on top of each other, each a Rough shape with an uneven edge, moved a little and thin;
// then a sketch line in the tone of the surface mixed toward the outline (never black); all on paper grain. The shapes
// are those of world.ts, so every thing stands on its ground; the far things are mixed with the sky (air perspective).
// The same seed gives the same picture. Pure apart from the context; makePath turns path text into a Path2D (injected
// for the check). Check: watercolor.check.ts.
import { mixHex } from "../../core/color.ts";
import { hash } from "../../core/hash.ts";
import { type RoughPart, roughPath, type RoughShape } from "../../core/rough/roughSvg.ts";
import type { WorldColors } from "./paint.ts";
import { blockBase, blocksPath, CITY, LIGHT, SCENE, SHAPES, type TimeOfDay, WORLD } from "./world.ts";

export type MakePath = (data: string) => Path2D;
export const browserPath: MakePath = data => (typeof Path2D === "function" ? new Path2D(data) : (data as unknown as Path2D));

// layers: washes per surface, alpha: of each wash, roughness: of the wash edges, sketch: mix of the sketch line toward
// the outline (0 to 1), grain: paper grain (0 to 1)
export type WashLook = { seed: number; layers: number; alpha: number; roughness: number; sketch: number; grain: number };
export type WorldShow = { city: boolean; bridge: boolean; cave: boolean; flowers: boolean };

export type Wash = { layers: { dx: number; dy: number; parts: RoughPart[] }[]; sketch: RoughPart[] };

// fixed: how far a wash moves off its shape (px each way), the hand of the sketch line, its width and strength, the
// strength of the paper grain at full grain
const JITTER = { x: 7, y: 5 };
const SKETCH = { roughness: 1.6, bowing: 1.2, width: 1.6, alpha: 0.55 };
const GRAIN = 36;

// A seeded sequence of values from 0 to below 1
function sequence(seed: number) {
  let index = 0;
  return () => hash(seed * 7919 + index++);
}
const seedFrom = (random: () => number) => 1 + Math.floor(random() * 1e6);

// One surface as washes: layers moved Rough shapes with a solid inside (only the inside), and the sketch line
export function wash(shape: RoughShape, seed: number, layers: number, roughness: number): Wash {
  const random = sequence(seed);
  return {
    layers: Array.from({ length: layers }, () => {
      const [dx, dy] = [(random() - 0.5) * 2 * JITTER.x, (random() - 0.5) * 2 * JITTER.y];
      return { dx, dy, parts: roughPath(shape, { roughness, bowing: 1, strokeWidth: 1, fill: "solid" }, seedFrom(random)).filter(part => part.filled) };
    }),
    sketch: roughPath(shape, { roughness: SKETCH.roughness, bowing: SKETCH.bowing, strokeWidth: SKETCH.width, fill: "none" }, seedFrom(random)),
  };
}

export type WashPaint = { color: string; alpha: number; sketch: number; outline: string };

export function paintWash(context: CanvasRenderingContext2D, washed: Wash, paint: WashPaint, makePath: MakePath = browserPath) {
  context.save();
  context.fillStyle = paint.color;
  context.globalAlpha = paint.alpha;
  for (const layer of washed.layers) {
    context.save();
    context.translate(layer.dx, layer.dy);
    for (const part of layer.parts) context.fill(makePath(part.d));
    context.restore();
  }
  if (paint.sketch > 0) {
    context.globalAlpha = SKETCH.alpha;
    context.strokeStyle = mixHex(paint.color, paint.outline, paint.sketch);
    context.lineWidth = SKETCH.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const part of washed.sketch) context.stroke(makePath(part.d));
  }
  context.restore();
}

// Sky gradient with the glow and the disc of sun or moon
export function paintSky(context: CanvasRenderingContext2D, colors: WorldColors, time: TimeOfDay, makePath: MakePath = browserPath) {
  const sky = context.createLinearGradient(0, 0, 0, WORLD.height * 0.7);
  sky.addColorStop(0, colors.skyTop);
  sky.addColorStop(1, colors.skyBottom);
  context.fillStyle = sky;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  const [x, y] = LIGHT[time];
  const glow = context.createRadialGradient(x, y, 0, x, y, 220);
  const shine = mixHex(colors.skyBottom, colors.light, 0.6);
  glow.addColorStop(0, shine);
  // The same color fully transparent, so the edge does not fade through black
  glow.addColorStop(1, `${shine}00`);
  context.fillStyle = glow;
  context.fillRect(x - 220, y - 220, 440, 440);
  context.save();
  context.translate(x, y);
  context.fillStyle = colors.light;
  context.fill(makePath(time === "nacht" ? SHAPES.moon : SHAPES.sun));
  context.restore();
}

// One cloud as a wash in a canvas of CLOUD_SIZE (the cloud shape of world.ts)
export const CLOUD_SIZE = { width: 200, height: 90 };
export function paintCloud(context: CanvasRenderingContext2D, colors: WorldColors, look: WashLook, index: number, makePath: MakePath = browserPath) {
  paintWash(context, wash({ kind: "path", d: SHAPES.cloud }, look.seed * 101 + index, look.layers, look.roughness / 2), { color: colors.cloud, alpha: Math.min(1, look.alpha * 1.5), sketch: look.sketch * 0.4, outline: colors.outline }, makePath);
}

type WashOptions = { layers?: number; alpha?: number; sketch?: number };

// The ways to put paint on the land: a washed surface (each with its own seed in the order of painting), a flat fill, a
// sketched line; fewer layers for small or far things
function brushes(context: CanvasRenderingContext2D, colors: WorldColors, look: WashLook, makePath: MakePath) {
  let surface = 0;
  const path = (data: string): RoughShape => ({ kind: "path", d: data });
  return {
    paint(data: string, color: string, options: WashOptions = {}) {
      const washed = wash(path(data), look.seed * 1009 + surface++, options.layers ?? look.layers, look.roughness);
      paintWash(context, washed, { color, alpha: Math.min(1, options.alpha ?? look.alpha), sketch: Math.min(1, (options.sketch ?? 1) * look.sketch), outline: colors.outline }, makePath);
    },
    flat(data: string, color: string, alpha: number) {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fill(makePath(data));
      context.restore();
    },
    sketched(data: string, color: string, width: number, roughness: number, seed: number) {
      context.save();
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = "round";
      for (const part of roughPath(path(data), { roughness, bowing: 1, strokeWidth: width, fill: "none" }, look.seed * 13 + seed)) context.stroke(makePath(part.d));
      context.restore();
    },
    fewer: (by: number) => Math.max(1, look.layers - by),
  };
}
type Brushes = ReturnType<typeof brushes>;

// Hills, city, far shore, water and bridge, mixed with the sky
function paintFar(brush: Brushes, colors: WorldColors, show: WorldShow) {
  const far = (color: string, part: number) => mixHex(color, colors.skyBottom, part);
  brush.paint(SHAPES.hills, far(colors.hills, 0.35), { sketch: 0.6 });
  if (show.city) {
    for (const block of CITY) brush.paint(blocksPath([block], blockBase, 24), far(colors.city, 0.2), { layers: brush.fewer(2) });
    brush.flat(SCENE.cityWindows, far(colors.cityWindow, 0.2), 0.5);
  }
  brush.paint(SCENE.farShore, far(colors.meadow, 0.45), { layers: brush.fewer(1), sketch: 0.7 });
  brush.paint(SCENE.water, colors.water, { sketch: 0.7 });
  if (show.bridge) {
    brush.sketched(SCENE.bridgeCables, colors.bridge, 3.5, 0.8, 1);
    brush.paint(SCENE.bridgeSolid, colors.bridge, { layers: 2, alpha: 0.9 });
  }
}

// Meadow, path, trees, cave hill, firs, tufts and flowers
function paintNear(context: CanvasRenderingContext2D, brush: Brushes, colors: WorldColors, look: WashLook, show: WorldShow) {
  // The meadow first gets a light ground coat, so the far shore and the water do not show through its washes
  brush.flat(SCENE.meadow, mixHex(colors.meadow, colors.skyBottom, 0.3), 1);
  brush.paint(SCENE.meadow, colors.meadow);
  brush.paint(SHAPES.meadowPatches, colors.meadowDark, { alpha: look.alpha * 0.8 });
  brush.paint(SCENE.road, colors.road, { layers: brush.fewer(1) });
  for (const { x, base, scale } of SCENE.trees) {
    context.save();
    context.translate(x, base);
    context.scale(scale, scale);
    brush.paint(SHAPES.trunk, colors.wood, { layers: 2 });
    brush.paint(SHAPES.crown, colors.treeLeaf, { alpha: look.alpha * 1.4 });
    brush.paint(SHAPES.crownShade, mixHex(colors.treeLeaf, colors.fir, 0.5), { layers: 2, sketch: 0 });
    context.restore();
  }
  if (show.cave) {
    brush.paint(SCENE.mound, colors.cave, { sketch: 1.1 });
    brush.paint(SCENE.cave, colors.caveDark, { alpha: look.alpha * 1.4, sketch: 1.4 });
  }
  for (const fir of SCENE.firs) {
    brush.paint(fir.body, colors.fir, { layers: look.layers + 1, alpha: look.alpha * 1.5 });
    brush.paint(fir.shade, colors.firDark, { layers: 2, alpha: look.alpha * 1.5, sketch: 0 });
  }
  if (show.flowers) {
    brush.sketched(SCENE.tufts, colors.meadowDark, 2, 1, 2);
    brush.flat(SCENE.flowers, colors.flower, 0.9);
  }
}

// The land and the far things, every surface washed in its order from far to near
export function paintLand(context: CanvasRenderingContext2D, colors: WorldColors, look: WashLook, show: WorldShow, makePath: MakePath = browserPath) {
  const brush = brushes(context, colors, look, makePath);
  paintFar(brush, colors, show);
  paintNear(context, brush, colors, look, show);
}

// Paper grain over the whole canvas: every pixel a little lighter or darker, from the seed
export function paintGrain(context: CanvasRenderingContext2D, width: number, height: number, grain: number, seed: number) {
  if (grain <= 0) return;
  const picture = context.getImageData(0, 0, width, height);
  const random = sequence(seed);
  const { data } = picture;
  for (let index = 0; index < data.length; index += 4) {
    const shift = (random() - 0.5) * GRAIN * grain;
    data[index] += shift;
    data[index + 1] += shift;
    data[index + 2] += shift;
  }
  context.putImageData(picture, 0, 0);
}
