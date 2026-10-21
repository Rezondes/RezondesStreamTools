// Stinger of the Urlaub theme: a big wave with a foam crest rolls into the picture from the left, covers everything in
// sea colors at the transition point (cut), briefly shows the text and a palm and rolls out to the right again. Before and after
// transparent. Pure function of time, so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeInOut } from "../../core/easing.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type UrlaubStingerOptions = {
  duration: number; // Sekunden
  cut: number; // seconds, enter in OBS as transition point
  waves: number; // Wellenschichten
  foam: boolean;
  palm: boolean;
  text: string;
  font: string;
  sea: string;
  seaDeep: string;
  foamColor: string;
  textColor: string;
  palmColor: string;
};

// fixed: depth of the wave crest, distance of the layers, wavelength of the crest, width of the foam line
const CREST = 160;
const LAYER = 110;
const CREST_WAVE = 220;
const FOAM_WIDTH = 14;


// Wave crest at the right of the edge x: arcs to the right, phase shifts them over time
function crest(context: CanvasRenderingContext2D, x: number, phase: number) {
  context.beginPath();
  context.moveTo(x, 0);
  for (let y = 0; y <= HEIGHT; y += CREST_WAVE / 8) {
    context.lineTo(x + (CREST / 2) * (1 + Math.sin((y / CREST_WAVE) * Math.PI * 2 + phase)), y);
  }
  context.lineTo(x, HEIGHT);
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

export function drawUrlaubStinger(context: CanvasRenderingContext2D, time: number, options: UrlaubStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const enter = easeInOut(clamp01(time / (cut * 0.9)));
  const leave = easeInOut(clamp01((time - cut) / ((duration - cut) * 0.9)));
  // The front edge comes from the left until behind the right border, the back edge follows after the transition point
  const right = enter * (WIDTH + 2 * CREST) - CREST;
  const left = leave * (WIDTH + 2 * CREST) - CREST;
  if (right - left <= 0) return;
  const layers = Math.max(1, Math.round(options.waves));
  for (let layer = 0; layer < layers; layer++) {
    const shift = (layers - 1 - layer) * LAYER;
    context.fillStyle = layer === layers - 1 ? options.sea : options.seaDeep;
    context.globalAlpha = layer === layers - 1 ? 1 : 0.55 + (0.45 * layer) / layers;
    context.fillRect(left + shift, 0, right - left, HEIGHT);
    crest(context, right + shift, time * 6 + layer);
    context.fill();
  }
  context.globalAlpha = 1;
  if (options.foam) {
    context.strokeStyle = options.foamColor;
    context.lineWidth = FOAM_WIDTH;
    crest(context, right, time * 6 + layers - 1);
    context.stroke();
  }

  // Text and palm around the transition point, only on the covered area (otherwise they would stand over the transparent picture)
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  context.beginPath();
  context.rect(left, 0, right - left, HEIGHT);
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
