// Canvas painting of the Chaos theme for the stinger and the banners: the wall (ground, violet blotches, spray dust), the
// scribbles, brush strokes with bristles, splatter and drips, energy swathes and sprayed text with glow and drips. The
// same shapes as the scenes (scribbles.ts, strokes.ts, swathes.ts, wall.ts), glow from shadowBlur. Pure apart from the
// context; makePath turns path text into a Path2D (injected for the check). Check: paint.check.ts.
import { chance } from "./chance.ts";
import type { Scribble } from "./scribbles.ts";
import { dripPath, speckles, titleDrips, type BrushStroke } from "./strokes.ts";
import type { Swathes } from "./swathes.ts";
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

// The scribbles: open lines, neon ones with glow
export function paintScribbles(context: CanvasRenderingContext2D, marks: readonly Scribble[], colors: ChaosColors, widthFactor: number, glow: number, scale: number, makePath: MakePath = browserPath) {
  const tone = { color1: colors.scribbles[0], color2: colors.scribbles[1], color3: colors.scribbles[2], color4: colors.scribbles[3], white: colors.textColor };
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const mark of marks) {
    context.save();
    context.translate(mark.x * scale, mark.y * scale);
    context.rotate((mark.rotate * Math.PI) / 180);
    context.scale(mark.size * scale, mark.size * scale);
    context.strokeStyle = tone[mark.color];
    context.lineWidth = (mark.width / mark.size) * widthFactor;
    context.globalAlpha = mark.line === "chalk" ? 0.8 : 1;
    context.shadowColor = tone[mark.color];
    context.shadowBlur = mark.line === "neon" ? GLOW * 0.4 * glow * scale : 0;
    for (const path of mark.paths) context.stroke(makePath(path));
    context.restore();
  }
  context.globalAlpha = 1;
}

// One brush stroke in its ink; light bristles in the light color (faint), the others in the ink
export function paintBrush(context: CanvasRenderingContext2D, brush: BrushStroke, ink: string, light: string, glow: number, drips: boolean, makePath: MakePath = browserPath) {
  context.save();
  context.fillStyle = ink;
  context.shadowColor = ink;
  context.shadowBlur = GLOW * 0.6 * glow;
  context.globalAlpha = 0.9;
  context.fill(makePath(brush.body));
  context.shadowBlur = 0;
  context.lineCap = "round";
  for (const bristle of [...brush.bristles, ...brush.tail]) {
    context.globalAlpha = bristle.light ? bristle.opacity * 0.5 : bristle.opacity;
    context.strokeStyle = bristle.light ? light : ink;
    context.lineWidth = bristle.width;
    context.stroke(makePath(bristle.d));
  }
  for (const drop of brush.drops) {
    context.globalAlpha = drop.opacity;
    context.beginPath();
    context.ellipse(drop.x, drop.y, drop.radiusX, drop.radiusY, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  if (drips) for (const drip of brush.drips) context.fill(makePath(drip));
  context.restore();
}

// Energy swathes: tongues and streaks in their tones, with glow
export function paintSwath(context: CanvasRenderingContext2D, swath: Swathes, colors: ChaosColors, glow: number, makePath: MakePath = browserPath) {
  const tone = { hot: colors.textColor, magenta: colors.accent, cyan: colors.accent2, violet: colors.violetLight, lilac: colors.lilac };
  context.save();
  context.lineCap = "round";
  for (const tongue of swath.tongues) {
    context.globalAlpha = tongue.opacity;
    context.fillStyle = tone[tongue.tone];
    context.shadowColor = tone[tongue.tone];
    context.shadowBlur = GLOW * 0.5 * glow;
    context.fill(makePath(tongue.d));
  }
  context.shadowBlur = 0;
  for (const streak of swath.streaks) {
    context.globalAlpha = streak.opacity;
    context.strokeStyle = tone[streak.tone];
    context.lineWidth = streak.width;
    context.stroke(makePath(streak.d));
  }
  context.restore();
}

export type SprayText = { text: string; x: number; y: number; size: number; font: string; color: string; glowColor: string; glow: number; seed: number; drips: boolean };

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
