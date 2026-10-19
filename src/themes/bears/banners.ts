// Banners of the Bärenbande theme, drawn from the character model and the world (paint.ts): the profile banner (1200 x 480)
// shows the meadow at noon with forest edge, city and bridge, the channel name and a text on a paper sign and the chosen
// bear (or the tower); the offline banner (1920 x 1080) the evening in front of the cave with a string of fairy lights, the
// chosen bear asleep with rising z and a paper card with title, text and lines. Clouds, lights and z run in one seamless
// loop (frame 0 = frame at the loop end). Pure functions of time. Check: banners.check.ts.
import type { BearId, PoseName } from "./bears.ts";
import { drawHero, drawWorld, type Palette, type WorldColors } from "./paint.ts";
import { WORLD } from "./world.ts";

export type BearsBannerOptions = {
  loop: number; // seconds
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
};

const TURN = Math.PI * 2;
// fixed: where sun and evening light stand in the world, poses for awake and asleep
const NOON: readonly [number, number] = [980, 150];
const EVENING: readonly [number, number] = [1500, 420];
const AWAKE: Record<BearId, PoseName> = { eisbaer: "wave", grizzly: "wave", panda: "wave" };
const ASLEEP: Record<BearId, PoseName> = { eisbaer: "sleep", grizzly: "sleep", panda: "sleep" };

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

export function drawBearsProfileBanner(context: CanvasRenderingContext2D, time: number, options: BearsBannerOptions) {
  const width = 1200;
  const height = 480;
  const phase = (time / options.loop) % 1;
  const scale = width / WORLD.width;
  context.save();
  context.translate(0, height - WORLD.height * scale);
  context.scale(scale, scale);
  drawWorld(context, options.day, phase, NOON, false);
  context.restore();
  drawHero(context, options.profileBear, AWAKE, 230, 462, 330, options.palette);
  card(context, 520, 120, 600, 230, options);
  title(context, options.title, 820, 205, 76, options);
  line(context, options.profileText, 820, 290, 30, options.textDark, options);
}

// A string of lights along the cave mouth, twinkling once per loop
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

// Three z rise above the sleeping bear, one after another, once per loop
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

export function drawBearsOfflineBanner(context: CanvasRenderingContext2D, time: number, options: BearsBannerOptions) {
  const phase = (time / options.loop) % 1;
  drawWorld(context, options.evening, phase, EVENING, false);
  if (options.lights) fairyLights(context, phase, options);
  drawHero(context, options.offlineBear, ASLEEP, 340, 900, 420, options.palette);
  sleep(context, phase, options);
  card(context, 900, 240, 860, 520, options);
  title(context, options.offlineTitle, 1330, 350, 92, options);
  line(context, options.offlineText, 1330, 460, 36, options.textDark, options);
  options.offlineLines.forEach((text, index) => line(context, text, 1330, 550 + index * 60, 32, options.textDim, options));
}
