// Light fields and light dust of the standard theme as pure functions of seed, index and time (rule 21): where a
// field or a mote stands, how large and bright it is and which color between the two accents it has. The Pixi
// components only draw these values. Check: aurora.check.ts.
import { mixHex } from "../../core/color.ts";
import { hash } from "../../core/hash.ts";
import type { ScreenKind } from "../../core/screens/screens.ts";
import type { StandardValues } from "./settings.ts";

// How the motes of the light dust look and move (settings): colors, rises, sways and glows per MOTE_PERIOD (least
// plus a random part), the sway and size in px, the opacity, the bright core of their texture
export type MoteLook = {
  accent: string; accent2: string; rises: number; risesSpread: number; sways: number; swaysSpread: number; glows: number; glowsSpread: number;
  sway: number; swaySpread: number; size: number; sizeSpread: number; glowMin: number; glowRange: number; core: number; coreAlpha: number;
};
// The light fields (settings): their centers as shares of the stage, how far the seed shifts them, the orbit and the
// radius in px (least plus a random part), how much they breathe, the bright core of their texture; plus the dust
export type AuroraOptions = {
  seed: number; count: number; loop: number; accent: string; accent2: string; strength: number; slots: readonly (readonly [number, number])[];
  shift: number; orbitX: number; orbitXSpread: number; orbitY: number; orbitYSpread: number; radius: number; radiusSpread: number;
  breathe: number; core: number; coreAlpha: number; mote: MoteLook;
};
type AuroraField = { x: number; y: number; radius: number; alpha: number; color: string; share: number };
export type Mote = { x: number; y: number; size: number; alpha: number; color: string };

const WIDTH = 1920;
const HEIGHT = 1080;
const TURN = Math.PI * 2;

// Value from 0 to below 1 for one property of one field or mote
const pick = (seed: number, index: number, property: number) => hash(seed * 7919 + index * 104729 + property * 31);

// Field on a closed orbit (a figure eight around its center), breathing slightly; even fields lean to the accent,
// odd ones to the second accent, so both colors always show
export function auroraField(options: AuroraOptions, index: number, time: number): AuroraField {
  const value = (property: number) => pick(options.seed, index, property);
  // the seed shifts each center a little, a fifth field starts over at the first slot
  const [slotX, slotY] = options.slots[index % options.slots.length];
  const centerX = WIDTH * (slotX + (value(1) - 0.5) * options.shift);
  const centerY = HEIGHT * (slotY + (value(2) - 0.5) * options.shift);
  const angle = (time / options.loop + value(6)) * TURN;
  const breathe = 1 - options.breathe + options.breathe * Math.sin(angle * 3);
  const share = index % 2 ? 0.6 + 0.4 * value(7) : 0.4 * value(7);
  return {
    x: centerX + Math.cos(angle) * (options.orbitX + options.orbitXSpread * value(3)),
    y: centerY + Math.sin(angle * 2) * (options.orbitY + options.orbitYSpread * value(4)),
    radius: (options.radius + options.radiusSpread * value(5)) * breathe,
    alpha: options.strength * breathe,
    color: mixHex(options.accent, options.accent2, share),
    share,
  };
}

// Options from the theme settings
export const auroraOptions = (values: StandardValues): AuroraOptions => ({
  seed: values.worldSeed, count: values.auroraFields, loop: values.blobSpeed, accent: values.auroraColor, accent2: values.auroraColor2, strength: values.auroraStrength,
  slots: [[values.auroraSlot1X, values.auroraSlot1Y], [values.auroraSlot2X, values.auroraSlot2Y], [values.auroraSlot3X, values.auroraSlot3Y], [values.auroraSlot4X, values.auroraSlot4Y]],
  shift: values.auroraShift, orbitX: values.auroraOrbitX, orbitXSpread: values.auroraOrbitXSpread, orbitY: values.auroraOrbitY, orbitYSpread: values.auroraOrbitYSpread,
  radius: values.auroraRadius, radiusSpread: values.auroraRadiusSpread, breathe: values.auroraBreathe, core: values.auroraCore, coreAlpha: values.auroraCoreAlpha,
  mote: {
    accent: values.dustColor, accent2: values.dustColor2, rises: values.dustRises, risesSpread: values.dustRisesSpread, sways: values.dustSways, swaysSpread: values.dustSwaysSpread,
    glows: values.dustGlows, glowsSpread: values.dustGlowsSpread, sway: values.dustSway, swaySpread: values.dustSwaySpread, size: values.dustSize, sizeSpread: values.dustSizeSpread,
    glowMin: values.dustGlowMin, glowRange: values.dustGlowRange, core: values.dustCore, coreAlpha: values.dustCoreAlpha,
  },
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

// Drop and alpha of the fields after fadeAt seconds, eased over fadeMs; before that untouched; sink: how far the
// fields have sunk in px at the end
export function sinkAt(seconds: number, fadeAt: number, fadeMs: number, sink: number): { drop: number; alpha: number } {
  const linear = fadeMs > 0 ? Math.min(1, Math.max(0, ((seconds - fadeAt) * 1000) / fadeMs)) : Number(seconds >= fadeAt);
  const eased = linear * linear * (3 - 2 * linear);
  return { drop: sink * eased, alpha: 1 - eased };
}

type SceneTiming = { introMs: number; brbPace: number; brbDim: number; brbBreatheSeconds: number; endingFadeAt: number; endingFadeMs: number; endingSink: number };

// Orbit time, alpha and drop of the light fields and the dust per screen: Starting plain, BRB slower and breathing,
// Ending sinking away; every screen fades in over introMs
export function sceneLight(kind: ScreenKind, seconds: number, timing: SceneTiming): { time: number; alpha: number; drop: number } {
  const shown = introShare(seconds, timing.introMs);
  if (kind === "brb") return { time: pacedTime(seconds, timing.brbPace, timing.introMs / 1000), alpha: shown * breathLight(seconds, timing.brbDim, timing.brbBreatheSeconds), drop: 0 };
  if (kind === "ending") {
    const sink = sinkAt(seconds, timing.endingFadeAt, timing.endingFadeMs, timing.endingSink);
    return { time: seconds, alpha: shown * sink.alpha, drop: sink.drop };
  }
  return { time: seconds, alpha: shown, drop: 0 };
}

// Seconds after which every mote is back at its start: rise, sway and glow all run a whole number of times in it
export const MOTE_PERIOD = 120;
const RISE_SPAN = HEIGHT + 100;

// Mote rising slowly from below the stage to above it, swaying sideways and glowing up and down on its own rhythm;
// whole numbers of rises, sways and glows, so every mote is back at its start after MOTE_PERIOD
export function moteAt(options: AuroraOptions, index: number, time: number): Mote {
  const look = options.mote;
  const value = (property: number) => pick(options.seed + 1, index, property);
  const phase = value(7) * TURN;
  const whole = (least: number, spread: number, property: number) => Math.round(least) + Math.floor(value(property) * Math.round(spread));
  const rises = whole(look.rises, look.risesSpread, 3);
  const sways = whole(look.sways, look.swaysSpread, 4);
  const glows = whole(look.glows, look.glowsSpread, 6);
  const cycle = (count: number) => (time / MOTE_PERIOD) * count * TURN + phase;
  const risen = value(2) * RISE_SPAN - (time / MOTE_PERIOD) * rises * RISE_SPAN;
  return {
    x: value(1) * WIDTH + Math.sin(cycle(sways)) * (look.sway + look.swaySpread * value(5)),
    y: ((risen % RISE_SPAN) + RISE_SPAN) % RISE_SPAN - 50,
    size: look.size + value(8) * look.sizeSpread,
    alpha: look.glowMin + look.glowRange * Math.max(0, Math.sin(cycle(glows))),
    color: mixHex(look.accent, look.accent2, value(9)),
  };
}
