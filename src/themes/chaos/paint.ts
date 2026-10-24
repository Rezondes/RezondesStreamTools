// Canvas painting of the Chaos theme for the stinger and the banners: the wall (ground, violet blotches, spray dust), the
// scribbles (a take of each, some of them Rough shapes with a filled inside), painted brush strokes with bristles and
// drips (brush.ts), spray mist (burstAt of the core) and sprayed text with glow and drips. The same shapes as the scenes,
// glow from shadowBlur. Pure apart from the context; makePath turns path text into a Path2D (injected for the check).
// Check: paint.check.ts.
import type { BurstParticle } from "../../core/motion/burst.ts";
import { type Brush, type BrushFrame, brushPoint } from "./brush.ts";
import { chance } from "./chance.ts";
import { dripAt } from "./idle.ts";
import type { ScribbleTake } from "./roughScribbles.ts";
import type { Scribble } from "./scribbles.ts";
import { dripPath, speckles, titleDrips } from "./strokes.ts";
import type { Blotch, Dust } from "./wall.ts";

export type ChaosColors = {
  ground: string; wall: string; accent: string; accentText: string; accent2: string; violet: string; violetLight: string; lilac: string;
  textColor: string; mutedColor: string; scribbles: readonly [string, string, string, string];
};
export type MakePath = (data: string) => Path2D;
// Path2D in the browser; without it (checks in Node) the path text goes to the canvas as is
export const browserPath: MakePath = data => typeof Path2D === "function" ? new Path2D(data) : data as unknown as Path2D;

// Glow radius in pixels at full glow
const GLOW = 40;

// Ground with the lighter wall in the middle, blotches and dust, scaled from the 1920x1080 stage to the canvas
export function paintWall(context: CanvasRenderingContext2D, width: number, height: number, colors: ChaosColors, stains: readonly Blotch[], dots: readonly Dust[], scale: number) {
  const light = context.createRadialGradient(width / 2, height * 0.48, 0, width / 2, height * 0.48, Math.max(width, height) * 0.7);
  light.addColorStop(0, colors.wall);
  light.addColorStop(1, colors.ground);
  context.fillStyle = light;
  context.fillRect(0, 0, width, height);
  for (const stain of stains) {
    const [x, y, radius] = [stain.x * scale, stain.y * scale, stain.radiusX * scale];
    const blot = context.createRadialGradient(x, y, 0, x, y, radius);
    blot.addColorStop(0, colors.violet);
    blot.addColorStop(1, "transparent"); // fixed: canvas keyword for the faded edge
    context.globalAlpha = stain.opacity * (stain.deep ? 0.6 : 1);
    context.fillStyle = blot;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const dustColor = { color1: colors.scribbles[0], color2: colors.scribbles[1], lilac: colors.lilac, white: colors.textColor };
  for (const dot of dots) {
    context.globalAlpha = dot.opacity;
    context.fillStyle = dustColor[dot.color];
    context.fillRect(dot.x * scale, dot.y * scale, dot.radius * 2 * scale, dot.radius * 2 * scale);
  }
  context.globalAlpha = 1;
}

// fixed: paint body, the width of rough fill strokes against the outline, dot size and strength of the spray mist
const BODY_ALPHA = 0.6;
const ROUGH_FILL = 0.6;
const MIST = { size: 2.4, alpha: 0.6 };

// The scribbles: open lines, neon ones with glow; takeOf picks the take of a mark (its own paths without)
export function paintScribbles(context: CanvasRenderingContext2D, marks: readonly Scribble[], colors: ChaosColors, widthFactor: number, glow: number, scale: number, makePath: MakePath = browserPath, takeOf?: (index: number) => ScribbleTake) {
  const tone = { color1: colors.scribbles[0], color2: colors.scribbles[1], color3: colors.scribbles[2], color4: colors.scribbles[3], white: colors.textColor };
  context.lineCap = "round";
  context.lineJoin = "round";
  marks.forEach((mark, index) => {
    const take = takeOf?.(index) ?? { rough: false, parts: mark.paths.map(path => ({ d: path, filled: false })) };
    // Rough takes are drawn in pixels, the others in the unit of the mark
    const unit = take.rough ? 1 : mark.size;
    context.save();
    context.translate(mark.x * scale, mark.y * scale);
    context.rotate((mark.rotate * Math.PI) / 180);
    context.scale(unit * scale, unit * scale);
    context.strokeStyle = tone[mark.color];
    context.globalAlpha = mark.line === "chalk" ? 0.8 : 1;
    context.shadowColor = tone[mark.color];
    context.shadowBlur = mark.line === "neon" ? GLOW * 0.4 * glow * scale : 0;
    for (const part of take.parts) {
      context.lineWidth = (mark.width / unit) * widthFactor * (part.filled ? ROUGH_FILL : 1);
      context.stroke(makePath(part.d));
    }
    context.restore();
  });
  context.globalAlpha = 1;
}

function trace(context: CanvasRenderingContext2D, points: readonly number[], closed: boolean) {
  context.beginPath();
  for (let index = 0; index < points.length; index += 2) {
    if (index === 0) context.moveTo(points[0], points[1]);
    else context.lineTo(points[index], points[index + 1]);
  }
  if (closed) context.closePath();
}

// fixed: the shimmer of the light bristles: how deep it dims, how far apart neighbouring bristles are in its wave
const SHIMMER = { depth: 0.45, spread: 0.13 };

// A painted brush stroke (brushAt of brush.ts): the paint body with glow, the bristles over it, light ones in the light
// color; shimmer (banners) runs a light wave along the light bristles at a share of the loop, the same at 0 and 1, its
// depth times strength
export function paintBrushFrame(context: CanvasRenderingContext2D, frame: BrushFrame, ink: string, light: string, glow: number, shimmer?: { at: number; strength: number }) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  if (frame.body) {
    context.fillStyle = ink;
    context.shadowColor = ink;
    context.shadowBlur = GLOW * 0.6 * glow;
    context.globalAlpha = BODY_ALPHA;
    trace(context, frame.body, true);
    context.fill();
    context.shadowBlur = 0;
  }
  frame.bristles.forEach((bristle, index) => {
    const depth = shimmer && bristle.light ? Math.min(1, SHIMMER.depth * shimmer.strength) : 0;
    const wave = 1 - depth * (0.5 + 0.5 * Math.sin(((shimmer?.at ?? 0) + index * SHIMMER.spread) * Math.PI * 2));
    context.globalAlpha = bristle.alpha * wave;
    context.strokeStyle = bristle.light ? light : ink;
    context.lineWidth = bristle.width;
    trace(context, bristle.points, false);
    context.stroke();
  });
  context.restore();
}

// The drips of a brush since seconds after it was painted: each runs down to its length (dripAt of idle.ts)
export function paintBrushDrips(context: CanvasRenderingContext2D, brush: Brush, ink: string, since: number, makePath: MakePath = browserPath) {
  context.save();
  context.fillStyle = ink;
  for (const drip of brush.drips) {
    const { run } = dripAt(drip, since, null);
    if (run <= 0) continue;
    const top = brushPoint(brush, drip.at, drip.offset);
    context.fill(makePath(dripPath(top.x, top.y, run, drip.width)));
  }
  context.restore();
}

// Spray mist: fine dots of a burst, each fading with its particle
export function paintMist(context: CanvasRenderingContext2D, particles: readonly BurstParticle[], color: string) {
  context.save();
  context.fillStyle = color;
  for (const dot of particles) {
    if (dot.opacity <= 0) continue;
    context.globalAlpha = dot.opacity * MIST.alpha;
    context.fillRect(dot.x, dot.y, MIST.size, MIST.size);
  }
  context.restore();
}

type SprayText = { text: string; x: number; y: number; size: number; font: string; color: string; glowColor: string; glow: number; seed: number; drips: boolean };

// Sprayed text centered at x on the baseline y: glow, speckles around it, drips below
export function paintSpray(context: CanvasRenderingContext2D, spray: SprayText, makePath: MakePath = browserPath) {
  context.save();
  context.font = `${spray.size}px "${spray.font}", sans-serif`;
  context.textBaseline = "alphabetic";
  const width = context.measureText(spray.text).width;
  const [left, top] = [spray.x - width / 2, spray.y - spray.size * 0.8];
  const random = chance(spray.seed);
  context.fillStyle = spray.glowColor;
  for (const dot of speckles(spray.seed, width, spray.size, Math.round((width * spray.size) / 400))) {
    context.globalAlpha = dot.opacity;
    context.fillRect(left + dot.x, top + dot.y, dot.radius * 2, dot.radius * 2);
  }
  context.globalAlpha = 1;
  if (spray.drips) {
    for (const drip of titleDrips(spray.seed, Math.max(2, Math.round(width / 160)))) {
      context.fill(makePath(dripPath(left + drip.at * width, spray.y - spray.size * 0.1, drip.length * (spray.size / 160) * (0.6 + random() * 0.4), drip.thickness * (spray.size / 160))));
    }
  }
  context.shadowColor = spray.glowColor;
  context.shadowBlur = GLOW * spray.glow;
  context.fillStyle = spray.color;
  context.fillText(spray.text, left, spray.y);
  context.restore();
  return width;
}
