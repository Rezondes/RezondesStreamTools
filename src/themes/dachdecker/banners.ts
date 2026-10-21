// Banners of the Dachdecker theme (DESIGN-DACHDECKER.md "Banner") in 2D, built like the alert sign of the overlays
// (scenes/Alerts.tsx, overlays.css): a dimension line with its text above a blueprint sheet with millimetre grid, white
// edge and terracotta corner marks; inside the spaced head line in copper, the name in terracotta with a glow, the line
// in white and the timer bar. All sizes are those of the alert, scaled from its width to the width of the sign. The
// offline banner adds rain behind the sign. Every moving part is a whole number of laps per loop, so the last frame meets
// the first. Check: banners.check.ts.
import { hash } from "../../core/hash.ts";

export type BannerColors = { blueprint: string; page: string; accent: string; copper: string; line: string; rainColor: string };
// dim: text over the dimension line, tag: head line, title: the name, line: the line under it
export type BannerText = { dim: string; tag: string; title: string; line: string };
export type BannerOptions = {
  width: number; height: number; loop: number; font: string; fontSize: number; alertWidth: number; grid: number; glow: number;
  rain: boolean; drops: number; seed: number; colors: BannerColors;
};
type Box = { x: number; y: number; w: number; h: number };

// Sizes of the alert sign in px at the alert width (the var() defaults of overlays.css and theme.css)
const SIGN = {
  pad: 18, padX: 26, gap: 10, nameGap: 6, head: 20, headTrack: 6, nameScale: 1.9, nameTrack: 4, nameGlow: 10,
  dimText: 16, dimTrack: 3, dimGap: 2, dimHeight: 24, slash: 7, fine: 10, corner: 18, cornerLine: 3, cornerOut: 8, timer: 3,
};
// Share of the banner width the sign takes, the grid strength of sheet and page, the line weights
const SIGN_WIDTH = { profile: 0.78, offline: 0.5 };
const GRID = { major: 0.1, fine: 0.04, page: 0.04 };
const SHEET_OPACITY = 0.9;
// Rain: falls per loop between 2 and 4, streak length and slant as shares of the height
const RAIN = { laps: [2, 3, 4], length: 0.035, slant: 0.006, opacity: 0.55 };
const TAU = Math.PI * 2;

// Fallen share of drop index at time (0 at the top, 1 at the bottom): a whole number of falls per loop, so time 0 and
// time loop are the same
export function dropFall(index: number, time: number, loop: number, seed: number): number {
  const laps = RAIN.laps[Math.floor(hash(seed * 31 + index) * RAIN.laps.length)];
  return (hash(seed * 17 + index) + (laps * time) / loop) % 1;
}

// Length of the timer bar (0 to 1): it pulls back like the alert timer and runs out again, once per loop
export const timerAt = (time: number, loop: number) => (1 + Math.cos((time / loop) * TAU)) / 2;

function grid(context: CanvasRenderingContext2D, box: Box, step: number, color: string, alpha: number) {
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = alpha;
  context.lineWidth = 1;
  context.beginPath();
  for (let at = box.x; at <= box.x + box.w; at += step) {
    context.moveTo(at, box.y);
    context.lineTo(at, box.y + box.h);
  }
  for (let at = box.y; at <= box.y + box.h; at += step) {
    context.moveTo(box.x, at);
    context.lineTo(box.x + box.w, at);
  }
  context.stroke();
  context.restore();
}

function text(context: CanvasRenderingContext2D, value: string, at: readonly [number, number], look: { size: number; weight: number; track: number; color: string; glow?: number }, font: string) {
  context.save();
  context.font = `${look.weight} ${look.size}px "${font}"`;
  context.letterSpacing = `${look.track}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = look.color;
  context.shadowColor = look.glow ? look.color : "transparent";
  context.shadowBlur = look.glow ?? 0;
  context.fillText(value, ...at);
  context.restore();
}

// Dimension line with end strokes and slashes, the text in copper above it; y is the line
function dimension(context: CanvasRenderingContext2D, box: Box, y: number, label: string, scale: number, options: BannerOptions) {
  const half = (SIGN.dimHeight / 2) * scale;
  const slash = SIGN.slash * scale;
  context.save();
  context.strokeStyle = options.colors.line;
  context.lineWidth = Math.max(1, 1.5 * scale);
  context.beginPath();
  context.moveTo(box.x, y);
  context.lineTo(box.x + box.w, y);
  for (const end of [box.x, box.x + box.w]) {
    context.moveTo(end, y - half);
    context.lineTo(end, y + half);
    context.moveTo(end - slash, y + slash);
    context.lineTo(end + slash, y - slash);
  }
  context.stroke();
  context.restore();
  if (label) text(context, label, [box.x + box.w / 2, y - half - (SIGN.dimGap + SIGN.dimText / 2) * scale], { size: SIGN.dimText * scale, weight: 700, track: SIGN.dimTrack * scale, color: options.colors.copper }, options.font);
}

// The sheet: blueprint with millimetre grid, white edge, terracotta corner marks top left and bottom right
function sheet(context: CanvasRenderingContext2D, box: Box, scale: number, options: BannerOptions) {
  const { colors } = options;
  context.save();
  context.globalAlpha = SHEET_OPACITY;
  context.fillStyle = colors.blueprint;
  context.fillRect(box.x, box.y, box.w, box.h);
  context.restore();
  grid(context, box, SIGN.fine * scale, colors.line, GRID.fine);
  grid(context, box, options.grid * scale, colors.line, GRID.major);
  context.strokeStyle = colors.line;
  context.lineWidth = Math.max(1, scale);
  context.strokeRect(box.x, box.y, box.w, box.h);
  const out = SIGN.cornerOut * scale;
  const corner = SIGN.corner * scale;
  context.strokeStyle = colors.accent;
  context.lineWidth = SIGN.cornerLine * scale;
  context.beginPath();
  context.moveTo(box.x - out, box.y - out + corner);
  context.lineTo(box.x - out, box.y - out);
  context.lineTo(box.x - out + corner, box.y - out);
  context.moveTo(box.x + box.w + out - corner, box.y + box.h + out);
  context.lineTo(box.x + box.w + out, box.y + box.h + out);
  context.lineTo(box.x + box.w + out, box.y + box.h + out - corner);
  context.stroke();
}

function rain(context: CanvasRenderingContext2D, time: number, options: BannerOptions) {
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

// The alert sign scaled to share of the banner width, centred: dimension line, sheet, head line, name, line, timer bar
function banner(context: CanvasRenderingContext2D, time: number, options: BannerOptions, words: BannerText, share: number, wet: boolean) {
  const { width, height, colors, fontSize, font } = options;
  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.page;
  context.fillRect(0, 0, width, height);
  grid(context, { x: 0, y: 0, w: width, h: height }, options.grid, colors.line, GRID.page);
  if (wet) rain(context, time, options);

  const signWidth = width * share;
  const scale = signWidth / options.alertWidth;
  const sizes = { head: SIGN.head * scale, name: fontSize * SIGN.nameScale * scale, line: fontSize * scale, timer: SIGN.timer * scale };
  const rows = [words.tag ? sizes.head : 0, sizes.name + 2 * SIGN.nameGap * scale, words.line ? sizes.line : 0];
  const inner = rows.reduce((sum, row) => sum + row, 0) + SIGN.gap * scale + sizes.timer;
  const dimBlock = (SIGN.dimHeight + SIGN.dimGap + SIGN.dimText) * scale + SIGN.gap * scale;
  const signHeight = inner + 2 * SIGN.pad * scale;
  const top = (height - dimBlock - signHeight) / 2 + dimBlock;
  const box = { x: (width - signWidth) / 2, y: top, w: signWidth, h: signHeight };
  dimension(context, box, top - SIGN.gap * scale - (SIGN.dimHeight / 2) * scale, words.dim, scale, options);
  sheet(context, box, scale, options);

  const middle = width / 2;
  let y = top + SIGN.pad * scale;
  if (words.tag) {
    text(context, words.tag, [middle, y + sizes.head / 2], { size: sizes.head, weight: 700, track: SIGN.headTrack * scale, color: colors.copper }, font);
    y += sizes.head;
  }
  y += SIGN.nameGap * scale;
  text(context, words.title, [middle, y + sizes.name / 2], { size: sizes.name, weight: 700, track: SIGN.nameTrack * scale, color: colors.accent, glow: SIGN.nameGlow * scale * options.glow }, font);
  y += sizes.name + SIGN.nameGap * scale;
  if (words.line) {
    text(context, words.line, [middle, y + sizes.line / 2], { size: sizes.line, weight: 500, track: 0, color: colors.line }, font);
    y += sizes.line;
  }
  y += SIGN.gap * scale;
  const barWidth = box.w - 2 * SIGN.padX * scale;
  context.fillStyle = colors.accent;
  context.fillRect(box.x + SIGN.padX * scale, y, barWidth * timerAt(time, options.loop), sizes.timer);
}

export const drawProfile = (context: CanvasRenderingContext2D, time: number, options: BannerOptions, words: BannerText) =>
  banner(context, time, options, words, SIGN_WIDTH.profile, false);

export const drawOffline = (context: CanvasRenderingContext2D, time: number, options: BannerOptions, words: BannerText) =>
  banner(context, time, options, words, SIGN_WIDTH.offline, options.rain);
