// Stinger of the Plantage theme: a ripe mango falls from the top into the picture, grows until it fills everything in
// mango colors at the transition point (cut), briefly shows the text while leaves whirl out of it (burstAt of the core),
// and drops out at the
// bottom again. Drawn like the illustrated backdrop: the mango glows from the upper left into its blush, has a gloss and
// a soft shadow, the leaves shade from light to dark with a vein. Before and after transparent. Pure function of time,
// so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeIn, easeInOut } from "../../core/easing.ts";
import { burstAt } from "../../core/motion/burst.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type PlantageStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  leaves: boolean;
  leafCount: number;
  seed: number;
  text: string;
  font: string;
  mango: string;
  blush: string;
  leaf: string;
  leafDark: string;
  paper: string;
  shadow: string;
  textColor: string;
  look: PlantageStingerLook;
};
// The motion of the settings: the mango radius at the start and at the cut, the whirl of the leaves (px and s, it starts
// lead s before the cut), their length, the gloss and the text with its shadow and how long it shows (share of the time)
export type PlantageStingerLook = {
  startRadius: number; coverRadius: number; whirl: { lead: number; speed: readonly [number, number]; gravity: number; drag: number; life: number };
  leafMin: number; leafRange: number; gloss: number; textSize: number; textBlur: number; textLift: number; shown: number;
};

// fixed: the leaves burst out of the middle and whirl outward
const WHIRL = { origin: { x: WIDTH / 2, y: HEIGHT / 2 }, direction: 0, spread: Math.PI * 2 };
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
  context.globalAlpha = options.look.gloss;
  context.beginPath();
  context.ellipse(x - radius * 0.38, y - radius * 0.45, radius * 0.16, radius * 0.1, -0.7, 0, TURN);
  context.fill();
  context.globalAlpha = 1;
  // The leaf at the stem, above the mango
  leaf(context, x + radius * 0.25, y - radius * 1.02, radius * 0.32, -0.5, options);
}

// Leaves whirl outward from the middle around the transition point, every one placed from seed and time
function leaves(context: CanvasRenderingContext2D, time: number, options: PlantageStingerOptions) {
  const { whirl, leafMin, leafRange } = options.look;
  burstAt(options.seed, options.leafCount, time - (options.cut - whirl.lead), { ...WHIRL, ...whirl }).forEach((spot, index) => {
    if (spot.opacity <= 0) return;
    context.globalAlpha = spot.opacity;
    leaf(context, spot.x, spot.y, leafMin + ((index * 7) % 10) / 10 * leafRange, spot.angle, options);
  });
  context.globalAlpha = 1;
}

export function drawPlantageStinger(context: CanvasRenderingContext2D, time: number, options: PlantageStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const enter = easeInOut(clamp01(time / (cut * 0.9)));
  const leave = easeIn(clamp01((time - cut) / ((duration - cut) * 0.9)));
  if (enter <= 0 || leave >= 1) return;
  // Falling in: from above the picture to the middle while growing; falling out: down until the top edge is below the picture
  const { startRadius, coverRadius } = options.look;
  const radius = startRadius + (coverRadius - startRadius) * enter;
  const y = -startRadius + (HEIGHT / 2 + startRadius) * enter + leave * (HEIGHT / 2 + coverRadius);
  mango(context, WIDTH / 2, y, radius, options);

  // Leaves and text around the transition point
  if (options.leaves) leaves(context, time, options);
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * options.look.shown));
  if (shown <= 0) return;
  context.save();
  context.globalAlpha = shown;
  context.fillStyle = options.textColor;
  context.shadowColor = options.shadow;
  context.shadowBlur = options.look.textBlur;
  context.shadowOffsetY = options.look.textLift;
  context.font = `700 ${options.look.textSize}px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
