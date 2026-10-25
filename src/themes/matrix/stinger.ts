// Stinger transition for OBS. Pure function of time: the same time (time) always gives the same picture,
// so it can be rendered exactly frame by frame (see scenes/Stinger.tsx and vite.config.ts).
// Sequence: matrix columns fall in and cover everything, the logo decodes itself,
// at the transition point (cut) the power-on line flashes, then the columns fall out at the bottom. The leading glyphs
// glow like the heads of the rain (PLAN-MATRIX.md package 4).
// Length, transition point, texts, colors, font and every time and size come from the settings via stingerOptions; the
// colors and the font follow the theme until set.
import { fontStack } from "./glyphFont.ts";
import { hash } from "../../core/hash.ts";
import { clamp01, easeIn } from "../../core/easing.ts";
import type { MatrixValues } from "./settings.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

// Times (s), shares, sizes and glows (px) of the rain, the logo window and the flash line
export type StingerLook = {
  headGlow: number; flicker: number; inGap: number; outDelay: number; outGap: number; gaps: number; headRows: number; accentRows: number;
  dimAlpha: number; dimAlphaRange: number;
  logo: {
    before: number; after: number; decode: number; fade: number; size: number; line: number; up: number; flicker: number; padding: number;
    open: number; grow: number; extra: number; boxUp: number; stroke: number; glow: number; glitch: number; shift: number;
    textSize: number; textDelay: number; typing: number; textGap: number;
  };
  flash: { before: number; length: number; widen: number; thin: number; grow: number; growAt: number; fadeAt: number; glow: number };
};

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
  look: StingerLook;
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
  font: values.stingerFont,
  background: values.stingerBackground,
  accent: values.stingerAccent,
  dim: values.stingerDim,
  flash: values.stingerFlash,
  look: {
    headGlow: values.stingerHeadGlow, flicker: values.stingerFlicker, inGap: values.stingerInGap, outDelay: values.stingerOutDelay, outGap: values.stingerOutGap,
    gaps: values.stingerGaps, headRows: values.stingerHeadRows, accentRows: values.stingerAccentRows, dimAlpha: values.stingerDimAlpha, dimAlphaRange: values.stingerDimAlphaRange,
    logo: {
      before: values.stingerLogoBefore, after: values.stingerLogoAfter, decode: values.stingerLogoDecode, fade: values.stingerLogoFade, size: values.stingerLogoSize,
      line: values.stingerLogoLine, up: values.stingerLogoUp, flicker: values.stingerLogoFlicker, padding: values.stingerLogoPadding, open: values.stingerLogoOpen,
      grow: values.stingerLogoGrow, extra: values.stingerLogoExtra, boxUp: values.stingerLogoBoxUp, stroke: values.stingerLogoStroke, glow: values.stingerLogoGlow,
      glitch: values.stingerLogoGlitch, shift: values.stingerLogoShift, textSize: values.stingerTextSize, textDelay: values.stingerTextDelay,
      typing: values.stingerTextTyping, textGap: values.stingerTextGap,
    },
    flash: {
      before: values.stingerFlashBefore, length: values.stingerFlashLength, widen: values.stingerFlashWiden, thin: values.stingerFlashThin,
      grow: values.stingerFlashGrow, growAt: values.stingerFlashGrowAt, fadeAt: values.stingerFlashFadeAt, glow: values.stingerFlashGlow,
    },
  },
});

// Character from the character set, always the same for the same seed
export function glyphAt(seed: number, glyphs: string) {
  const list = Array.from(glyphs);
  return list[(hash(seed) * list.length) | 0] ?? "";
}

// A share over a span that may be zero (a setting of 0 s): done at once
const over = (value: number, span: number) => (span > 0 ? clamp01(value / span) : Number(value >= 0));

export function drawStinger(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const { cut, duration, fall, column, look } = options;
  const columns = Math.ceil(WIDTH / column);
  const rows = Math.ceil(HEIGHT / column);
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.textBaseline = "top";
  context.font = `${column}px ${fontStack(options.font)}`;
  context.shadowColor = options.flash;
  const tick = Math.floor(time * look.flicker);

  for (let index = 0; index < columns; index++) {
    // Columns start staggered; at cut all have arrived at the bottom, afterwards they fall out
    const inStart = hash(index) * Math.max(0, cut - fall - look.inGap);
    const outStart = cut + look.outDelay + hash(index + 5000) * Math.max(0, duration - cut - fall - look.outGap);
    const bottom = easeIn(over(time - inStart, fall)) * HEIGHT;
    const top = easeIn(over(time - outStart, fall)) * HEIGHT;
    if (bottom <= top) continue;

    const x = index * column;
    context.fillStyle = options.background;
    context.fillRect(x, top, column, bottom - top);

    // The leading edge glows: at the bottom when falling in, at the top when falling out
    const edge = bottom < HEIGHT ? bottom : top;
    for (let row = 0; row < rows; row++) {
      const y = row * column;
      if (y + column <= top || y >= bottom) continue;
      if (hash(index * 977 + row * 131) < look.gaps) continue; // gaps like in real rain
      const distance = Math.abs(edge - y) / column; // distance to the edge in rows
      context.shadowBlur = distance < look.headRows ? look.headGlow : 0;
      if (distance < look.headRows) { context.fillStyle = options.flash; context.globalAlpha = 1; }
      else if (distance < look.accentRows) { context.fillStyle = options.accent; context.globalAlpha = 1; }
      else { context.fillStyle = options.dim; context.globalAlpha = look.dimAlpha + look.dimAlphaRange * hash(index * 31 + row + tick); }
      context.fillText(glyphAt(index * 7919 + row * 104729 + tick, options.glyphs), x + column / 6, y);
    }
    context.globalAlpha = 1;
  }
  context.shadowBlur = 0;

  if (options.showLogo) drawLogo(context, time, options);
  drawFlash(context, time, options);
}

function drawLogo(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const look = options.look.logo;
  const start = options.cut - look.before;
  const end = options.cut + look.after;
  if (time < start || time > end) return;
  const reveal = over(time - start, look.decode); // fraction of decoded characters
  const alpha = over(end - time, look.fade);

  const lines = options.logo.split("\n");
  context.font = `${look.size}px ${fontStack(options.font)}`;
  const charWidth = context.measureText("M").width;
  const lineHeight = look.size * look.line;
  const width = Math.max(...lines.map(line => line.length)) * charWidth;
  const left = (WIDTH - width) / 2;
  const topLine = HEIGHT / 2 - (lines.length * lineHeight) / 2 - look.up;
  const tick = Math.floor(time * look.flicker);

  // Window behind the logo: opens first as a line, then in height
  const boxWidth = (width + look.padding * 2) * over(time - start, look.open);
  const boxHeight = (lines.length * lineHeight + look.extra) * Math.max(0.02, over(time - start - look.open, look.grow));
  const boxTop = topLine - look.boxUp + (lines.length * lineHeight + look.extra - boxHeight) / 2;
  context.globalAlpha = alpha;
  context.fillStyle = options.background;
  context.fillRect((WIDTH - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  context.strokeStyle = options.accent;
  context.lineWidth = look.stroke;
  context.strokeRect((WIDTH - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  if (boxHeight < lines.length * lineHeight) { context.globalAlpha = 1; return; }

  context.shadowColor = options.accent;
  context.shadowBlur = look.glow;
  lines.forEach((line, row) => {
    // Glitch: single rows jump to the side briefly
    const shift = hash(tick * 13 + row) < look.glitch ? (hash(tick + row * 3) - 0.5) * look.shift : 0;
    Array.from(line).forEach((char, index) => {
      if (char === " ") return;
      const solved = hash(row * 100 + index) < reveal; // every character resolves at a different time
      context.fillStyle = solved ? options.accent : options.dim;
      context.fillText(solved ? char : glyphAt(row * 1000 + index + tick, options.glyphs), left + index * charWidth + shift, topLine + row * lineHeight);
    });
  });

  context.shadowBlur = 0;
  context.font = `${look.textSize}px ${fontStack(options.font)}`;
  context.fillStyle = options.dim;
  const typed = options.text.slice(0, Math.floor(over(time - start - look.textDelay, look.typing) * options.text.length));
  context.fillText(typed + (tick % 2 ? options.cursor : ""), left, topLine + lines.length * lineHeight + look.textGap);
  context.globalAlpha = 1;
}

// The power-on line from the portfolio exactly at the transition point
function drawFlash(context: CanvasRenderingContext2D, time: number, options: StingerOptions) {
  const look = options.look.flash;
  const progress = look.length > 0 ? (time - (options.cut - look.before)) / look.length : -1;
  if (progress < 0 || progress > 1) return;
  const lineWidth = WIDTH * over(progress, look.widen);
  const lineHeight = look.thin + look.grow * over(progress - look.growAt, 1 - look.growAt);
  context.globalAlpha = 1 - over(progress - look.fadeAt, 1 - look.fadeAt);
  context.shadowColor = options.accent;
  context.shadowBlur = look.glow;
  context.fillStyle = options.flash;
  context.fillRect((WIDTH - lineWidth) / 2, HEIGHT / 2 - lineHeight / 2, lineWidth, lineHeight);
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}
