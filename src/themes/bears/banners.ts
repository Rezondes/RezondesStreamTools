// Banners of the Bärenbande theme, drawn from the character model and the world (paint.ts): the profile banner (1200 x 480)
// shows the meadow at noon with forest edge, city and bridge, the channel name and a text on a paper sign and the chosen
// bear (or the tower); the offline banner (1920 x 1080) the evening in front of the cave with a string of fairy lights, the
// chosen bear asleep with z above it and a paper card with title, text and lines. Both are still pictures (the
// dashboard saves a PNG). The world comes from a painter (the watercolor of clipWorld.ts once render.ts has loaded it,
// the flat drawWorld before); the awake bear raises its arm to wave (boneMotion.ts).
// Check: banners.check.ts.
import { isBearChoice, TOWER, type BearId } from "./bears.ts";
import { waveAt, waveLoop } from "./boneMotion.ts";
import type { PoseName } from "./rig.ts";
import { drawBear, drawHero, drawWorld, type Palette, type WorldColors } from "./paint.ts";
import { LIGHT, type TimeOfDay, WORLD } from "./world.ts";

// Paints the world in its 1920 x 1080 space at a time of day, the clouds at drift 0..1
export type WorldPainter = (context: CanvasRenderingContext2D, colors: WorldColors, drift: number, time: TimeOfDay) => void;
const flatWorld: WorldPainter = (context, colors, drift, time) => drawWorld(context, colors, drift, LIGHT[time], time === "nacht");

export type BearsBannerOptions = {
  font: string;
  titleFont: string;
  palette: Palette;
  day: WorldColors;
  evening: WorldColors;
  profileBear: string;
  offlineBear: string;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
  lights: boolean;
  lightColors: readonly string[];
  textDark: string;
  textDim: string;
  paperShade: string;
  sleepText: string;
  world?: WorldPainter;
  layout: BearsBannerLayout;
};
// Places and sizes of the settings in px: the bear, the card and the texts of each banner, the z of the sleeping bear
export type BearsBannerLayout = {
  profile: { bearX: number; bearY: number; bearHeight: number; cardX: number; cardY: number; cardWidth: number; cardHeight: number; titleX: number; titleY: number; titleSize: number; textY: number; textSize: number };
  offline: {
    bearX: number; bearY: number; bearHeight: number; cardX: number; cardY: number; cardWidth: number; cardHeight: number; padding: number; right: number;
    titleY: number; titleSize: number; textY: number; textSize: number; linesY: number; lineStep: number; lineSize: number;
    sleepX: number; sleepY: number; sleepRiseX: number; sleepRiseY: number; sleepSize: number;
  };
};

const TURN = Math.PI * 2;
// fixed: poses for awake and asleep
const AWAKE: Record<BearId, PoseName> = { eisbaer: "wave", grizzly: "wave", panda: "wave" };
const ASLEEP: Record<BearId, PoseName> = { eisbaer: "sleep", grizzly: "sleep", panda: "sleep" };
// fixed: the moment of the still: the clouds at their start, the three z at a sixth, half and five sixths of their rise
// (so all of them show)
const STILL_PHASE = 1 / 6;

// A paper card with the outline and one shade band at the bottom
function card(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: BearsBannerOptions) {
  const radius = 26;
  const band = 12;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = options.paperShade;
  context.fill();
  context.beginPath();
  context.roundRect(x, y, width, height - band, radius);
  context.fillStyle = options.palette.paper;
  context.fill();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.lineWidth = options.palette.outlineWidth * 1.4;
  context.strokeStyle = options.palette.outline;
  context.stroke();
}

// A title in the title font: paper letters with the outline, centered on x
function title(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, options: BearsBannerOptions) {
  context.font = `800 ${size}px "${options.titleFont}", sans-serif`;
  context.textBaseline = "middle";
  context.lineJoin = "round";
  const width = context.measureText(text).width;
  context.lineWidth = options.palette.outlineWidth * 2.4;
  context.strokeStyle = options.palette.outline;
  context.strokeText(text, x - width / 2, y);
  context.fillStyle = options.palette.paper;
  context.fillText(text, x - width / 2, y);
}

function line(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, options: BearsBannerOptions) {
  context.font = `700 ${size}px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  context.fillStyle = color;
  const width = context.measureText(text).width;
  context.fillText(text, x - width / 2, y);
}

// The awake bear of the profile banner with its arm raised to wave; the tower stands
function awake(context: CanvasRenderingContext2D, options: BearsBannerOptions) {
  const { bearX: x, bearY: baseY, bearHeight: height } = options.layout.profile;
  const bear = isBearChoice(options.profileBear) && options.profileBear !== TOWER ? options.profileBear : null;
  if (!bear) return drawHero(context, options.profileBear, AWAKE, x, baseY, height, options.palette);
  drawBear(context, bear, AWAKE[bear], x, baseY, height, options.palette, 1, 0, {}, { arm: waveAt(waveLoop(1) / 2, 1) });
}

export function drawBearsProfileBanner(context: CanvasRenderingContext2D, options: BearsBannerOptions) {
  const width = 1200;
  const height = 480;
  const scale = width / WORLD.width;
  context.save();
  context.translate(0, height - WORLD.height * scale);
  context.scale(scale, scale);
  (options.world ?? flatWorld)(context, options.day, 0, "mittag");
  context.restore();
  awake(context, options);
  const look = options.layout.profile;
  card(context, look.cardX, look.cardY, look.cardWidth, look.cardHeight, options);
  title(context, options.title, look.titleX, look.titleY, look.titleSize, options);
  line(context, options.profileText, look.titleX, look.textY, look.textSize, options.textDark, options);
}

// A string of lights along the cave mouth, each bulb at its own brightness
function fairyLights(context: CanvasRenderingContext2D, phase: number, options: BearsBannerOptions) {
  const bulbs = 11;
  context.strokeStyle = options.palette.outline;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(180, 760);
  context.quadraticCurveTo(300, 640, 420, 760);
  context.stroke();
  for (let index = 0; index < bulbs; index++) {
    const part = index / (bulbs - 1);
    const x = 180 + 240 * part;
    const y = 760 - 120 * part * (1 - part) * 2;
    context.globalAlpha = 0.55 + 0.45 * Math.sin(TURN * (phase + index / 3));
    context.fillStyle = options.lightColors[index % options.lightColors.length];
    context.beginPath();
    context.arc(x, y + 12, 9, 0, TURN);
    context.fill();
  }
  context.globalAlpha = 1;
}

// Three z above the sleeping bear, one after another on their way up
function sleep(context: CanvasRenderingContext2D, phase: number, options: BearsBannerOptions) {
  const look = options.layout.offline;
  context.font = `800 ${look.sleepSize}px "${options.titleFont}", sans-serif`;
  context.fillStyle = options.palette.paper;
  context.strokeStyle = options.palette.outline;
  context.lineWidth = options.palette.outlineWidth;
  for (let index = 0; index < 3; index++) {
    const rise = (phase + index / 3) % 1;
    context.globalAlpha = Math.sin(Math.PI * rise);
    context.strokeText(options.sleepText, look.sleepX + rise * look.sleepRiseX, look.sleepY - rise * look.sleepRiseY);
    context.fillText(options.sleepText, look.sleepX + rise * look.sleepRiseX, look.sleepY - rise * look.sleepRiseY);
  }
  context.globalAlpha = 1;
}

export function drawBearsOfflineBanner(context: CanvasRenderingContext2D, options: BearsBannerOptions) {
  (options.world ?? flatWorld)(context, options.evening, 0, "abend");
  if (options.lights) fairyLights(context, STILL_PHASE, options);
  const look = options.layout.offline;
  drawHero(context, options.offlineBear, ASLEEP, look.bearX, look.bearY, look.bearHeight, options.palette);
  sleep(context, STILL_PHASE, options);
  // The card grows with a long title up to the right edge, beyond that the title gets smaller
  context.font = `800 ${look.titleSize}px "${options.titleFont}", sans-serif`;
  const words = context.measureText(options.offlineTitle).width;
  const room = (look.right - look.cardX) * 2 - look.padding * 2;
  const width = Math.min(room, Math.max(look.cardWidth - look.padding * 2, words)) + look.padding * 2;
  card(context, look.cardX - width / 2, look.cardY, width, look.cardHeight, options);
  title(context, options.offlineTitle, look.cardX, look.titleY, look.titleSize * Math.min(1, room / words), options);
  line(context, options.offlineText, look.cardX, look.textY, look.textSize, options.textDark, options);
  options.offlineLines.forEach((text, index) => line(context, text, look.cardX, look.linesY + index * look.lineStep, look.lineSize, options.textDim, options));
}
