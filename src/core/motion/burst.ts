// Bursts of particles (confetti, splashes, leaves, sparks) as a pure function of the time since the start (plans/
// PLAN-GRAFIK.md, package 8; rule 21): every particle follows from the seed and the time alone, so stingers and banners
// can render any frame. Start speed, exponential drag and gravity, the formula of the prototypes. Check: burst.check.ts.
import { hash } from "../hash.ts";

export type BurstOptions = {
  origin: { x: number; y: number };
  direction: number; // radians, 0 = right, -PI/2 = up
  spread: number; // full angle around the direction in radians
  speed: readonly [number, number]; // px/s from to
  gravity: number; // px/s², positive pulls down
  drag: number; // per second, 0 = none
  life: number; // s
};

export type BurstParticle = { x: number; y: number; angle: number; opacity: number };

// Share of the life at the end in which a particle fades out
const FADE = 0.3;
// Fastest spin in radians per second
const SPIN = 2 * Math.PI;
// Random values per particle: angle, speed, spin, start angle
const SALTS = 4;

// Distance factor of a speed after time with drag k: (1 - e^(-k t)) / k, plain t without drag
const travel = (time: number, drag: number) => (drag > 0 ? (1 - Math.exp(-drag * time)) / drag : time);

export function burstAt(seed: number, count: number, time: number, options: BurstOptions): BurstParticle[] {
  const { origin, direction, spread, speed, gravity, drag, life } = options;
  const moved = travel(time, drag);
  // Fall under gravity: plain g t² / 2 without drag, with drag g / k * (t - travel)
  const fall = drag > 0 ? (gravity / drag) * (time - moved) : (gravity * time * time) / 2;
  const visible = time >= 0 && time < life;
  const opacity = visible ? Math.min(1, (life - time) / (life * FADE)) : 0;
  return Array.from({ length: count }, (_, index) => {
    const random = (salt: number) => hash(seed * 7919 + index * SALTS + salt);
    const heading = direction + (random(0) - 0.5) * spread;
    const velocity = speed[0] + (speed[1] - speed[0]) * random(1);
    return {
      x: origin.x + Math.cos(heading) * velocity * moved,
      y: origin.y + Math.sin(heading) * velocity * moved + fall,
      angle: random(3) * 2 * Math.PI + (random(2) - 0.5) * 2 * SPIN * Math.max(0, time),
      opacity,
    };
  });
}
