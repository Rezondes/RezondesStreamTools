// Fireworks of the Ending scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Abend"): bursts of glowing sparks over the
// roof, one every `every` seconds after the start (a little early or late), each in one of four tones. Pure in the
// time: the same seed and time give the same sparks, so still images and clips show the same picture. Check:
// fireworks.check.ts.
import { hash } from "../../core/hash.ts";
import { chance } from "../../core/three/chance.ts";

export type Burst = { points: Float32Array; life: number; tone: number };

// A burst lives 2.2 s; sparks fly off with 3.6 to 6.6 m/s, slow down in the air and fall
export const BURST_LIFE = 2.2;
const SPEED = { min: 3.6, max: 6.6 };
const DRAG = 0.9;
const GRAVITY = 5.8;
const ORIGIN = { x: [-6, 6], y: [9, 12.5], z: [-8, -2] } as const;
const JITTER = 0.3;
export const TONES = 4;

function sparks(seed: number, index: number, age: number, count: number): Float32Array {
  const random = chance(seed * 389 + index);
  const origin = [random.between(...ORIGIN.x), random.between(...ORIGIN.y), random.between(...ORIGIN.z)];
  const travel = (1 - Math.exp(-DRAG * age)) / DRAG;
  const fall = (GRAVITY * age * age) / 2;
  const points = new Float32Array(count * 3);
  for (let spark = 0; spark < count; spark++) {
    // A direction on the sphere and a speed
    const up = random.between(-1, 1);
    const around = random.between(0, Math.PI * 2);
    const ring = Math.sqrt(1 - up * up);
    const speed = random.between(SPEED.min, SPEED.max);
    points[spark * 3] = origin[0] + ring * Math.cos(around) * speed * travel;
    points[spark * 3 + 1] = origin[1] + up * speed * travel - fall;
    points[spark * 3 + 2] = origin[2] + ring * Math.sin(around) * speed * travel;
  }
  return points;
}

// All bursts alive at time: the k-th starts at start + k * every, shifted by up to 30 % of every
export function bursts(seed: number, time: number, start: number, every: number, count: number): Burst[] {
  if (time < start - every) return [];
  const startOf = (index: number) => start + index * every + (hash(seed * 61 + index) - 0.5) * every * JITTER * 2;
  const last = Math.floor((time - start) / every) + 1;
  const alive: Burst[] = [];
  for (let index = Math.max(0, last - Math.ceil(BURST_LIFE / every) - 1); index <= last; index++) {
    const age = time - startOf(index);
    if (age < 0 || age >= BURST_LIFE) continue;
    const part = age / BURST_LIFE;
    alive.push({ points: sparks(seed, index, age, count), life: 1 - part * part, tone: Math.floor(hash(seed * 17 + index) * TONES) });
  }
  return alive;
}
