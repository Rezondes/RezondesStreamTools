// Confetti of the Chaos alert (refs/alert.html): small Rough.js scribbles thrown out of the note on a ballistic arc,
// turning, fading at the end of their life; every piece placed from seed, index and the time since the throw.
// Check: confetti.check.ts.
import { hash } from "../../core/hash.ts";
import { ROUGH_KINDS, type RoughKind } from "./roughScribbles.ts";

export type ConfettiColor = "color1" | "color2" | "color3" | "color4" | "white";
export type Piece = { x: number; y: number; rotation: number; alpha: number; kind: RoughKind; color: ConfettiColor };

// fixed: the throw of the prototype: speed px/s, angle range in degrees (up is -90), gravity px/s², spin, life and fade
const SPEED = { min: 700, by: 600 };
const ANGLE = { from: -170, by: 160 };
const GRAVITY = 1400;
const SPIN = 540;
export const CONFETTI_LIFE = 2.3;
const FADE = 0.4;
const STAGGER = 0.008;
const COLORS: readonly ConfettiColor[] = ["color1", "color2", "color4", "white"];

export function confettiAt(seed: number, index: number, seconds: number, origin: { x: number; y: number }): Piece {
  const random = (salt: number) => hash(seed * 7919 + index * 7 + salt);
  const kind = ROUGH_KINDS[Math.floor(random(0) * ROUGH_KINDS.length)];
  const color = COLORS[index % COLORS.length];
  const time = seconds - index * STAGGER;
  if (time < 0 || time > CONFETTI_LIFE) return { x: origin.x, y: origin.y, rotation: 0, alpha: 0, kind, color };
  const speed = SPEED.min + random(1) * SPEED.by;
  const angle = ((ANGLE.from + random(2) * ANGLE.by) * Math.PI) / 180;
  return {
    x: origin.x + Math.cos(angle) * speed * time,
    y: origin.y + Math.sin(angle) * speed * time + (GRAVITY * time * time) / 2,
    rotation: (random(3) - 0.5) * 2 * SPIN * (time / CONFETTI_LIFE),
    alpha: Math.min(1, (CONFETTI_LIFE - time) / FADE),
    kind,
    color,
  };
}
