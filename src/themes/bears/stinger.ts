// Stinger of the Bärenbande theme: the chosen bear (or the tower) waddles in from the left, walks up to the camera and
// grows until its fur fills the whole picture at the transition point (cut), the text appears in the title font with the
// outline, then the bear steps back and waddles out to the right. Before and after transparent. Drawn from the character
// model (paint.ts). Pure function of time, so it can be rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeIn, easeInOut } from "../../core/easing.ts";
import type { BearId } from "./bears.ts";
import type { PoseName } from "./rig.ts";
import { drawHero, type Palette } from "./paint.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type BearsStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  bear: string; // a bear id or the tower
  text: string;
  font: string;
  waddle: number; // degrees
  cover: string; // the fur color that fills the picture
  palette: Palette;
};

// fixed: height of the walking bear, height at which its fur covers the picture, share of each phase that is walking
const WALK_HEIGHT = 560;
const COVER_HEIGHT = 5200;
const WALK_PART = 0.5;
const COVERED = 0.97;
const TURN = Math.PI * 2;
const STEPS_PER_SECOND = 3;
const POSES: Record<BearId, PoseName> = { eisbaer: "stand", grizzly: "wave", panda: "wave" };

// The bear at x with its height; it rocks from side to side around its feet while walking
function bearAt(context: CanvasRenderingContext2D, time: number, x: number, height: number, walking: number, options: BearsStingerOptions) {
  const baseY = HEIGHT / 2 + height * 0.5;
  context.save();
  context.translate(x, baseY);
  context.rotate((Math.sin(time * TURN * STEPS_PER_SECOND) * options.waddle * walking * Math.PI) / 180);
  drawHero(context, options.bear, POSES, 0, 0, height, options.palette);
  context.restore();
}

export function drawBearsStinger(context: CanvasRenderingContext2D, time: number, options: BearsStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  if (time <= 0 || time >= duration) return;
  // Coming: walk in, then grow toward the camera; going: shrink back, then walk out
  const coming = time <= cut;
  const part = coming ? clamp01(time / cut) : clamp01((time - cut) / (duration - cut));
  const walk = coming ? clamp01(part / WALK_PART) : clamp01((part - (1 - WALK_PART)) / WALK_PART);
  const zoom = coming ? easeIn(clamp01((part - WALK_PART) / (1 - WALK_PART))) : 1 - easeInOut(clamp01(part / (1 - WALK_PART)));
  const x = coming ? -WALK_HEIGHT + (WIDTH / 2 + WALK_HEIGHT) * easeInOut(walk) : WIDTH / 2 + (WIDTH / 2 + WALK_HEIGHT) * easeIn(walk);
  if (zoom >= COVERED) {
    context.fillStyle = options.cover;
    context.fillRect(0, 0, WIDTH, HEIGHT);
  } else bearAt(context, time, x, WALK_HEIGHT + (COVER_HEIGHT - WALK_HEIGHT) * zoom, 1 - zoom, options);

  // The text around the transition point
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  context.globalAlpha = shown;
  context.font = `800 150px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = options.palette.outlineWidth * 4;
  context.strokeStyle = options.palette.outline;
  context.fillStyle = options.palette.paper;
  const width = context.measureText(options.text).width;
  context.strokeText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
