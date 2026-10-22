// Stinger of the standard theme (PLAN-STANDARD.md package 4): stripes slide in from the left with a gradient front,
// cover the whole picture at the transition point (cut) and slide out to the right. Inside the stripes the dark ground
// shows the light fields and the light dust of the screens (lights.ts); the text rises into the middle at the cut.
// Transparent outside the stripes. Pure function of seed and time, so it can be rendered frame by frame.
// Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";
import { type LightsOptions, paintLights } from "./lights.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type StandardStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  panels: number; // number of stripes
  text: string;
  font: string;
  accent: string;
  accent2: string;
  textColor: string;
  background: string;
  lights: LightsOptions;
};

type Span = { left: number; right: number; top: number; height: number };

// Width of the gradient front of a stripe and how far the text rises in px
const FRONT = 28;
const RISE = 40;

// Every stripe starts a bit later; all are fully in at cut and leave the picture by the end
function spans(time: number, options: StandardStingerOptions): Span[] {
  const { cut, duration } = options;
  const count = Math.max(1, Math.round(options.panels));
  const band = HEIGHT / count;
  const inLength = cut * 0.7;
  const outLength = (duration - cut) * 0.7;
  return Array.from({ length: count }, (_, index) => {
    const delay = count > 1 ? (index / (count - 1)) * 0.3 : 0;
    const right = easeInOut(clamp01((time - delay * cut) / inLength)) * WIDTH;
    const left = easeInOut(clamp01((time - cut - delay * (duration - cut)) / outLength)) * WIDTH;
    // 1 px overlap, so no hairline stays between the stripes
    return { left, right, top: index * band, height: band + 1 };
  }).filter(span => span.right - span.left > 0);
}

export function drawStandardStinger(context: CanvasRenderingContext2D, time: number, options: StandardStingerOptions) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const visible = spans(time, options);
  if (visible.length > 0) {
    context.fillStyle = options.background;
    for (const span of visible) context.fillRect(span.left, span.top, span.right - span.left, span.height);
    context.save();
    context.beginPath();
    for (const span of visible) context.rect(span.left, span.top, span.right - span.left, span.height);
    context.clip();
    paintLights(context, options.lights, time, WIDTH, HEIGHT);
    context.restore();
    const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, options.accent);
    gradient.addColorStop(1, options.accent2);
    context.fillStyle = gradient;
    for (const span of visible) {
      if (span.right < WIDTH) context.fillRect(Math.max(span.left, span.right - FRONT), span.top, Math.min(FRONT, span.right - span.left), span.height);
      if (span.left > 0) context.fillRect(span.left, span.top, Math.min(FRONT, span.right - span.left), span.height);
    }
  }

  // Text in the middle, only while everything is covered; it rises into place up to the cut
  const { cut, duration } = options;
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.5));
  if (shown <= 0) return;
  context.globalAlpha = shown;
  context.fillStyle = options.textColor;
  context.font = `800 120px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2 + (time < cut ? (1 - shown) * RISE : 0));
  context.globalAlpha = 1;
}
