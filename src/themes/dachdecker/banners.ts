// Banners of the Dachdecker theme (DESIGN-DACHDECKER.md "Banner") in 2D, drawn like the alert sign: a blueprint card with
// a fine grid, a white edge, terracotta corner marks, a dimension line with a spaced overline and the title in
// terracotta with a glow. The profile banner carries the channel name next to a gable drawing, the offline banner the
// offline text under the roof in the rain. Every moving part is a whole number of laps per loop, so the last frame meets
// the first. Check: banners.check.ts.
import { hash } from "../../core/hash.ts";

export type BannerColors = { blueprint: string; page: string; accent: string; copper: string; line: string; rainColor: string };
export type BannerText = { title: string; overline: string; subtitle: string };
export type BannerOptions = {
  width: number; height: number; loop: number; font: string; titleSize: number; fontSize: number; grid: number; glow: number;
  rain: boolean; drops: number; seed: number; colors: BannerColors;
};
type Box = { x: number; y: number; w: number; h: number };

// Rain: falls per loop between 2 and 4, streak length and slant as shares of the height
const RAIN = { laps: [2, 3, 4], length: 0.035, slant: 0.006, opacity: 0.55 };
// Grid: every fifth line is stronger; corner marks as shares of the height; spacing of the overline
const GRID = { major: 5, page: 0.06, card: 0.09 };
const MARK = { length: 0.045, width: 0.008, gap: 0.012 };
const SPACING = "0.32em";
const TAU = Math.PI * 2;

// Fallen share of drop index at time (0 at the top, 1 at the bottom): a whole number of falls per loop, so time 0 and
// time loop are the same
export function dropFall(index: number, time: number, loop: number, seed: number): number {
  const laps = RAIN.laps[Math.floor(hash(seed * 31 + index) * RAIN.laps.length)];
  return (hash(seed * 17 + index) + (laps * time) / loop) % 1;
}

// Position of the marker running along the dimension line (0 to 1), once per loop there and back
export const markerAt = (time: number, loop: number) => (1 - Math.cos((time / loop) * TAU)) / 2;

function grid(context: CanvasRenderingContext2D, box: Box, step: number, color: string, faint: number) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  const strength = (index: number) => { context.globalAlpha = index % GRID.major === 0 ? faint * 2 : faint; };
  for (let index = 0, at = box.x; at <= box.x + box.w; index++, at += step) {
    strength(index);
    context.beginPath();
    context.moveTo(at, box.y);
    context.lineTo(at, box.y + box.h);
    context.stroke();
  }
  for (let index = 0, at = box.y; at <= box.y + box.h; index++, at += step) {
    strength(index);
    context.beginPath();
    context.moveTo(box.x, at);
    context.lineTo(box.x + box.w, at);
    context.stroke();
  }
  context.restore();
}

function background(context: CanvasRenderingContext2D, options: BannerOptions) {
  const { width, height, colors } = options;
  const fade = context.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, colors.blueprint);
  fade.addColorStop(1, colors.page);
  context.fillStyle = fade;
  context.fillRect(0, 0, width, height);
  grid(context, { x: 0, y: 0, w: width, h: height }, options.grid, colors.line, GRID.page);
}

// The sign: blueprint card with a finer grid, white edge and terracotta corner marks top left and bottom right
function sign(context: CanvasRenderingContext2D, box: Box, options: BannerOptions) {
  const { colors, height } = options;
  context.fillStyle = colors.blueprint;
  context.fillRect(box.x, box.y, box.w, box.h);
  grid(context, box, options.grid / 2, colors.line, GRID.card);
  context.strokeStyle = colors.line;
  context.lineWidth = Math.max(1, height / 600);
  context.strokeRect(box.x, box.y, box.w, box.h);
  const length = height * MARK.length;
  const gap = height * MARK.gap;
  context.strokeStyle = colors.accent;
  context.lineWidth = height * MARK.width;
  context.beginPath();
  context.moveTo(box.x - gap, box.y - gap + length);
  context.lineTo(box.x - gap, box.y - gap);
  context.lineTo(box.x - gap + length, box.y - gap);
  context.moveTo(box.x + box.w + gap - length, box.y + box.h + gap);
  context.lineTo(box.x + box.w + gap, box.y + box.h + gap);
  context.lineTo(box.x + box.w + gap, box.y + box.h + gap - length);
  context.stroke();
}

function text(context: CanvasRenderingContext2D, value: string, at: readonly [number, number], size: number, color: string, options: BannerOptions, spacing = "0em", glow = false) {
  if (!value) return;
  context.save();
  context.font = `700 ${size}px "${options.font}"`;
  context.letterSpacing = spacing;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.shadowColor = glow ? color : "transparent";
  context.shadowBlur = glow ? (size / 3) * options.glow : 0;
  context.fillText(value, ...at);
  context.restore();
}

// Dimension line with slanted ticks and the overline above it; a terracotta marker runs along it
function dimension(context: CanvasRenderingContext2D, from: number, to: number, y: number, label: string, marker: number, options: BannerOptions) {
  const { colors, fontSize, height } = options;
  const tick = fontSize * 0.6;
  context.save();
  context.strokeStyle = colors.line;
  context.lineWidth = Math.max(1, height / 700);
  context.beginPath();
  context.moveTo(from, y);
  context.lineTo(to, y);
  for (const end of [from, to]) {
    context.moveTo(end, y - tick);
    context.lineTo(end, y + tick);
    context.moveTo(end - tick / 2, y + tick / 2);
    context.lineTo(end + tick / 2, y - tick / 2);
  }
  context.stroke();
  context.fillStyle = colors.accent;
  context.beginPath();
  context.arc(from + (to - from) * marker, y, tick / 3, 0, TAU);
  context.fill();
  context.restore();
  text(context, label, [(from + to) / 2, y - tick * 1.4], fontSize * 0.7, colors.copper, options, SPACING);
}

// Gable of plan lines: roof triangle in terracotta with a light fill, king post, collar tie and struts in white
function gable(context: CanvasRenderingContext2D, x: number, base: number, span: number, rise: number, options: BannerOptions) {
  const { colors, height } = options;
  const top = base - rise;
  context.save();
  context.lineWidth = Math.max(1, height / 400);
  context.beginPath();
  context.moveTo(x - span / 2, base);
  context.lineTo(x, top);
  context.lineTo(x + span / 2, base);
  context.closePath();
  context.fillStyle = colors.accent;
  context.globalAlpha = 0.18;
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = colors.accent;
  context.stroke();
  context.strokeStyle = colors.line;
  context.globalAlpha = 0.7;
  context.beginPath();
  context.moveTo(x, top);
  context.lineTo(x, base);
  context.moveTo(x - span / 4, base - rise / 2);
  context.lineTo(x + span / 4, base - rise / 2);
  context.moveTo(x - span / 4, base);
  context.lineTo(x, base - rise / 2);
  context.lineTo(x + span / 4, base);
  context.stroke();
  context.restore();
}

function rain(context: CanvasRenderingContext2D, time: number, options: BannerOptions) {
  if (!options.rain) return;
  const { width, height, colors } = options;
  const length = height * RAIN.length;
  context.save();
  context.strokeStyle = colors.rainColor;
  context.globalAlpha = RAIN.opacity;
  context.lineWidth = Math.max(1, height / 900);
  context.beginPath();
  for (let index = 0; index < options.drops; index++) {
    const x = hash(options.seed * 7 + index) * width;
    const y = dropFall(index, time, options.loop, options.seed) * (height + length) - length;
    context.moveTo(x, y);
    context.lineTo(x - height * RAIN.slant, y + length);
  }
  context.stroke();
  context.restore();
}

// Profile banner: the sign over the width minus a margin, gable on the left, name and subtitle on the right
export function drawProfile(context: CanvasRenderingContext2D, time: number, options: BannerOptions, words: BannerText) {
  const { width, height, titleSize, fontSize, colors } = options;
  background(context, options);
  const margin = height * 0.16;
  const box = { x: margin, y: margin * 1.3, w: width - margin * 2, h: height - margin * 2.3 };
  dimension(context, box.x, box.x + box.w, margin * 0.75, words.overline, markerAt(time, options.loop), options);
  sign(context, box, options);
  const span = box.h * 1.1;
  gable(context, box.x + span * 0.75, box.y + box.h * 0.78, span, box.h * 0.5, options);
  const middle = box.x + span * 1.4 + (box.w - span * 1.4) / 2;
  text(context, words.title, [middle, box.y + box.h * 0.45], titleSize, colors.accent, options, "0.04em", true);
  text(context, words.subtitle, [middle, box.y + box.h * 0.72], fontSize, colors.line, options, SPACING);
}

// Offline banner: gable over the sign in the middle, rain behind the sign, the offline text on it
export function drawOffline(context: CanvasRenderingContext2D, time: number, options: BannerOptions, words: BannerText) {
  const { width, height, titleSize, fontSize, colors } = options;
  background(context, options);
  gable(context, width / 2, height * 0.5, width * 0.42, height * 0.3, options);
  rain(context, time, options);
  const box = { x: width * 0.24, y: height * 0.58, w: width * 0.52, h: height * 0.22 };
  dimension(context, box.x, box.x + box.w, box.y - fontSize * 1.4, words.overline, markerAt(time, options.loop), options);
  sign(context, box, options);
  text(context, words.title, [width / 2, box.y + box.h * 0.4], titleSize * 1.5, colors.accent, options, "0.04em", true);
  text(context, words.subtitle, [width / 2, box.y + box.h * 0.78], fontSize, colors.line, options, SPACING);
}
