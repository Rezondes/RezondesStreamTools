// Stinger transition for OBS. Pure function of time: the same time (time) always gives the same picture,
// so it can be rendered exactly frame by frame (see scenes/Stinger.tsx and vite.config.ts).
// Sequence: matrix columns fall in and cover everything, the logo decodes itself,
// at the transition point (cut) the power-on line flashes, then the columns fall out at the bottom. The leading glyphs
// glow like the heads of the rain (PLAN-MATRIX.md package 4).
// Length, transition point, texts, colors and font come from the settings via stingerOptions.
import { hash } from "../../core/hash.ts";
import { clamp01, easeIn } from "../../core/easing.ts";
import type { MatrixValues } from "./settings.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;
const HEAD_GLOW = 18; // fixed: glow of the leading glyphs (px)

export type StingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as "Transition Point"
  fall: number; // seconds a column needs to fall in or out
  column: number; // Spaltenbreite in px
  text: string;
  cursor: string;
  showLogo: boolean;
  logo: string;
  glyphs: string;
  font: string;
  background: string;
  accent: string;
  dim: string;
  flash: string;
};

export const stingerOptions = (values: MatrixValues): StingerOptions => ({
  duration: values.stingerDuration,
  cut: values.stingerCut,
  fall: values.stingerFall,
  column: values.stingerColumn,
  text: values.stingerText,
  cursor: values.cursor,
  showLogo: values.stingerLogo,
  logo: values.logo,
  glyphs: values.glyphs,
  font: values.font,
  background: values.background,
  accent: values.accent,
  dim: values.dim,
  flash: values.flash,
});

// Character from the character set, always the same for the same seed
export function glyphAt(seed: number, glyphs: string) {
  const list = Array.from(glyphs);
  return list[(hash(seed) * list.length) | 0] ?? "";
}

export function drawStinger(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const { cut, duration, fall, column } = options;
  const columns = Math.ceil(WIDTH / column);
  const rows = Math.ceil(HEIGHT / column);
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.textBaseline = "top";
  context.font = `${column}px "${options.font}", monospace`;
  context.shadowColor = options.flash;
  const tick = Math.floor(time * 18); // characters flicker 18 times per second

  for (let index = 0; index < columns; index++) {
    // Columns start staggered; at cut all have arrived at the bottom, afterwards they fall out
    const inStart = hash(index) * Math.max(0, cut - fall - 0.02);
    const outStart = cut + 0.08 + hash(index + 5000) * Math.max(0, duration - cut - fall - 0.1);
    const bottom = easeIn(clamp01((time - inStart) / fall)) * HEIGHT;
    const top = easeIn(clamp01((time - outStart) / fall)) * HEIGHT;
    if (bottom <= top) continue;

    const x = index * column;
    context.fillStyle = options.background;
    context.fillRect(x, top, column, bottom - top);

    // The leading edge glows: at the bottom when falling in, at the top when falling out
    const edge = bottom < HEIGHT ? bottom : top;
    for (let row = 0; row < rows; row++) {
      const y = row * column;
      if (y + column <= top || y >= bottom) continue;
      if (hash(index * 977 + row * 131) < 0.35) continue; // gaps like in real rain
      const distance = Math.abs(edge - y) / column; // distance to the edge in rows
      context.shadowBlur = distance < 1.5 ? HEAD_GLOW : 0;
      if (distance < 1.5) { context.fillStyle = options.flash; context.globalAlpha = 1; }
      else if (distance < 5) { context.fillStyle = options.accent; context.globalAlpha = 1; }
      else { context.fillStyle = options.dim; context.globalAlpha = 0.35 + 0.5 * hash(index * 31 + row + tick); }
      context.fillText(glyphAt(index * 7919 + row * 104729 + tick, options.glyphs), x + column / 6, y);
    }
    context.globalAlpha = 1;
  }
  context.shadowBlur = 0;

  if (options.showLogo) drawLogo(context, time, options);
  drawFlash(context, time, options);
}

function drawLogo(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const start = options.cut - 0.3;
  const end = options.cut + 0.45;
  if (time < start || time > end) return;
  const reveal = clamp01((time - start) / 0.28); // fraction of decoded characters
  const alpha = clamp01((end - time) / 0.15);

  const lines = options.logo.split("\n");
  const size = 44;
  context.font = `${size}px "${options.font}", monospace`;
  const charWidth = context.measureText("M").width;
  const lineHeight = size * 1.05;
  const width = Math.max(...lines.map(line => line.length)) * charWidth;
  const left = (WIDTH - width) / 2;
  const topLine = HEIGHT / 2 - (lines.length * lineHeight) / 2 - 20;
  const tick = Math.floor(time * 30);

  // Window behind the logo: opens first as a line, then in height
  const padding = 56;
  const boxWidth = (width + padding * 2) * clamp01((time - start) / 0.08);
  const boxHeight = (lines.length * lineHeight + 110) * Math.max(0.02, clamp01((time - start - 0.08) / 0.1));
  const boxTop = topLine - 40 + (lines.length * lineHeight + 110 - boxHeight) / 2;
  context.globalAlpha = alpha;
  context.fillStyle = options.background;
  context.fillRect((WIDTH - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  context.strokeStyle = options.accent;
  context.lineWidth = 2;
  context.strokeRect((WIDTH - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  if (boxHeight < lines.length * lineHeight) { context.globalAlpha = 1; return; }

  context.shadowColor = options.accent;
  context.shadowBlur = 24;
  lines.forEach((line, row) => {
    // Glitch: single rows jump to the side briefly
    const shift = hash(tick * 13 + row) < 0.12 ? (hash(tick + row * 3) - 0.5) * 40 : 0;
    Array.from(line).forEach((char, index) => {
      if (char === " ") return;
      const solved = hash(row * 100 + index) < reveal; // every character resolves at a different time
      context.fillStyle = solved ? options.accent : options.dim;
      context.fillText(solved ? char : glyphAt(row * 1000 + index + tick, options.glyphs), left + index * charWidth + shift, topLine + row * lineHeight);
    });
  });

  context.shadowBlur = 0;
  context.font = `28px "${options.font}", monospace`;
  context.fillStyle = options.dim;
  const typed = options.text.slice(0, Math.floor(clamp01((time - start - 0.15) / 0.25) * options.text.length));
  context.fillText(typed + (tick % 2 ? options.cursor : ""), left, topLine + lines.length * lineHeight + 24);
  context.globalAlpha = 1;
}

// The power-on line from the portfolio exactly at the transition point
function drawFlash(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const progress = (time - (options.cut - 0.06)) / 0.2;
  if (progress < 0 || progress > 1) return;
  const lineWidth = WIDTH * clamp01(progress / 0.4);
  const lineHeight = 4 + 60 * clamp01((progress - 0.3) / 0.7);
  context.globalAlpha = 1 - clamp01((progress - 0.4) / 0.6);
  context.shadowColor = options.accent;
  context.shadowBlur = 40;
  context.fillStyle = options.flash;
  context.fillRect((WIDTH - lineWidth) / 2, HEIGHT / 2 - lineHeight / 2, lineWidth, lineHeight);
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}
