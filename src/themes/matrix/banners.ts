// Twitch banners as still pictures (the dashboard saves a PNG): profile banner (1200x480) and offline banner of the video
// player (1920x1080). Texts, colors, font, rain and every position and size come from the settings via bannerOptions,
// each banner with its own colors and font that follow the theme until set. The rain is the rain of the scenes (rain.ts,
// PLAN-MATRIX.md package 4) in its depth layers at one moment, the far layer blurred, the heads glowing; the cursors
// stand lit.
import { fontStack } from "./glyphFont.ts";
import { fillTemplate } from "../../core/template.ts";
import type { MatrixValues } from "./settings.ts";
import { type GlyphChange, glyphAt as rainGlyph, headAt, LAYER_COUNT, rainColumns, type RainLook, rainLookOf } from "./rain.ts";

type Box = { x: number; y: number; width: number; height: number; corner: number };

export type BannerOptions = {
  density: number; // fraction of columns with rain, 0..1
  scanlines: number; // opacity of the scanlines, 0 = off
  pitch: number; // px from scanline to scanline
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
  change: GlyphChange; // glyph changes per second
  look: RainLook;
  still: number; // the moment of the rain (s)
  fade: number; // how the trails fade
  rainAlpha: number;
  rainScale: number; // glyph size of the rain as a share of the scenes
  frame: { alpha: number; border: number; cornerStroke: number; cornerGlow: number };
  logoLine: number; // line height of the logo as a share of its size
  logoGlow: number; // glow of the logo as a share of its size
  profile: { box: Box; logoY: number; logoSize: number; textGap: number; textSize: number; textGlow: number; subGap: number; subSize: number };
  offline: {
    box: Box; inset: number; headerY: number; headerSize: number; statusRight: number; statusGlow: number; ruleY: number; rule: number;
    logoY: number; logoSize: number; titleGap: number; titleSize: number; titleGlow: number; textGap: number; textSize: number;
    termUp: number; linesUp: number; lineStep: number; lineSize: number;
  };
};

// The colors, font and look of each banner
const profileOwn = (values: MatrixValues) => ({
  background: values.bannerProfileBackground, accent: values.bannerProfileAccent, dim: values.bannerProfileDim, line: values.bannerProfileLine,
  flash: values.bannerProfileFlash, font: values.bannerProfileFont, rainAlpha: values.bannerProfileRainAlpha, logoLine: values.bannerProfileLogoLine,
  logoGlow: values.bannerProfileLogoGlow,
  frame: { alpha: values.bannerProfileFrameAlpha, border: values.bannerProfileFrameBorder, cornerStroke: values.bannerProfileCornerStroke, cornerGlow: values.bannerProfileCornerGlow },
});
const offlineOwn = (values: MatrixValues) => ({
  background: values.bannerOfflineBackground, accent: values.bannerOfflineAccent, dim: values.bannerOfflineDim, line: values.bannerOfflineLine,
  flash: values.bannerOfflineFlash, font: values.bannerOfflineFont, rainAlpha: values.bannerOfflineRainAlpha, logoLine: values.bannerOfflineLogoLine,
  logoGlow: values.bannerOfflineLogoGlow,
  frame: { alpha: values.bannerOfflineFrameAlpha, border: values.bannerOfflineFrameBorder, cornerStroke: values.bannerOfflineCornerStroke, cornerGlow: values.bannerOfflineCornerGlow },
});

// login: Twitch login for {login} in prompt and header; banner: whose colors, font and rain density
export function bannerOptions(values: MatrixValues, login: string, banner: "profile" | "offline" = "profile"): BannerOptions {
  const names = { channel: values.channelName, login };
  const profileBox: Box = { x: values.bannerProfileFrameX, y: values.bannerProfileFrameY, width: values.bannerProfileFrameWidth, height: values.bannerProfileFrameHeight, corner: values.bannerProfileCorner };
  const offlineBox: Box = { x: values.bannerOfflineFrameX, y: values.bannerOfflineFrameY, width: values.bannerOfflineFrameWidth, height: values.bannerOfflineFrameHeight, corner: values.bannerOfflineCorner };
  return {
    ...(banner === "profile" ? profileOwn(values) : offlineOwn(values)),
    density: (banner === "profile" ? values.bannerRainDensity : values.bannerOfflineRainDensity) / 100,
    scanlines: values.scanlines ? values.scanlineStrength : 0,
    pitch: values.bannerScanlinePitch,
    logo: values.logo,
    glyphs: values.glyphs,
    cursor: values.cursor,
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
    change: { tip: values.glyphChangeTip, trail: values.glyphChange, tipCells: values.rainTip },
    look: rainLookOf(values),
    still: values.bannerRainStill,
    fade: values.bannerRainFade,
    rainScale: banner === "profile" ? values.bannerProfileRainScale : 1,
    profile: {
      box: profileBox, logoY: values.bannerProfileLogoY, logoSize: values.bannerProfileLogoSize, textGap: values.bannerProfileTextGap,
      textSize: values.bannerProfileTextSize, textGlow: values.bannerProfileTextGlow, subGap: values.bannerProfileSubGap, subSize: values.bannerProfileSubSize,
    },
    offline: {
      box: offlineBox, inset: values.bannerOfflineInset, headerY: values.bannerOfflineHeaderY, headerSize: values.bannerOfflineHeaderSize,
      statusRight: values.bannerOfflineStatusRight, statusGlow: values.bannerOfflineStatusGlow, ruleY: values.bannerOfflineRuleY, rule: values.bannerOfflineRule,
      logoY: values.bannerOfflineLogoY, logoSize: values.bannerOfflineLogoSize, titleGap: values.bannerOfflineTitleGap, titleSize: values.bannerOfflineTitleSize,
      titleGlow: values.bannerOfflineTitleGlow, textGap: values.bannerOfflineTextGap, textSize: values.bannerOfflineTextSize, termUp: values.bannerOfflineTermUp,
      linesUp: values.bannerOfflineLinesUp, lineStep: values.bannerOfflineLineStep, lineSize: values.bannerOfflineLineSize,
    },
  };
}

// The rain of the scenes at one moment over width x height, its glyphs sized by scale
function rain(context: CanvasRenderingContext2D, width: number, height: number, options: BannerOptions) {
  if (options.density <= 0) return;
  const first = LAYER_COUNT - Math.max(1, Math.min(LAYER_COUNT, options.layers));
  for (let layer = first; layer < LAYER_COUNT; layer++) {
    const blur = layer === 0 && options.blurFar > 0 ? options.blurFar : 0;
    const scratch = blur > 0 && typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (!scratch) {
      context.filter = blur > 0 ? `blur(${blur}px)` : "none";
      rainLayer(context, layer, width, height, options);
      continue;
    }
    // The far layer is drawn sharp and then blurred once as a whole: a filter on every single glyph costs one blur
    // pass each (thousands per banner) and froze the whole browser in Opera GX
    [scratch.canvas.width, scratch.canvas.height] = [width, height];
    rainLayer(scratch, layer, width, height, options);
    context.filter = `blur(${blur}px)`;
    context.drawImage(scratch.canvas, 0, 0);
    context.filter = "none";
  }
  Object.assign(context, { globalAlpha: 1, shadowBlur: 0, filter: "none", textAlign: "start" });
}

// One depth layer of the rain, without its blur
function rainLayer(context: CanvasRenderingContext2D, layer: number, width: number, height: number, options: BannerOptions) {
  const glyphs = Array.from(options.glyphs);
  const tints = [options.dim, options.accent, options.accent];
  const size = Math.max(1, Math.round(options.sizes[layer] * options.rainScale));
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.shadowColor = options.accent;
  context.font = `${size}px ${fontStack(options.font)}`;
  for (const column of rainColumns(layer, size, { seed: options.seed, width, density: options.density, look: options.look })) {
    const at = headAt(column, size, height, options.still);
    if (!at) continue;
    for (let behind = 0; behind < column.trail; behind++) {
      const row = at.row - behind;
      const y = row * size + size / 2;
      if (y < -size || y > height + size) continue;
      context.globalAlpha = options.rainAlpha * options.look.layers[layer].alpha * (1 - behind / column.trail) ** options.fade;
      context.fillStyle = behind === 0 ? options.flash : tints[layer];
      context.shadowBlur = behind === 0 ? options.headGlow : 0;
      context.fillText(glyphs[rainGlyph(options.seed + at.run, column, row, behind, options.still, glyphs.length, options.change)] ?? "", column.x, y);
    }
  }
  Object.assign(context, { globalAlpha: 1, shadowBlur: 0 });
}

function scanlines(context: CanvasRenderingContext2D, width: number, height: number, options: BannerOptions) {
  if (!options.scanlines) return;
  context.globalAlpha = options.scanlines;
  context.fillStyle = options.background;
  for (let y = 0; y < height; y += Math.max(1, options.pitch)) context.fillRect(0, y, width, 1);
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
  lines.forEach((line, row) => text(context, options, line, left, y + row * size * options.logoLine, size, options.accent, size * options.logoGlow));
  return { left, bottom: y + lines.length * size * options.logoLine };
}

// Frame with bright corners like the webcam frame
function frame(context: CanvasRenderingContext2D, place: Box, options: BannerOptions) {
  const { x, y, width, height, corner } = place;
  context.globalAlpha = options.frame.alpha;
  context.fillStyle = options.background;
  context.fillRect(x, y, width, height);
  context.globalAlpha = 1;
  context.strokeStyle = options.dim;
  context.lineWidth = options.frame.border;
  context.strokeRect(x, y, width, height);
  context.strokeStyle = options.accent;
  context.lineWidth = options.frame.cornerStroke;
  context.shadowColor = options.accent;
  context.shadowBlur = options.frame.cornerGlow;
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
  const layout = options.profile;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, width, height, options);
  frame(context, layout.box, options);
  const placed = logo(context, width / 2, layout.logoY, layout.logoSize, options);
  text(context, options, options.profileText + options.cursor, placed.left, placed.bottom + layout.textGap, layout.textSize, options.accent, layout.textGlow);
  text(context, options, options.profileSub, placed.left, placed.bottom + layout.subGap, layout.subSize, options.dim);
  scanlines(context, width, height, options);
}

// Offline banner 1920x1080, in the style of the starting/ending scenes
export function drawOfflineBanner(context: CanvasRenderingContext2D, options: BannerOptions) {
  const width = 1920, height = 1080;
  const layout = options.offline;
  const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = layout.box;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, width, height, options);

  frame(context, layout.box, options);
  text(context, options, options.offlineHeader, boxX + layout.inset, boxY + layout.headerY, layout.headerSize, options.dim);
  text(context, options, options.offlineStatus, boxX + boxWidth - layout.statusRight, boxY + layout.headerY, layout.headerSize, options.accent, layout.statusGlow);
  context.fillStyle = options.line;
  context.fillRect(boxX + layout.inset, boxY + layout.ruleY, boxWidth - 2 * layout.inset, layout.rule);

  const placed = logo(context, width / 2, boxY + layout.logoY, layout.logoSize, options);
  // Title
  context.font = `${layout.titleSize}px ${fontStack(options.font)}`;
  const titleX = width / 2 - context.measureText(options.offlineTitle).width / 2;
  const titleY = placed.bottom + layout.titleGap;
  text(context, options, options.offlineTitle, titleX, titleY, layout.titleSize, options.accent, layout.titleGlow);

  context.font = `${layout.textSize}px ${fontStack(options.font)}`;
  text(context, options, options.offlineText, width / 2 - context.measureText(options.offlineText).width / 2, titleY + layout.textGap, layout.textSize, options.dim);

  // Terminal at the bottom, the last line with cursor
  const lines = options.offlineLines;
  const firstLine = boxY + boxHeight - layout.linesUp;
  context.fillStyle = options.line;
  context.fillRect(boxX + layout.inset, boxY + boxHeight - layout.termUp, boxWidth - 2 * layout.inset, layout.rule);
  lines.forEach((line, index) => text(context, options, `${options.prompt} ${line}`, boxX + layout.inset, firstLine + index * layout.lineStep, layout.lineSize, index === lines.length - 1 ? options.accent : options.dim));
  context.font = `${layout.lineSize}px ${fontStack(options.font)}`;
  const lastWidth = context.measureText(`${options.prompt} ${lines.at(-1) ?? ""} `).width;
  if (lines.length) text(context, options, options.cursor, boxX + layout.inset + lastWidth, firstLine + (lines.length - 1) * layout.lineStep, layout.lineSize, options.accent);

  scanlines(context, width, height, options);
}
