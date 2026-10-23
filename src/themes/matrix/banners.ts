// Twitch banners as still pictures (the dashboard saves a PNG): profile banner (1200x480) and offline banner of the video
// player (1920x1080). Texts, colors, font and rain density come from the settings via bannerOptions. The rain is the
// rain of the scenes (rain.ts, PLAN-MATRIX.md package 4) in its depth layers at one moment, the far layer blurred, the
// heads glowing; the cursors stand lit.
import { fontStack } from "./glyphFont.ts";
import { fillTemplate } from "../../core/template.ts";
import type { MatrixValues } from "./settings.ts";
import { glyphAt as rainGlyph, headAt, LAYERS, rainColumns } from "./rain.ts";

export type BannerOptions = {
  density: number; // fraction of columns with rain, 0..1
  scanlines: number; // opacity of the scanlines, 0 = off
  font: string;
  logo: string;
  glyphs: string;
  cursor: string;
  background: string;
  accent: string;
  dim: string;
  line: string;
  flash: string;
  profileText: string;
  profileSub: string;
  offlineHeader: string;
  offlineStatus: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
  prompt: string;
  seed: number;
  layers: number;
  sizes: readonly [number, number, number]; // far, mid, near (px)
  blurFar: number; // px
  headGlow: number; // px
  change: { tip: number; trail: number }; // glyph changes per second
};

// login: Twitch login for {login} in prompt and header
export function bannerOptions(values: MatrixValues, login: string): BannerOptions {
  const names = { channel: values.channelName, login };
  return {
    density: values.bannerRainDensity / 100,
    scanlines: values.scanlines ? values.scanlineStrength : 0,
    font: values.font,
    logo: values.logo,
    glyphs: values.glyphs,
    cursor: values.cursor,
    background: values.background,
    accent: values.accent,
    dim: values.dim,
    line: values.line,
    flash: values.flash,
    profileText: values.bannerProfileText,
    profileSub: values.bannerProfileSub,
    offlineHeader: fillTemplate(values.sceneHeader, { ...names, scene: "offline" }),
    offlineStatus: values.bannerOfflineStatus,
    offlineTitle: values.bannerOfflineTitle,
    offlineText: values.bannerOfflineText,
    offlineLines: values.bannerOfflineLines,
    prompt: fillTemplate(values.prompt, names),
    seed: values.rainSeed,
    layers: values.rainLayers,
    sizes: [values.rainSizeFar, values.rainSizeMid, values.rainSizeNear],
    blurFar: values.rainBlurFar,
    headGlow: values.headGlow,
    change: { tip: values.glyphChangeTip, trail: values.glyphChange },
  };
}

// fixed: the profile banner is smaller, so is its rain
const PROFILE_SCALE = 0.6;

// fixed: the moment of the rain a banner shows (s, every layer under way), how the trails fade
const RAIN_STILL = 6;
const FADE = 1.6;

// The rain of the scenes at one moment over width x height, its glyphs sized by scale
function rain(context: CanvasRenderingContext2D, width: number, height: number, scale: number, alpha: number, options: BannerOptions) {
  if (options.density <= 0) return;
  const first = LAYERS.length - Math.max(1, Math.min(LAYERS.length, options.layers));
  for (let layer = first; layer < LAYERS.length; layer++) {
    const blur = layer === 0 && options.blurFar > 0 ? options.blurFar : 0;
    const scratch = blur > 0 && typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (!scratch) {
      context.filter = blur > 0 ? `blur(${blur}px)` : "none";
      rainLayer(context, layer, width, height, scale, alpha, options);
      continue;
    }
    // The far layer is drawn sharp and then blurred once as a whole: a filter on every single glyph costs one blur
    // pass each (thousands per banner) and froze the whole browser in Opera GX
    [scratch.canvas.width, scratch.canvas.height] = [width, height];
    rainLayer(scratch, layer, width, height, scale, alpha, options);
    context.filter = `blur(${blur}px)`;
    context.drawImage(scratch.canvas, 0, 0);
    context.filter = "none";
  }
  Object.assign(context, { globalAlpha: 1, shadowBlur: 0, filter: "none", textAlign: "start" });
}

// One depth layer of the rain, without its blur
function rainLayer(context: CanvasRenderingContext2D, layer: number, width: number, height: number, scale: number, alpha: number, options: BannerOptions) {
  const glyphs = Array.from(options.glyphs);
  const tints = [options.dim, options.accent, options.accent];
  const size = Math.max(1, Math.round(options.sizes[layer] * scale));
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.shadowColor = options.accent;
  context.font = `${size}px ${fontStack(options.font)}`;
  for (const column of rainColumns(layer, size, { seed: options.seed, width, density: options.density })) {
    const at = headAt(column, size, height, RAIN_STILL);
    if (!at) continue;
    for (let behind = 0; behind < column.trail; behind++) {
      const row = at.row - behind;
      const y = row * size + size / 2;
      if (y < -size || y > height + size) continue;
      context.globalAlpha = alpha * LAYERS[layer].alpha * (1 - behind / column.trail) ** FADE;
      context.fillStyle = behind === 0 ? options.flash : tints[layer];
      context.shadowBlur = behind === 0 ? options.headGlow : 0;
      context.fillText(glyphs[rainGlyph(options.seed + at.run, column, row, behind, RAIN_STILL, glyphs.length, options.change)] ?? "", column.x, y);
    }
  }
  Object.assign(context, { globalAlpha: 1, shadowBlur: 0 });
}

function scanlines(context: CanvasRenderingContext2D, width: number, height: number, options: BannerOptions) {
  if (!options.scanlines) return;
  context.globalAlpha = options.scanlines;
  context.fillStyle = options.background;
  for (let y = 0; y < height; y += 3) context.fillRect(0, y, width, 1);
  context.globalAlpha = 1;
}

function text(context: CanvasRenderingContext2D, options: BannerOptions, content: string, x: number, y: number, size: number, color: string, glow = 0) {
  context.font = `${size}px ${fontStack(options.font)}`;
  context.textBaseline = "top";
  context.fillStyle = color;
  context.shadowColor = options.accent;
  context.shadowBlur = glow;
  context.fillText(content, x, y);
  context.shadowBlur = 0;
}

// ASCII logo
function logo(context: CanvasRenderingContext2D, centerX: number, y: number, size: number, options: BannerOptions) {
  const lines = options.logo.split("\n");
  context.font = `${size}px ${fontStack(options.font)}`;
  const charWidth = context.measureText("M").width;
  const left = centerX - (Math.max(...lines.map(line => line.length)) * charWidth) / 2;
  lines.forEach((line, row) => text(context, options, line, left, y + row * size * 1.05, size, options.accent, size * 0.5));
  return { left, bottom: y + lines.length * size * 1.05 };
}

// Frame with bright corners like the webcam frame
function frame(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, corner: number, options: BannerOptions) {
  context.globalAlpha = 0.82;
  context.fillStyle = options.background;
  context.fillRect(x, y, width, height);
  context.globalAlpha = 1;
  context.strokeStyle = options.dim;
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  context.strokeStyle = options.accent;
  context.lineWidth = 5;
  context.shadowColor = options.accent;
  context.shadowBlur = 12;
  for (const [cornerX, cornerY, directionX, directionY] of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    context.beginPath();
    context.moveTo(cornerX, cornerY + directionY * corner);
    context.lineTo(cornerX, cornerY);
    context.lineTo(cornerX + directionX * corner, cornerY);
    context.stroke();
  }
  context.shadowBlur = 0;
}

// Profile banner 1200x480. At the bottom left Twitch puts profile picture and name over it depending on the view,
// so everything important sits in the center and at the top.
export function drawProfileBanner(context: CanvasRenderingContext2D, options: BannerOptions) {
  const width = 1200, height = 480;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, width, height, PROFILE_SCALE, 0.55, options);
  frame(context, 170, 70, 860, 300, 28, options);
  const placed = logo(context, width / 2, 110, 26, options);
  text(context, options, options.profileText + options.cursor, placed.left, placed.bottom + 30, 26, options.accent, 8);
  text(context, options, options.profileSub, placed.left, placed.bottom + 72, 20, options.dim);
  scanlines(context, width, height, options);
}

// Offline banner 1920x1080, in the style of the starting/ending scenes
export function drawOfflineBanner(context: CanvasRenderingContext2D, options: BannerOptions) {
  const width = 1920, height = 1080;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, width, height, 1, 0.4, options);

  const boxX = 260, boxY = 150, boxWidth = 1400, boxHeight = 780;
  frame(context, boxX, boxY, boxWidth, boxHeight, 40, options);
  text(context, options, options.offlineHeader, boxX + 48, boxY + 26, 24, options.dim);
  text(context, options, options.offlineStatus, boxX + boxWidth - 200, boxY + 26, 24, options.accent, 6);
  context.fillStyle = options.line;
  context.fillRect(boxX + 48, boxY + 70, boxWidth - 96, 2);

  const placed = logo(context, width / 2, boxY + 120, 32, options);
  // Title
  context.font = `110px ${fontStack(options.font)}`;
  const titleX = width / 2 - context.measureText(options.offlineTitle).width / 2;
  const titleY = placed.bottom + 50;
  text(context, options, options.offlineTitle, titleX, titleY, 110, options.accent, 30);

  context.font = `30px ${fontStack(options.font)}`;
  text(context, options, options.offlineText, width / 2 - context.measureText(options.offlineText).width / 2, titleY + 150, 30, options.dim);

  // Terminal at the bottom, the last line with cursor
  const lines = options.offlineLines;
  context.fillStyle = options.line;
  context.fillRect(boxX + 48, boxY + boxHeight - 180, boxWidth - 96, 2);
  lines.forEach((line, index) => text(context, options, `${options.prompt} ${line}`, boxX + 48, boxY + boxHeight - 160 + index * 40, 26, index === lines.length - 1 ? options.accent : options.dim));
  context.font = `26px ${fontStack(options.font)}`;
  const lastWidth = context.measureText(`${options.prompt} ${lines.at(-1) ?? ""} `).width;
  if (lines.length) text(context, options, options.cursor, boxX + 48 + lastWidth, boxY + boxHeight - 160 + (lines.length - 1) * 40, 26, options.accent);

  scanlines(context, width, height, options);
}
