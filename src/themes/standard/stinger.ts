// Stinger of the standard theme: stripes in a color gradient slide in from the left, cover the whole picture at the
// transition point (cut), briefly show the text and slide out to the right. Transparent outside the stripes.
// Pure function of time, so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type StandardStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  panels: number; // number of stripes
  text: string;
  font: string;
  accent: string;
  accent2: string;
  textColor: string;
};


export function drawStandardStinger(context: CanvasRenderingContext2D, time: number, options: StandardStingerOptions) {
  const { cut, duration } = options;
  const count = Math.max(1, Math.round(options.panels));
  const band = HEIGHT / count;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, options.accent);
  gradient.addColorStop(1, options.accent2);
  context.fillStyle = gradient;

  // Every stripe starts a bit later; all are fully in at cut and leave the picture by the end
  const inLength = cut * 0.7;
  const outLength = (duration - cut) * 0.7;
  for (let index = 0; index < count; index++) {
    const delay = count > 1 ? (index / (count - 1)) * 0.3 : 0;
    const enter = easeInOut(clamp01((time - delay * cut) / inLength));
    const leave = easeInOut(clamp01((time - cut - delay * (duration - cut)) / outLength));
    const right = enter * WIDTH;
    const left = leave * WIDTH;
    // 1 px overlap, so no hairline stays between the stripes
    if (right - left > 0) context.fillRect(left, index * band, right - left, band + 1);
  }

  // Text in the middle, only while everything is covered
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.5));
  if (shown <= 0) return;
  context.globalAlpha = shown;
  context.fillStyle = options.textColor;
  context.font = `800 120px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.globalAlpha = 1;
}
