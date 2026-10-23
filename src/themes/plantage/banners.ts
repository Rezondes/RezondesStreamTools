// Twitch banners of the Plantage theme (PLAN-PLANTAGE.md package 5): the world of the scenes (paint.ts) as a still.
// Profile banner (1200x480) by day with channel name and text over the field, offline banner (1920x1080) in the evening
// with a frosted card for title, text and lines. Both are still pictures (the dashboard saves a PNG).
// Check: banners.check.ts.
import { paintWorld, type PaintOptions } from "./paint.ts";

export type PlantageBannerOptions = {
  font: string;
  titleFont: string;
  textColor: string;
  textOnWood: string;
  paper: string;
  shadow: string;
  day: PaintOptions;
  evening: PaintOptions;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
};

// fixed: layout of the banners in px (text lines, the frosted card of the offline banner)
const PROFILE = { width: 1200, height: 480, title: 130, text: 220, titleSize: 96, textSize: 34, glow: 24 };
const OFFLINE = { width: 1920, height: 1080, title: 330, text: 450, line: 530, lineStep: 52, titleSize: 110, textSize: 40, lineSize: 34, lines: 3 };
const CARD = { left: 340, top: 200, width: 1240, height: 520, round: 28, alpha: 0.82, blur: 60, lift: 24, inset: 60 };

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.textAlign = "center";
  context.fillText(text, width / 2, y);
}

// A font that fits the text into the given width: the set size, smaller when the text is too long
function fitted(context: CanvasRenderingContext2D, weight: number, size: number, family: string, text: string, room: number) {
  context.font = `${weight} ${size}px "${family}", sans-serif`;
  const width = context.measureText(text).width;
  if (width > room) context.font = `${weight} ${Math.floor((size * room) / width)}px "${family}", sans-serif`;
}

// Text that stands on the picture: a soft shadow lifts it off the field
function lifted(context: CanvasRenderingContext2D, color: string, shadow: string, blur: number) {
  context.fillStyle = color;
  context.shadowColor = shadow;
  context.shadowBlur = blur;
  context.shadowOffsetY = blur / 4;
}

export function drawPlantageProfileBanner(context: CanvasRenderingContext2D, options: PlantageBannerOptions) {
  paintWorld(context, PROFILE.width, PROFILE.height, options.day);
  context.save();
  lifted(context, options.textColor, options.shadow, PROFILE.glow);
  context.textBaseline = "middle";
  context.font = `700 ${PROFILE.titleSize}px "${options.titleFont}", sans-serif`;
  centered(context, options.title, PROFILE.title, PROFILE.width);
  context.font = `600 ${PROFILE.textSize}px "${options.font}", sans-serif`;
  centered(context, options.profileText, PROFILE.text, PROFILE.width);
  context.restore();
}

// The frosted card: harvest paper, a soft shadow on the field
function frostCard(context: CanvasRenderingContext2D, options: PlantageBannerOptions) {
  context.save();
  context.shadowColor = options.shadow;
  context.shadowBlur = CARD.blur;
  context.shadowOffsetY = CARD.lift;
  context.globalAlpha = CARD.alpha;
  context.fillStyle = options.paper;
  context.beginPath();
  context.roundRect(CARD.left, CARD.top, CARD.width, CARD.height, CARD.round);
  context.fill();
  context.restore();
}

export function drawPlantageOfflineBanner(context: CanvasRenderingContext2D, options: PlantageBannerOptions) {
  paintWorld(context, OFFLINE.width, OFFLINE.height, options.evening);
  frostCard(context, options);
  context.save();
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  const room = CARD.width - CARD.inset * 2;
  fitted(context, 700, OFFLINE.titleSize, options.titleFont, options.offlineTitle, room);
  centered(context, options.offlineTitle, OFFLINE.title, OFFLINE.width);
  fitted(context, 600, OFFLINE.textSize, options.font, options.offlineText, room);
  centered(context, options.offlineText, OFFLINE.text, OFFLINE.width);
  context.font = `400 ${OFFLINE.lineSize}px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, OFFLINE.lines).forEach((line, index) => centered(context, line, OFFLINE.line + index * OFFLINE.lineStep, OFFLINE.width));
  context.restore();
}
