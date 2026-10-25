// The stinger clip of the Dogs theme (DESIGN-DOGS.md "Stinger", prototype refs/px-stinger.html): a cream surface with a
// stepped, notched slanted edge sweeps in over a field of paw prints, the streamer's dog runs at double size just ahead
// of the edge, the red badge with the paw pops up at the cut with the name on it, then the surface sweeps out again.
// A pure function of time (rule 21): the world is painted into a PixelImage and drawn scaled (drawPixels).
// Check: stinger.check.ts.
import { hexNumber, mixHex } from "../../core/color.ts";
import { STAGE } from "../../core/screens/screens.ts";
import { drawPixels } from "./canvasImage.ts";
import { BREED_IDS, isBreed } from "./breeds.ts";
import { dogCache, type DogCache } from "./dog.ts";
import { dogLookOf } from "./looks.ts";
import { blankImage, setPixel, type PixelImage } from "./pixels.ts";
import { poseAt } from "./poses.ts";
import { roomRow } from "./room.ts";
import type { DogsValues } from "./settings.ts";
import { chanceOf, disc, fillRect, outlinedDisc } from "./world.ts";

export type StingerColors = { cover: string; edge: string; ink: string; accent: string; ball: string; muted: string; base: string; dark: string };
export type StingerLook = {
  duration: number; cut: number; sweep: number; spacing: number; slant: number; step: number; pixelScale: number;
  dog: DogCache | null; badge: boolean; text: string; font: string; colors: StingerColors; name: { size: number; below: number };
};

// The look of the stinger from the settings, with the name on the badge already filled in
export function stingerLookOf(values: DogsValues, text: string): StingerLook {
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const look = dogLookOf(values, breed, values.coat);
  return {
    duration: values.stingerDuration, cut: values.stingerCut, sweep: values.stingerSweep, spacing: values.stingerPawSpacing, slant: values.stingerSlant,
    step: values.stingerStep, pixelScale: values.pixelScale, dog: values.stingerDog ? dogCache(look) : null, badge: values.stingerBadge, text, font: values.stingerFont,
    name: { size: values.stingerNameSize, below: values.stingerNameBelow },
    colors: {
      cover: values.stingerCover, edge: values.stingerEdge, ink: values.stingerInk, accent: values.stingerAccent, ball: values.stingerBall, muted: values.stingerMuted,
      base: look.colors.base, dark: look.colors.dark,
    },
  };
}

// fixed: the timing and shapes of the prototype (world of 384 x 216): the surface starts 0.1 s late and leaves 0.2 s
// after the cut, paws come 0.04 s before it with a spread of 0.12 s, grow from 1.35 in 0.12 s and shrink in 0.24 s,
// 6 pixels of jitter; the edge has 3 pixels of ink, 2 of the edge color and is notched by 3 pixels on every other step
const SURFACE = { lead: 0.1, after: 0.2, margin: 12, notch: 3, ink: 3, rim: 2 };
const PAWS = { lead: 0.04, spread: 0.12, outAfter: 0.1, grow: 0.12, shrink: 0.24, big: 1.35, jitter: 6, rowShare: 0.866, gone: 0.15 };
const TOES = [[-7, -7], [-2.5, -11], [2.5, -11], [7, -7]] as const;
const PAW_SHAPE = { padX: 5, padY: 4, toeX: 2, toeY: 2.5, shadowDown: 2 };
// fixed: the paw colors and their weights; colors brighter than 85 % are too close to the surface
const WEIGHTS = { base: 0.3, dark: 0.14, accent: 0.24, ball: 0.18, muted: 0.14 };
const BRIGHT = 0.85;
const LUMA = [0.299, 0.587, 0.114] as const;
const SHADOW = 0.28;
// fixed: the runner on the ground row 176 at double size, 4 pixels ahead of the edge, walking at 20 frames per s; it
// comes out from behind the edge during the first 30 % of the sweep, so it runs in from outside the picture
const RUNNER = { ground: 176, ahead: 4, size: 2, fps: 20, wag: 20, enter: 0.3 };
// fixed: the badge: radius 38 at full size, 4 above the middle, a ring 5 inside, the paw on it; it grows from 0.42 s
// before the cut (to 0.1 s before) with an overshoot of 2.2 and shrinks from 0.12 s to 0.36 s after the cut
const BADGE = { radius: 38, above: 4, shadowDown: 3, ring: 5, inner: 7, grow: [0.42, 0.1], shrink: [0.12, 0.36], overshoot: 2.2, pad: [7, 6, 4], toes: [[-10, -13], [-4, -19], [4, -19], [10, -13]], toe: [2.5, 3], shown: 0.6, gone: 0.02 } as const;
// fixed: the name on the badge scales in tenths; its size and place are settings
const NAME = { tenths: 10 };

type Paw = { x: number; y: number; color: string; in: number; out: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const easeOut = (share: number) => 1 - (1 - share) ** 3;
const easeIn = (share: number) => share ** 3;
const backOut = (share: number, overshoot: number) => 1 + (overshoot + 1) * (share - 1) ** 3 + overshoot * (share - 1) ** 2;
// fixed: one color channel has 8 bits
const MAX_BYTE = 255;
const brightness = (hex: string) => {
  const value = hexNumber(hex);
  return (LUMA[0] * (value >> 16) + LUMA[1] * ((value >> 8) & MAX_BYTE) + LUMA[2] * (value & MAX_BYTE)) / MAX_BYTE;
};

// The paw colors with their weights, without the ones too close to the surface
function pawPalette(colors: StingerColors): [string, number][] {
  const palette = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key): [string, number] => [colors[key], WEIGHTS[key]]).filter(([color]) => brightness(color) < BRIGHT);
  return palette.length ? palette : [[colors.ink, 1]];
}

// The world of the stinger: its size, the span of the sweep, the x of the edge at row y for sweep position share
export function stingerWorld(look: StingerLook) {
  const width = Math.ceil(STAGE.width / look.pixelScale);
  const height = Math.ceil(STAGE.height / look.pixelScale);
  const span = width + look.slant * height + SURFACE.margin;
  const edgeX = (share: number, y: number) => {
    const band = Math.floor(y / look.step);
    return Math.round(share * span - look.slant * (height - band * look.step)) + (band % 2) * SURFACE.notch;
  };
  return { width, height, span, edgeX };
}

// Every paw of the field with its place, color and the times it comes and goes
export function stingerPaws(look: StingerLook): Paw[] {
  const { width, height, span } = stingerWorld(look);
  const palette = pawPalette(look.colors);
  const total = palette.reduce((sum, [, weight]) => sum + weight, 0);
  const pick = (chance: number) => {
    let reached = 0;
    for (const [color, weight] of palette) {
      reached += weight / total;
      if (chance < reached) return color;
    }
    return palette[0][0];
  };
  const paws: Paw[] = [];
  const rowStep = look.spacing * PAWS.rowShare;
  for (let row = -1; row * rowStep < height + look.spacing; row++) {
    for (let column = -1; column * look.spacing < width + look.spacing; column++) {
      const chance = (more: number) => chanceOf(column, row, more);
      const x = Math.round(column * look.spacing + (row % 2 ? look.spacing / 2 : 0) + (chance(1) - 0.5) * PAWS.jitter);
      const y = Math.round(row * rowStep + (chance(2) - 0.5) * PAWS.jitter);
      const share = clamp((x + look.slant * (height - y)) / span);
      const spread = (more: number) => (chance(more) - 0.5) * PAWS.spread;
      // No paw before the lead, so the first frame stays empty
      paws.push({ x, y, color: pick(chance(6)), in: Math.max(PAWS.lead, PAWS.lead + share * look.sweep + spread(3)), out: look.cut + PAWS.outAfter + share * look.sweep + spread(4) });
    }
  }
  return paws.sort((first, second) => first.in - second.in);
}

function paw(image: PixelImage, x: number, y: number, size: number, color: string, colors: StingerColors) {
  const radius = (value: number) => Math.max(1, Math.round(value * size));
  disc(image, x, y + PAW_SHAPE.shadowDown, radius(PAW_SHAPE.padX) + 1, radius(PAW_SHAPE.padY) + 1, mixHex(colors.cover, colors.ink, SHADOW));
  for (const [toeX, toeY] of TOES) outlinedDisc(image, x + toeX * size, y + toeY * size, radius(PAW_SHAPE.toeX), radius(PAW_SHAPE.toeY), color, colors.ink);
  outlinedDisc(image, x, y, radius(PAW_SHAPE.padX), radius(PAW_SHAPE.padY), color, colors.ink);
}

// The surface between the sweep positions out (negative: not leaving yet) and in, with ink and rim at its edges
function surface(image: PixelImage, look: StingerLook, out: number, into: number) {
  if (into <= out) return;
  const { edgeX } = stingerWorld(look);
  const { cover, ink, edge } = look.colors;
  for (let y = 0; y < image.height; y++) {
    const from = out < 0 ? -SURFACE.margin : edgeX(out, y);
    const to = edgeX(into, y);
    if (to <= from) continue;
    fillRect(image, from, y, to - from, 1, cover);
    fillRect(image, to, y, SURFACE.ink, 1, ink);
    fillRect(image, to - SURFACE.rim, y, SURFACE.rim, 1, edge);
    if (out < 0) continue;
    fillRect(image, from - SURFACE.ink, y, SURFACE.ink, 1, ink);
    fillRect(image, from, y, SURFACE.rim, 1, edge);
  }
}

function runner(image: PixelImage, look: StingerLook, share: number, time: number) {
  if (!look.dog) return;
  const { edgeX } = stingerWorld(look);
  const ground = roomRow(image.height, RUNNER.ground);
  const pose = look.dog.pose(poseAt({ time, mode: "walk", fps: RUNNER.fps, wagSpeed: RUNNER.wag, blinkEvery: 0, pant: true }));
  const behind = (1 - clamp(share / RUNNER.enter)) * pose.width * RUNNER.size;
  const left = Math.round(edgeX(share, ground - pose.height) + RUNNER.ahead - behind);
  const top = ground - pose.height * RUNNER.size;
  for (let y = 0; y < pose.height; y++) {
    for (let x = 0; x < pose.width; x++) {
      const color = pose.colors[y * pose.width + x];
      if (!color) continue;
      for (let down = 0; down < RUNNER.size; down++) for (let across = 0; across < RUNNER.size; across++) setPixel(image, left + x * RUNNER.size + across, top + y * RUNNER.size + down, color);
    }
  }
}

// The size of the badge at time (0 hidden, 1 full, above 1 while it overshoots)
export function badgeAt(look: StingerLook, time: number): number {
  if (!look.badge) return 0;
  const grow = segment(time, look.cut - BADGE.grow[0], look.cut - BADGE.grow[1]);
  const shrink = segment(time, look.cut + BADGE.shrink[0], look.cut + BADGE.shrink[1]);
  return grow > 0 && shrink < 1 ? backOut(grow, BADGE.overshoot) * (1 - easeIn(shrink)) : 0;
}

function badge(image: PixelImage, look: StingerLook, size: number) {
  if (size <= BADGE.gone) return;
  const { accent, cover, ink } = look.colors;
  const [centerX, centerY] = [image.width / 2, image.height / 2 - BADGE.above];
  const radius = Math.round(BADGE.radius * size);
  disc(image, centerX, centerY + BADGE.shadowDown, radius + 1, radius + 1, mixHex(cover, ink, SHADOW));
  outlinedDisc(image, centerX, centerY, radius, radius, accent, ink);
  if (size < BADGE.shown) return;
  outlinedDisc(image, centerX, centerY, radius - BADGE.ring, radius - BADGE.ring, cover, ink);
  disc(image, centerX, centerY, radius - BADGE.inner, radius - BADGE.inner, accent);
  disc(image, centerX, centerY - BADGE.pad[2] * size, Math.round(BADGE.pad[0] * size), Math.round(BADGE.pad[1] * size), cover);
  for (const [toeX, toeY] of BADGE.toes) disc(image, centerX + toeX * size, centerY + toeY * size, Math.round(BADGE.toe[0] * size), Math.round(BADGE.toe[1] * size), cover);
}

// The world of the stinger at time
export function stingerImage(look: StingerLook, paws: readonly Paw[], time: number): PixelImage {
  const { width, height } = stingerWorld(look);
  const image = blankImage(width, height);
  const into = (time - SURFACE.lead) / look.sweep;
  const out = time < look.cut ? -1 : (time - look.cut - SURFACE.after) / look.sweep;
  surface(image, look, out, into);
  for (const print of paws) {
    if (time < print.in) continue;
    let size = PAWS.big - (PAWS.big - 1) * easeOut(segment(time, print.in, print.in + PAWS.grow));
    if (time > print.out) {
      const gone = segment(time, print.out, print.out + PAWS.shrink);
      if (gone >= 1) continue;
      size *= 1 - easeIn(gone);
    }
    if (size > PAWS.gone) paw(image, print.x, print.y, size, print.color, look.colors);
  }
  runner(image, look, time < look.cut ? into : out, time);
  badge(image, look, badgeAt(look, time));
  return image;
}

// The clip: the world scaled onto the stage, the name on the badge once it is big enough
export function makeStinger(look: StingerLook) {
  const paws = stingerPaws(look);
  return (context: CanvasRenderingContext2D, time: number) => {
    context.clearRect(0, 0, STAGE.width, STAGE.height);
    drawPixels(context, stingerImage(look, paws, time), look.pixelScale);
    const size = badgeAt(look, time);
    if (size <= BADGE.shown || !look.text) return;
    context.save();
    context.translate(STAGE.width / 2, STAGE.height / 2);
    const scale = Math.round(size * NAME.tenths) / NAME.tenths;
    context.scale(scale, scale);
    context.font = `700 ${look.name.size}px "${look.font}"`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = look.colors.cover;
    context.fillText(look.text, 0, look.name.below);
    context.restore();
  };
}
