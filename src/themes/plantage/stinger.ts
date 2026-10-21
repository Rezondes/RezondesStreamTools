// Stinger of the Plantage theme: a ripe mango falls from the top into the picture, grows until it fills everything in
// mango colors at the transition point (cut), briefly shows the text with leaves flying around, and drops out at the
// bottom again. Drawn like the illustrated backdrop: the mango glows from the upper left into its blush, has a gloss and
// a soft shadow, the leaves shade from light to dark with a vein. Before and after transparent. Pure function of time,
// so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeIn, easeInOut } from "../../core/easing.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type PlantageStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  leaves: boolean;
  text: string;
  font: string;
  mango: string;
  blush: string;
  leaf: string;
  leafDark: string;
  paper: string;
  shadow: string;
  textColor: string;
};

// fixed: radius of the mango at the start, radius that covers the whole picture, number of flying leaves
const START_RADIUS = 90;
const COVER_RADIUS = 1200;
const LEAVES = 6;
const TURN = Math.PI * 2;

// A leaf as an ellipse turned by angle, shaded from light (top) to dark, with a vein along its length
function leaf(context: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, options: PlantageStingerOptions) {
  const shade = context.createLinearGradient(x, y - length * 0.4, x, y + length * 0.4);
  shade.addColorStop(0, options.leaf);
  shade.addColorStop(1, options.leafDark);
  context.fillStyle = shade;
  context.beginPath();
  context.ellipse(x, y, length, length * 0.37, angle, 0, TURN);
  context.fill();
  context.strokeStyle = options.leafDark;
  context.lineWidth = Math.max(1, length * 0.05);
  context.beginPath();
  context.moveTo(x - Math.cos(angle) * length * 0.85, y - Math.sin(angle) * length * 0.85);
  context.lineTo(x + Math.cos(angle) * length * 0.85, y + Math.sin(angle) * length * 0.85);
  context.stroke();
}

// The mango: glows from the upper left into its blush, with a gloss and a soft shadow; covering the whole picture it is
// one rectangle in the same glow
function mango(context: CanvasRenderingContext2D, x: number, y: number, radius: number, options: PlantageStingerOptions) {
  const covers = [[0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]].every(([cornerX, cornerY]) => Math.hypot(cornerX - x, cornerY - y) <= radius);
  const glow = context.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.05, x, y, radius * 1.1);
  glow.addColorStop(0, options.mango);
  glow.addColorStop(0.55, options.mango);
  glow.addColorStop(1, options.blush);
  context.fillStyle = glow;
  if (covers) context.fillRect(0, 0, WIDTH, HEIGHT);
  else {
    context.save();
    context.shadowColor = options.shadow;
    context.shadowBlur = radius * 0.25;
    context.shadowOffsetY = radius * 0.08;
    context.beginPath();
    context.ellipse(x, y, radius * 0.86, radius, -0.3, 0, TURN);
    context.fill();
    context.restore();
  }
  // Gloss at the upper left
  context.fillStyle = options.paper;
  context.globalAlpha = 0.45;
  context.beginPath();
  context.ellipse(x - radius * 0.38, y - radius * 0.45, radius * 0.16, radius * 0.1, -0.7, 0, TURN);
  context.fill();
  context.globalAlpha = 1;
  // The leaf at the stem, above the mango
  leaf(context, x + radius * 0.25, y - radius * 1.02, radius * 0.32, -0.5, options);
}

// Leaves fly outward from the middle around the transition point
function leaves(context: CanvasRenderingContext2D, shown: number, options: PlantageStingerOptions) {
  for (let index = 0; index < LEAVES; index++) {
    const angle = (index / LEAVES) * TURN;
    const reach = 260 + 420 * (1 - shown);
    leaf(context, WIDTH / 2 + Math.cos(angle) * reach * 1.6, HEIGHT / 2 + Math.sin(angle) * reach, 70, angle, options);
  }
}

export function drawPlantageStinger(context: CanvasRenderingContext2D, time: number, options: PlantageStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const enter = easeInOut(clamp01(time / (cut * 0.9)));
  const leave = easeIn(clamp01((time - cut) / ((duration - cut) * 0.9)));
  if (enter <= 0 || leave >= 1) return;
  // Falling in: from above the picture to the middle while growing; falling out: down until the top edge is below the picture
  const radius = START_RADIUS + (COVER_RADIUS - START_RADIUS) * enter;
  const y = -START_RADIUS + (HEIGHT / 2 + START_RADIUS) * enter + leave * (HEIGHT / 2 + COVER_RADIUS);
  mango(context, WIDTH / 2, y, radius, options);

  // Text and leaves around the transition point
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  context.globalAlpha = shown;
  if (options.leaves) leaves(context, shown, options);
  context.fillStyle = options.textColor;
  context.shadowColor = options.shadow;
  context.shadowBlur = 30;
  context.shadowOffsetY = 8;
  context.font = `700 140px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
