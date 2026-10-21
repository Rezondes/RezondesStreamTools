// The Plantage world painted on a 2D canvas for the banners (world.ts, tree.ts): the same depth layers as the PixiJS
// scenes, scaled to cover the picture: sky, sun with glow, clouds, hills and tree rows that fade into the sky and blur
// with the distance, the field with furrows, near trees, crates and grass. Trees and grass sway once per loop, so a GIF
// loops seamlessly. Pure function of the time. Check: paint.check.ts.
import { mixHex } from "../../core/color.ts";
import { STAGE } from "../../core/screens/screens.ts";
import { type Shape, tree, type TreeColors } from "./tree.ts";
import { cloudSpots, crate, CRATES, FIELD, furrows, grassTufts, hillLine, HILLS, worldLayers, type WorldLayer } from "./world.ts";

export type PaintColors = TreeColors & {
  skyTop: string; skyBottom: string; sun: string; hill: string; hillFar: string; soil: string; soilDark: string; grass: string; cloud: string; wood: string; woodDark: string;
};
export type PaintOptions = { colors: PaintColors; seed: number; treeRowsFar: number; treeRowsMid: number; farBlur: number; hazeFar: number; sway: number; loop: number; label: string; labelFont: string };

const TURN = Math.PI * 2;
// fixed: sun of the banners (stage px), cloud puffs, grass tufts, how far trees and grass lean at most (radians)
const SUN = { x: 520, y: 300, size: 70, glow: 310 };
const CLOUD_PUFFS: readonly [number, number, number][] = [[0, 0, 60], [55, -18, 50], [105, 2, 54], [40, 18, 52], [85, 22, 44]];
const GRASS_TUFTS = 16;
const LEAN = { tree: 0.02, grass: 0.08 };
// Rounded to three places, so frame 0 and the frame at the loop end are drawn exactly the same
const round = (value: number) => Math.round(value * 1000) / 1000 + 0;

// Shapes of tree.ts and world.ts onto the canvas
export function paintShapes(context: CanvasRenderingContext2D, shapes: readonly Shape[]) {
  for (const shape of shapes) {
    context.globalAlpha = shape.alpha ?? 1;
    context.fillStyle = shape.color;
    context.beginPath();
    if (shape.kind === "circle") context.arc(shape.x, shape.y, shape.r, 0, TURN);
    else if (shape.kind === "ellipse") context.ellipse(shape.x, shape.y, shape.rx, shape.ry, 0, 0, TURN);
    else if (shape.radius) context.roundRect(shape.x, shape.y, shape.w, shape.h, shape.radius);
    else context.rect(shape.x, shape.y, shape.w, shape.h);
    context.fill();
  }
  context.globalAlpha = 1;
}

// Scale and offset that let the 1920x1080 world cover a picture of the given size, horizon in view
export function coverOf(width: number, height: number) {
  const scale = Math.max(width / STAGE.width, height / STAGE.height);
  return { scale, x: (width - STAGE.width * scale) / 2, y: (height - STAGE.height * scale) / 2 };
}

// Lean once around per loop: the same at the start and the end of the loop
const leanAt = (seconds: number, loop: number, phase: number, size: number, amount: number) => round(Math.sin((seconds / loop) * TURN + phase) * size * amount);

function sky(context: CanvasRenderingContext2D, colors: PaintColors) {
  const fill = context.createLinearGradient(0, 0, 0, FIELD.horizon);
  fill.addColorStop(0, colors.skyTop);
  fill.addColorStop(1, colors.skyBottom);
  context.fillStyle = fill;
  context.fillRect(0, 0, STAGE.width, STAGE.height);
  const glow = context.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, SUN.glow);
  glow.addColorStop(0, colors.sun);
  glow.addColorStop(1, `${colors.sun}00`);
  context.fillStyle = glow;
  context.fillRect(SUN.x - SUN.glow, SUN.y - SUN.glow, SUN.glow * 2, SUN.glow * 2);
  paintShapes(context, [{ kind: "circle", x: SUN.x, y: SUN.y, r: SUN.size, color: colors.sun }]);
}

function layer(context: CanvasRenderingContext2D, entry: WorldLayer, options: PaintOptions, seconds: number) {
  const { colors } = options;
  const haze = (color: string) => mixHex(color, colors.skyBottom, entry.haze);
  context.filter = entry.blur > 0 ? `blur(${entry.blur}px)` : "none";
  if (entry.id === "clouds") for (const spot of cloudSpots(4)) {
    paintShapes(context, CLOUD_PUFFS.map(([x, y, size]): Shape => ({ kind: "circle", x: spot.x + x * spot.size, y: spot.y + y * spot.size, r: size * spot.size, color: haze(colors.cloud), alpha: 0.9 })));
  }
  if (entry.id === "hillsFar" || entry.id === "hillsNear") {
    const points = hillLine(entry.id === "hillsFar" ? HILLS.far : HILLS.near);
    context.fillStyle = haze(entry.id === "hillsFar" ? colors.hill : colors.hillFar);
    context.beginPath();
    for (let index = 0; index < points.length; index += 2) context.lineTo(points[index], points[index + 1]);
    context.fill();
  }
  if (entry.id === "field") {
    context.fillStyle = colors.soil;
    context.fillRect(0, FIELD.horizon, STAGE.width, STAGE.height - FIELD.horizon);
    context.fillStyle = colors.soilDark;
    context.globalAlpha = 0.5;
    for (const quad of furrows()) {
      context.beginPath();
      for (let index = 0; index < quad.length; index += 2) context.lineTo(quad[index], quad[index + 1]);
      context.fill();
    }
    context.globalAlpha = 1;
    paintShapes(context, [{ kind: "rect", x: 0, y: FIELD.grassTop, w: STAGE.width, h: FIELD.grassHeight, color: colors.grass, alpha: 0.9 }]);
  }
  for (const spot of entry.trees) {
    context.save();
    context.translate(spot.x, spot.ground);
    context.rotate(leanAt(seconds, options.loop, spot.sway, LEAN.tree, options.sway));
    paintShapes(context, tree(spot.scale, entry.haze, { ...colors, sky: colors.skyBottom }));
    context.restore();
  }
  context.filter = "none";
  if (entry.id === "front") front(context, options, seconds);
}

function front(context: CanvasRenderingContext2D, options: PaintOptions, seconds: number) {
  const { colors } = options;
  for (const spot of CRATES) {
    context.save();
    context.translate(spot.x, spot.y);
    paintShapes(context, crate({ wood: colors.wood, woodDark: colors.woodDark, shadow: colors.shadow, mango: colors.mango, mangoBlush: colors.mangoBlush, gloss: colors.gloss }));
    if (spot.label && options.label) {
      context.fillStyle = colors.shadow;
      context.font = `700 40px "${options.labelFont}", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(options.label, 0, -55);
    }
    context.restore();
  }
  grassTufts(options.seed, GRASS_TUFTS).forEach((tuft, index) => {
    context.save();
    context.translate(tuft.x, STAGE.height + 5);
    context.rotate(leanAt(seconds, options.loop, index, LEAN.grass, options.sway));
    tuft.blades.forEach((height, blade) => {
      context.fillStyle = blade % 2 ? colors.leaf : colors.grass;
      context.beginPath();
      context.moveTo((blade - 2) * 9, 0);
      context.lineTo((blade - 2) * 9 + 5, 0);
      context.lineTo((blade - 2) * 22 + 4, -height);
      context.fill();
    });
    context.restore();
  });
}

// The world covering a picture of width x height at seconds into the loop
export function paintWorld(context: CanvasRenderingContext2D, width: number, height: number, options: PaintOptions, seconds: number) {
  const cover = coverOf(width, height);
  context.save();
  context.translate(cover.x, cover.y);
  context.scale(cover.scale, cover.scale);
  sky(context, options.colors);
  for (const entry of worldLayers(options)) layer(context, entry, options, seconds);
  context.restore();
}
