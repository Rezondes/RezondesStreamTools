// Stinger of the Urlaub theme (PLAN-URLAUB.md package 8): the swell of the alert (crestShape of swell.ts, widened to the
// whole picture) rolls in from the left with its steep front, covers everything in sea colors at the transition point
// (cut), briefly shows the text and a palm and runs out to the right with its long back. Spray flies where the wave
// breaks (burstAt of the core). Before and after transparent. Pure function of time, so it can be rendered frame by
// frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";
import { burstAt } from "../../core/motion/burst.ts";
import { crestShape } from "./swell.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type UrlaubStingerOptions = {
  duration: number; // Sekunden
  cut: number; // seconds, enter in OBS as transition point
  waves: number; // Wellenschichten
  foam: boolean;
  palm: boolean;
  spray: number; // drops per break
  text: string;
  font: string;
  sea: string;
  seaDeep: string;
  foamColor: string;
  textColor: string;
  palmColor: string;
};

// fixed: how much wider the crest is than in the alert, how far the wave rises above the picture, how far front and
// back start outside it, the distance of the layers, the step of the surface line, the width of the foam line
const SCALE = 3;
const RISE = 140;
const REACH = 1200;
const LAYER = 110;
const STEP = 16;
const FOAM_WIDTH = 14;
// fixed: the ripple running along the surface (px, rad per px, rad per s)
const RIPPLE = { size: 10, wave: 0.012, speed: 6 };
// fixed: when the wave breaks (share of the way in and of the way out) and how the spray of a break flies
const BREAKS = { in: [0.45, 0.6], out: [0.45] };
const SPRAY = { spread: Math.PI * 0.6, speed: [300, 800] as const, gravity: 2200, drag: 0, life: 0.45, size: 12 };
// fixed: the spray flies from the face of the crest where it stands at this share of the height, up and forward (rad)
const FACE = 0.45;
const LEAN = 0.5;

// Where the front (coming in) and the back (going out) of the wave are at time, in px
function edges(time: number, options: UrlaubStingerOptions) {
  const { cut, duration } = options;
  const enter = easeInOut(clamp01(time / (cut * 0.9)));
  const leave = easeInOut(clamp01((time - cut) / ((duration - cut) * 0.9)));
  return { front: enter * (WIDTH + 2 * REACH) - REACH, back: leave * (WIDTH + 2 * REACH) - REACH };
}

// The y of the water surface at x (HEIGHT = no water, below 0 = the column is covered)
export function surfaceAt(x: number, time: number, options: UrlaubStingerOptions): number {
  const { front, back } = edges(time, options);
  const coming = x <= front ? 1 : crestShape(x - front, SCALE);
  const going = x >= back ? 1 : crestShape(x - back, SCALE);
  const lift = Math.min(coming, going);
  return HEIGHT - (HEIGHT + RISE) * lift + Math.sin(x * RIPPLE.wave + time * RIPPLE.speed) * RIPPLE.size * lift;
}

// Where the face of the wave crosses FACE of the height: coming in (ahead 1) the last wet column, going out the first
function faceAt(time: number, ahead: 1 | -1, options: UrlaubStingerOptions) {
  const columns = Array.from({ length: Math.ceil(WIDTH / STEP) + 1 }, (_, index) => index * STEP);
  const wet = columns.filter(x => surfaceAt(x, time, options) < HEIGHT * FACE);
  return ahead > 0 ? (wet.at(-1) ?? 0) : (wet[0] ?? WIDTH);
}

// The water body under the surface, shifted by shift px
function body(context: CanvasRenderingContext2D, time: number, options: UrlaubStingerOptions, shift: number) {
  context.beginPath();
  context.moveTo(-STEP, HEIGHT);
  for (let x = -STEP; x <= WIDTH + STEP; x += STEP) context.lineTo(x, surfaceAt(x - shift, time, options));
  context.lineTo(WIDTH + STEP, HEIGHT);
  context.closePath();
}

// Palm as a silhouette: curved trunk and five leaves
function drawPalm(context: CanvasRenderingContext2D, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(260, HEIGHT);
  context.quadraticCurveTo(240, 700, 330, 430);
  context.lineTo(360, 440);
  context.quadraticCurveTo(290, 700, 320, HEIGHT);
  context.closePath();
  context.fill();
  for (const [x, y] of [[120, 470], [180, 330], [380, 300], [520, 380], [560, 520]]) {
    context.beginPath();
    context.moveTo(345, 430);
    context.quadraticCurveTo((345 + x) / 2, Math.min(y, 430) - 90, x, y);
    context.quadraticCurveTo((345 + x) / 2, Math.min(y, 430) - 30, 345, 440);
    context.fill();
  }
}

// The spray of every break that has happened: from the crest where it broke
function drawSpray(context: CanvasRenderingContext2D, time: number, options: UrlaubStingerOptions) {
  const { cut, duration } = options;
  const moments = [...BREAKS.in.map(share => share * cut * 0.9), ...BREAKS.out.map(share => cut + share * (duration - cut) * 0.9)];
  context.fillStyle = options.foamColor;
  moments.forEach((moment, index) => {
    const ahead = index < BREAKS.in.length ? 1 : -1;
    const origin = { x: faceAt(moment, ahead, options), y: HEIGHT * FACE };
    for (const drop of burstAt(index + 1, options.spray, time - moment, { ...SPRAY, origin, direction: -Math.PI / 2 + ahead * LEAN })) {
      if (drop.opacity <= 0) continue;
      context.globalAlpha = drop.opacity;
      context.beginPath();
      context.arc(drop.x, drop.y, SPRAY.size * drop.opacity, 0, Math.PI * 2);
      context.fill();
    }
  });
  context.globalAlpha = 1;
}

export function drawUrlaubStinger(context: CanvasRenderingContext2D, time: number, options: UrlaubStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const { front, back } = edges(time, options);
  if (front <= -REACH || back >= WIDTH + REACH) return;
  const layers = Math.max(1, Math.round(options.waves));
  for (let layer = 0; layer < layers; layer++) {
    const top = layer === layers - 1;
    context.fillStyle = top ? options.sea : options.seaDeep;
    context.globalAlpha = top ? 1 : 0.55 + (0.45 * layer) / layers;
    body(context, time, options, (layers - 1 - layer) * LAYER);
    context.fill();
  }
  context.globalAlpha = 1;
  if (options.foam) {
    // On the leading layer (coming in the front one, going out the top one), only where there is water
    const shift = time < cut ? (layers - 1) * LAYER : 0;
    context.strokeStyle = options.foamColor;
    context.lineWidth = FOAM_WIDTH;
    context.beginPath();
    for (let x = -STEP; x <= WIDTH + STEP; x += STEP) {
      const y = surfaceAt(x - shift, time, options);
      if (y < HEIGHT - FOAM_WIDTH) context.lineTo(x, y);
      else context.moveTo(x, y);
    }
    context.stroke();
  }
  drawSpray(context, time, options);

  // Text and palm around the transition point, only in the water (otherwise they would stand over the transparent picture)
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  body(context, time, options, 0);
  context.clip();
  context.globalAlpha = shown;
  if (options.palm) drawPalm(context, options.palmColor);
  context.fillStyle = options.textColor;
  context.font = `400 140px "${options.font}", cursive`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
