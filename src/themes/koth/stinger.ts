// Stinger of the KOTH theme: a smoke grenade pops in the middle, its smoke billows out until it fills the picture in the
// smoke color at the transition point (cut); in the smoke the flag on the hill changes from one faction to the next with
// the text, then the smoke thins out again. Before and after transparent. Pure function of time, so it can be rendered
// frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type KothStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  flag: boolean; // the flag change in the smoke
  text: string;
  font: string;
  smoke: string;
  flags: readonly [string, string]; // flag color before and after the transition point
  pole: string;
  textColor: string;
};

// fixed: smoke puffs as (x, y) in parts of the picture, their largest radius, the flag size
const PUFFS = [[0.5, 0.55], [0.32, 0.45], [0.68, 0.45], [0.2, 0.7], [0.8, 0.7], [0.42, 0.25], [0.6, 0.22], [0.12, 0.3], [0.9, 0.28]];
const PUFF_RADIUS = 560;
const FLAG = { pole: 12, height: 420, width: 260, cloth: 150 };
const TURN = Math.PI * 2;

function flag(context: CanvasRenderingContext2D, time: number, options: KothStingerOptions) {
  const x = WIDTH / 2 - FLAG.width / 2;
  const top = HEIGHT / 2 - FLAG.height / 2 - 120;
  context.fillStyle = options.pole;
  context.fillRect(x, top, FLAG.pole, FLAG.height);
  context.fillStyle = time < options.cut ? options.flags[0] : options.flags[1];
  context.beginPath();
  context.moveTo(x + FLAG.pole, top);
  for (let step = 0; step <= 8; step++) {
    const along = (step / 8) * FLAG.width;
    context.lineTo(x + FLAG.pole + along, top + 12 * Math.sin(along / 40 + time * 8));
  }
  context.lineTo(x + FLAG.pole + FLAG.width, top + FLAG.cloth);
  context.lineTo(x + FLAG.pole, top + FLAG.cloth);
  context.closePath();
  context.fill();
}

export function drawKothStinger(context: CanvasRenderingContext2D, time: number, options: KothStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const enter = easeInOut(clamp01(time / (cut * 0.9)));
  const leave = easeInOut(clamp01((time - cut) / ((duration - cut) * 0.9)));
  if (enter <= 0 || leave >= 1) return;
  // Billowing in: the puffs grow one after another; full smoke: one area that thins out after the transition point
  context.fillStyle = options.smoke;
  context.globalAlpha = 1 - leave;
  if (enter >= 1) context.fillRect(0, 0, WIDTH, HEIGHT);
  else {
    PUFFS.forEach(([x, y], index) => {
      const grow = clamp01(enter * 1.6 - index * 0.06);
      if (grow <= 0) return;
      context.beginPath();
      context.arc(x * WIDTH, y * HEIGHT, grow * PUFF_RADIUS, 0, TURN);
      context.fill();
    });
  }

  // Flag and text around the transition point
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown > 0) {
    context.globalAlpha = shown * (1 - leave);
    if (options.flag) flag(context, time, options);
    context.fillStyle = options.textColor;
    context.font = `400 130px "${options.font}", sans-serif`;
    context.textBaseline = "middle";
    const width = context.measureText(options.text).width;
    context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2 + 200);
  }
  context.globalAlpha = 1;
}
