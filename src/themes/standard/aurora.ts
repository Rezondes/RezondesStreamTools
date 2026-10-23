// Light fields and light dust of the standard theme as pure functions of seed, index and time (rule 21): where a
// field or a mote stands, how large and bright it is and which color between the two accents it has. The Pixi
// components only draw these values. Check: aurora.check.ts.
import { mixHex } from "../../core/color.ts";
import { hash } from "../../core/hash.ts";
import type { ScreenKind } from "../../core/screens/screens.ts";
import type { StandardValues } from "./settings.ts";

export type AuroraOptions = { seed: number; count: number; loop: number; accent: string; accent2: string; strength: number };
type AuroraField = { x: number; y: number; radius: number; alpha: number; color: string; share: number };
export type Mote = { x: number; y: number; size: number; alpha: number; color: string };

const WIDTH = 1920;
const HEIGHT = 1080;
const TURN = Math.PI * 2;

// Value from 0 to below 1 for one property of one field or mote
const pick = (seed: number, index: number, property: number) => hash(seed * 7919 + index * 104729 + property * 31);

// Centers of the fields as share of the stage, like the prototype (refs/starting.html), so they spread over the
// corners; the seed shifts each one a little, a fifth field starts over at the first slot
const SLOTS = [[0.22, 0.3], [0.78, 0.7], [0.69, 0.2], [0.32, 0.83]] as const;
const SHIFT = 0.16;

// Field on a closed orbit (a figure eight around its center), breathing slightly; even fields lean to the accent,
// odd ones to the second accent, so both colors always show
export function auroraField(options: AuroraOptions, index: number, time: number): AuroraField {
  const value = (property: number) => pick(options.seed, index, property);
  const [slotX, slotY] = SLOTS[index % SLOTS.length];
  const centerX = WIDTH * (slotX + (value(1) - 0.5) * SHIFT);
  const centerY = HEIGHT * (slotY + (value(2) - 0.5) * SHIFT);
  const angle = (time / options.loop + value(6)) * TURN;
  const breathe = 0.85 + 0.15 * Math.sin(angle * 3);
  const share = index % 2 ? 0.6 + 0.4 * value(7) : 0.4 * value(7);
  return {
    x: centerX + Math.cos(angle) * (160 + 100 * value(3)),
    y: centerY + Math.sin(angle * 2) * (80 + 60 * value(4)),
    radius: (420 + 200 * value(5)) * breathe,
    alpha: options.strength * breathe,
    color: mixHex(options.accent, options.accent2, share),
    share,
  };
}

// Options from the theme settings
export const auroraOptions = (values: StandardValues): AuroraOptions => ({
  seed: values.worldSeed, count: values.auroraFields, loop: values.blobSpeed, accent: values.accent, accent2: values.accent2, strength: values.auroraStrength,
});

// Share from 0 to 1 the fields and the dust have faded in after the scene opened
export const introShare = (seconds: number, introMs: number) => (introMs > 0 ? Math.min(1, (seconds * 1000) / introMs) : 1);

// Orbit time when the speed eases linearly from full to pace over ramp seconds: the integral of the speed, so a
// change of the pace moves the fields on smoothly instead of letting them jump
export function pacedTime(seconds: number, pace: number, ramp: number): number {
  const time = Math.max(0, seconds);
  const ramped = ramp > 0 ? Math.min(time, ramp) : 0;
  return ramped + ((pace - 1) * ramped * ramped) / (2 * Math.max(ramp, Number.EPSILON)) + (time - ramped) * pace;
}

// Brightness of a breathing scene: from full down to dim and back once per breath, starting bright; dim 1 = steady
export function breathLight(seconds: number, dim: number, breathe: number): number {
  if (breathe <= 0) return dim;
  return dim + (1 - dim) * (0.5 + 0.5 * Math.cos((seconds / breathe) * TURN));
}

// How far the fields have sunk in px when the Ending fades the world out
const SINK = 240;

// Drop and alpha of the fields after fadeAt seconds, eased over fadeMs; before that untouched
export function sinkAt(seconds: number, fadeAt: number, fadeMs: number): { drop: number; alpha: number } {
  const linear = fadeMs > 0 ? Math.min(1, Math.max(0, ((seconds - fadeAt) * 1000) / fadeMs)) : Number(seconds >= fadeAt);
  const eased = linear * linear * (3 - 2 * linear);
  return { drop: SINK * eased, alpha: 1 - eased };
}

type SceneTiming = { introMs: number; brbPace: number; brbDim: number; brbBreatheSeconds: number; endingFadeAt: number; endingFadeMs: number };

// Orbit time, alpha and drop of the light fields and the dust per screen: Starting plain, BRB slower and breathing,
// Ending sinking away; every screen fades in over introMs
export function sceneLight(kind: ScreenKind, seconds: number, timing: SceneTiming): { time: number; alpha: number; drop: number } {
  const shown = introShare(seconds, timing.introMs);
  if (kind === "brb") return { time: pacedTime(seconds, timing.brbPace, timing.introMs / 1000), alpha: shown * breathLight(seconds, timing.brbDim, timing.brbBreatheSeconds), drop: 0 };
  if (kind === "ending") {
    const sink = sinkAt(seconds, timing.endingFadeAt, timing.endingFadeMs);
    return { time: seconds, alpha: shown * sink.alpha, drop: sink.drop };
  }
  return { time: seconds, alpha: shown, drop: 0 };
}

// Seconds after which every mote is back at its start: rise, sway and glow all run a whole number of times in it
export const MOTE_PERIOD = 120;
const RISE_SPAN = HEIGHT + 100;

// Mote rising slowly from below the stage to above it, swaying sideways and glowing up and down on its own rhythm
export function moteAt(options: AuroraOptions, index: number, time: number): Mote {
  const value = (property: number) => pick(options.seed + 1, index, property);
  const phase = value(7) * TURN;
  const rises = 2 + Math.floor(value(3) * 3);
  const sways = 6 + Math.floor(value(4) * 4);
  const glows = 17 + Math.floor(value(6) * 35);
  const cycle = (count: number) => (time / MOTE_PERIOD) * count * TURN + phase;
  const risen = value(2) * RISE_SPAN - (time / MOTE_PERIOD) * rises * RISE_SPAN;
  return {
    x: value(1) * WIDTH + Math.sin(cycle(sways)) * (10 + 30 * value(5)),
    y: ((risen % RISE_SPAN) + RISE_SPAN) % RISE_SPAN - 50,
    size: 9 + value(8) * 21,
    alpha: 0.15 + 0.6 * Math.max(0, Math.sin(cycle(glows))),
    color: mixHex(options.accent, options.accent2, value(9)),
  };
}
