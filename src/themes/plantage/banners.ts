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
  layout: PlantageBannerLayout;
};
// Places and sizes of the settings in px: the text lines of both banners, the frosted card of the offline banner
export type PlantageBannerLayout = {
  profile: { title: number; text: number; titleSize: number; textSize: number; glow: number };
  offline: { title: number; text: number; line: number; lineStep: number; titleSize: number; textSize: number; lineSize: number; lines: number };
  card: { left: number; top: number; width: number; height: number; round: number; alpha: number; blur: number; lift: number; inset: number };
};

// fixed: size of the banners in px
const PROFILE = { width: 1200, height: 480 };
const OFFLINE = { width: 1920, height: 1080 };

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
  const look = options.layout.profile;
  paintWorld(context, PROFILE.width, PROFILE.height, options.day);
  context.save();
  lifted(context, options.textColor, options.shadow, look.glow);
  context.textBaseline = "middle";
  context.font = `700 ${look.titleSize}px "${options.titleFont}", sans-serif`;
  centered(context, options.title, look.title, PROFILE.width);
  context.font = `600 ${look.textSize}px "${options.font}", sans-serif`;
  centered(context, options.profileText, look.text, PROFILE.width);
  context.restore();
}

// The frosted card: harvest paper, a soft shadow on the field
function frostCard(context: CanvasRenderingContext2D, options: PlantageBannerOptions) {
  const CARD = options.layout.card;
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
  const { offline: look, card } = options.layout;
  context.save();
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  const room = card.width - card.inset * 2;
  fitted(context, 700, look.titleSize, options.titleFont, options.offlineTitle, room);
  centered(context, options.offlineTitle, look.title, OFFLINE.width);
  fitted(context, 600, look.textSize, options.font, options.offlineText, room);
  centered(context, options.offlineText, look.text, OFFLINE.width);
  context.font = `400 ${look.lineSize}px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, look.lines).forEach((line, index) => centered(context, line, look.line + index * look.lineStep, OFFLINE.width));
  context.restore();
}
