// Line art of the Kebab theme on a canvas for the clips (stinger, banners): the shapes of chef.ts, the spit and the
// print as Rough.js lines in one stroke (like Ink.tsx draws them as SVG), the arc title from arc.ts with fillText,
// and the print of the wrapping paper. The Rough paths are built once per clip (inkOf) and only stroked per frame.
// Loaded with the clips in prepare, so Rough.js stays out of the entry chunk. Checks: stinger.check.ts, banners.check.ts.
import { roughPath, type RoughShape } from "../../core/rough/roughSvg.ts";
import { arcLayout, type ArcLetter } from "./arc.ts";
import type { InkPart } from "./chef.ts";
import { printSpits, SPIT_ICON } from "./pattern.ts";

export type InkStyle = { roughness: number; bowing: number; width: number; seed: number };
export type BuiltInk = { fills: Path2D[]; lines: { path: Path2D; width: number }[]; dots: InkPart["dots"] };

// fixed: the gap between arc letters and the width of a space as a share of the size, like ArcTitle.tsx; the print
// is stroked 3 px wide, open dots 2.2
const GAP = 0.06;
const SPACE = 0.35;
const PRINT_WIDTH = 3;
const DOT_WIDTH = 2.2;
const FULL_TURN = Math.PI * 2;

// The Rough lines of one part (paper fills, lines, dots), built once
export function inkOf(part: InkPart, style: InkStyle, salt: number): BuiltInk {
  return {
    fills: part.fills.map(fill => new Path2D(fill)),
    lines: part.lines.flatMap((line, index) => roughPath(line.shape, {
      roughness: style.roughness, bowing: style.bowing, strokeWidth: line.width * style.width, fill: "none", single: true,
    }, style.seed + salt + index).map(drawn => ({ path: new Path2D(drawn.d), width: line.width * style.width }))),
    dots: part.dots,
  };
}

// One shape as a part without fills
export const lineOf = (shape: RoughShape, width: number): InkPart => ({ fills: [], lines: [{ shape, width }], dots: [] });

export function drawInk(context: CanvasRenderingContext2D, ink: BuiltInk, colors: { ink: string; fill: string }) {
  context.fillStyle = colors.fill;
  for (const fill of ink.fills) context.fill(fill);
  context.strokeStyle = colors.ink;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const line of ink.lines) {
    context.lineWidth = line.width;
    context.stroke(line.path);
  }
  for (const dot of ink.dots) {
    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius, 0, FULL_TURN);
    if (dot.filled) {
      context.fillStyle = colors.ink;
      context.fill();
    } else {
      context.lineWidth = DOT_WIDTH;
      context.stroke();
    }
  }
}

export type ArcText = { text: string; center: { x: number; y: number }; radius: number; span: number; size: number; font: string; stroke: number; colors: { fill: string; stroke: string } };
export type PlacedLetter = ArcLetter & { char: string; index: number };

// The letters of an arc title with their place, measured in the font of the context (spaces take room, draw nothing)
export function arcLetters(context: CanvasRenderingContext2D, arc: ArcText): PlacedLetter[] {
  context.font = `${arc.size}px "${arc.font}"`;
  const chars = [...arc.text];
  const widths = chars.map(char => (char === " " ? arc.size * SPACE : context.measureText(char).width + arc.size * GAP));
  const placed = arcLayout(widths, arc.center, arc.radius, arc.span);
  let index = 0;
  return chars.flatMap((char, at) => (char === " " ? [] : [{ ...placed[at], char, index: index++ }]));
}

// fixed: a letter grows around a point a quarter of its size above the baseline (about 70 % of its height)
const LIFT = 0.25;

// The arc title: the outline first, the letter on top (like paint-order stroke); scaleOf gives the size of each
// letter (0 = not there yet)
export function drawArc(context: CanvasRenderingContext2D, arc: ArcText, letters: readonly PlacedLetter[], scaleOf: (index: number) => number = () => 1) {
  context.font = `${arc.size}px "${arc.font}"`;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.lineJoin = "round";
  context.lineWidth = arc.stroke;
  context.strokeStyle = arc.colors.stroke;
  context.fillStyle = arc.colors.fill;
  const lift = arc.size * LIFT;
  for (const letter of letters) {
    const scale = scaleOf(letter.index);
    if (scale <= 0) continue;
    context.save();
    context.translate(letter.x, letter.y);
    context.rotate((letter.angle * Math.PI) / 180);
    context.translate(0, -lift);
    context.scale(scale, scale);
    context.translate(0, lift);
    if (arc.stroke > 0) context.strokeText(letter.char, 0, 0);
    context.fillText(letter.char, 0, 0);
    context.restore();
  }
}

// The print of the wrapping paper over a picture: small spits, tile by tile
export function drawPrint(context: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const icon = SPIT_ICON.map(outline => new Path2D(outline));
  context.strokeStyle = color;
  context.lineWidth = PRINT_WIDTH;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const spit of printSpits(width, height)) {
    context.save();
    context.translate(spit.x, spit.y);
    context.rotate((spit.turn * Math.PI) / 180);
    for (const path of icon) context.stroke(path);
    context.restore();
  }
}
