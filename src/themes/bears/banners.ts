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
};

const TURN = Math.PI * 2;
// fixed: poses for awake and asleep
const AWAKE: Record<BearId, PoseName> = { eisbaer: "wave", grizzly: "wave", panda: "wave" };
const ASLEEP: Record<BearId, PoseName> = { eisbaer: "sleep", grizzly: "sleep", panda: "sleep" };
// fixed: the moment of the still: the clouds at their start, the three z at a sixth, half and five sixths of their rise
// (so all of them show)
const STILL_PHASE = 1 / 6;
// fixed: the offline card: its center, smallest width, room beside the title, how far right it may reach, title size
const OFFLINE_CARD = { x: 1330, width: 860, padding: 70, right: 1880, titleSize: 92 };

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
  const [x, baseY, height] = [230, 462, 330];
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
  card(context, 520, 120, 600, 230, options);
  title(context, options.title, 820, 205, 76, options);
  line(context, options.profileText, 820, 290, 30, options.textDark, options);
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
  context.font = `800 54px "${options.titleFont}", sans-serif`;
  context.fillStyle = options.palette.paper;
  context.strokeStyle = options.palette.outline;
  context.lineWidth = options.palette.outlineWidth;
  for (let index = 0; index < 3; index++) {
    const rise = (phase + index / 3) % 1;
    context.globalAlpha = Math.sin(Math.PI * rise);
    context.strokeText(options.sleepText, 430 + rise * 90, 560 - rise * 200);
    context.fillText(options.sleepText, 430 + rise * 90, 560 - rise * 200);
  }
  context.globalAlpha = 1;
}

export function drawBearsOfflineBanner(context: CanvasRenderingContext2D, options: BearsBannerOptions) {
  (options.world ?? flatWorld)(context, options.evening, 0, "abend");
  if (options.lights) fairyLights(context, STILL_PHASE, options);
  drawHero(context, options.offlineBear, ASLEEP, 340, 900, 420, options.palette);
  sleep(context, STILL_PHASE, options);
  // The card grows with a long title up to the right edge, beyond that the title gets smaller
  context.font = `800 ${OFFLINE_CARD.titleSize}px "${options.titleFont}", sans-serif`;
  const words = context.measureText(options.offlineTitle).width;
  const room = (OFFLINE_CARD.right - OFFLINE_CARD.x) * 2 - OFFLINE_CARD.padding * 2;
  const width = Math.min(room, Math.max(OFFLINE_CARD.width - OFFLINE_CARD.padding * 2, words)) + OFFLINE_CARD.padding * 2;
  card(context, OFFLINE_CARD.x - width / 2, 240, width, 520, options);
  title(context, options.offlineTitle, OFFLINE_CARD.x, 350, OFFLINE_CARD.titleSize * Math.min(1, room / words), options);
  line(context, options.offlineText, 1330, 460, 36, options.textDark, options);
  options.offlineLines.forEach((text, index) => line(context, text, 1330, 550 + index * 60, 32, options.textDim, options));
}
