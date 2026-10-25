// Stinger of the standard theme (PLAN-STANDARD.md package 4): stripes slide in from the left with a gradient front,
// cover the whole picture at the transition point (cut) and slide out to the right. Inside the stripes the dark ground
// shows the light fields and the light dust of the screens (lights.ts); the text rises into the middle at the cut.
// Transparent outside the stripes. Colors, font, sizes and timing come from the stinger settings (the colors and the
// font follow the theme until set). Pure function of seed and time, so it can be rendered frame by frame.
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
  front: number; // width of the gradient front of a stripe in px
  textSize: number; // px
  textWeight: number;
  textRise: number; // how far the text rises into place in px
  textWindow: number; // share of the shorter half around the cut in which the text shows
  inShare: number; // share of the time up to the cut a stripe takes to come in
  outShare: number; // share of the time after the cut a stripe takes to leave
  stagger: number; // how much later the last stripe starts, as a share
};

type Span = { left: number; right: number; top: number; height: number };

// Every stripe starts a bit later; all are fully in at cut and leave the picture by the end
function spans(time: number, options: StandardStingerOptions): Span[] {
  const { cut, duration } = options;
  const count = Math.max(1, Math.round(options.panels));
  const band = HEIGHT / count;
  const inLength = Math.max(cut * options.inShare, Number.EPSILON);
  const outLength = Math.max((duration - cut) * options.outShare, Number.EPSILON);
  return Array.from({ length: count }, (_, index) => {
    const delay = count > 1 ? (index / (count - 1)) * options.stagger : 0;
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
      const front = options.front;
      if (span.right < WIDTH) context.fillRect(Math.max(span.left, span.right - front), span.top, Math.min(front, span.right - span.left), span.height);
      if (span.left > 0) context.fillRect(span.left, span.top, Math.min(front, span.right - span.left), span.height);
    }
  }

  // Text in the middle, only while everything is covered; it rises into place up to the cut
  const { cut, duration } = options;
  const shown = 1 - clamp01(Math.abs(time - cut) / Math.max(Math.min(cut, duration - cut) * options.textWindow, Number.EPSILON));
  if (shown <= 0) return;
  context.globalAlpha = shown;
  context.fillStyle = options.textColor;
  context.font = `${options.textWeight} ${options.textSize}px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2 + (time < cut ? (1 - shown) * options.textRise : 0));
  context.globalAlpha = 1;
}
