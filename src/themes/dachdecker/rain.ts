// Weather of the BRB scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Regen"): drops fall in a box around the roof,
// bounce off the roof faces (mirrored at the face, damped) and burst into splashes, smaller splashes on the ground;
// wind blows in gusts; lightning far behind the house. Everything steps by seconds, so the rain looks the same at any
// frame rate; randomness comes from the passed random function. The buffers are reused (thousands of drops per frame).
// Check: rain.check.ts.
import { hash } from "../../core/hash.ts";
import type { Point3 } from "../../core/three/beam.ts";
import { chance } from "../../core/three/chance.ts";
import { frameDepth, type FrameDims } from "./frame.ts";

export type Roof = { half: number; rise: number; reach: number; front: number; back: number };
export type RainBox = { x: number; zMin: number; zMax: number; top: number };

// Drops fall in this box around the roof (metres); new drops start a little above it
export const RAIN_BOX: RainBox = { x: 13, zMin: -16, zMax: 7, top: 14 };
const SPAWN_ABOVE = 4;
// Gables: the roof ends half a metre outside the first and last truss; drops hit the top of the tiles
const GABLE = 0.5;
const TILE_TOP = 0.26;
// Fall speed in m/s, wind in m/s per unit, gravity for bounced drops and splashes
export const FALL = { min: 19, max: 27 };
const WIND_SPEED = 1.2;
const GRAVITY = 21.6;
// A bounced drop keeps this share of its speed; splashes fly off with 2.4 to 6 m/s and live about half a second
export const DAMPING = 0.3;
const SPLASH_SPEED = { min: 2.4, max: 6 };
const SPLASH_SPREAD = 1.8;
const SPLASH_LIFE = 0.55;
const ROOF_SPLASH = 0.6;
const GROUND_SPLASH = 0.15;
const HIDDEN = -99;

export const roofOf = (dims: FrameDims): Roof => ({
  half: dims.span / 2, rise: dims.rise, reach: 1 + dims.overhang, front: GABLE, back: -frameDepth(dims) - GABLE,
});

// Height of the rafter line above the wall top at x: rise at the ridge, 0 above the wall, negative on the overhang
export const roofHeight = (roof: Roof, x: number) => roof.rise * (1 - Math.abs(x) / roof.half);
const covers = (roof: Roof, x: number, depth: number) => Math.abs(x) <= roof.half * roof.reach && depth <= roof.front && depth >= roof.back;
// Where drops meet the roof: on the tiles
export const roofSurface = (roof: Roof, x: number) => roofHeight(roof, x) + TILE_TOP;

export type Rain = {
  x: Float32Array; y: Float32Array; z: Float32Array; vx: Float32Array; vy: Float32Array; vz: Float32Array; bounced: Uint8Array;
  splash: { x: Float32Array; y: Float32Array; z: Float32Array; vx: Float32Array; vy: Float32Array; vz: Float32Array; life: Float32Array; next: number };
};
export type RainOptions = { roof: Roof | null; speed: number; wind: number; splashes: number; ground: boolean };

const between = (random: () => number, min: number, max: number) => min + (max - min) * random();

function spawn(rain: Rain, index: number, random: () => number, speed: number, anywhere: boolean, box: RainBox) {
  rain.x[index] = between(random, -box.x, box.x);
  rain.z[index] = between(random, box.zMin, box.zMax);
  rain.y[index] = anywhere ? between(random, 0, box.top) : box.top + between(random, 0, SPAWN_ABOVE);
  rain.vx[index] = 0;
  rain.vy[index] = -between(random, FALL.min, FALL.max) * speed;
  rain.vz[index] = 0;
  rain.bounced[index] = 0;
}

export function createRain(drops: number, splashes: number, random: () => number, speed = 1, box = RAIN_BOX): Rain {
  const buffer = (count: number) => new Float32Array(count);
  const rain: Rain = {
    x: buffer(drops), y: buffer(drops), z: buffer(drops), vx: buffer(drops), vy: buffer(drops), vz: buffer(drops), bounced: new Uint8Array(drops),
    splash: { x: buffer(splashes), y: buffer(splashes).fill(HIDDEN), z: buffer(splashes), vx: buffer(splashes), vy: buffer(splashes), vz: buffer(splashes), life: buffer(splashes), next: 0 },
  };
  for (let index = 0; index < drops; index++) spawn(rain, index, random, speed, true, box);
  return rain;
}

// Splashes fly off along the normal (nx, ny) of the surface they hit
function burst(rain: Rain, at: Point3, normal: readonly [number, number], count: number, random: () => number, wind: number) {
  const splash = rain.splash;
  if (splash.life.length === 0) return;
  for (let made = 0; made < count; made++) {
    const index = splash.next++ % splash.life.length;
    const up = between(random, SPLASH_SPEED.min, SPLASH_SPEED.max);
    [splash.x[index], splash.y[index], splash.z[index]] = at;
    splash.vx[index] = normal[0] * up * SPLASH_SPREAD + between(random, -SPLASH_SPEED.min, SPLASH_SPEED.min) / 2 + wind * WIND_SPEED / 2;
    splash.vy[index] = normal[1] * up + between(random, 0, SPLASH_SPEED.min);
    splash.vz[index] = between(random, -SPLASH_SPEED.min, SPLASH_SPEED.min);
    splash.life[index] = 1;
  }
}

export function stepRain(rain: Rain, dt: number, options: RainOptions, random: () => number, box = RAIN_BOX) {
  const { roof } = options;
  for (let index = 0; index < rain.x.length; index++) {
    const bounced = rain.bounced[index] === 1;
    if (bounced) rain.vy[index] -= GRAVITY * dt;
    else rain.vx[index] = options.wind * WIND_SPEED;
    rain.x[index] += rain.vx[index] * dt;
    rain.y[index] += rain.vy[index] * dt;
    rain.z[index] += rain.vz[index] * dt;
    // Wind carries drops out at one side, they come in at the other
    if (rain.x[index] > box.x) rain.x[index] -= 2 * box.x;
    else if (rain.x[index] < -box.x) rain.x[index] += 2 * box.x;
    const x = rain.x[index];
    const along = rain.z[index];
    if (roof && covers(roof, x, along) && rain.y[index] <= roofSurface(roof, x) && rain.vy[index] < 0) {
      if (bounced) { spawn(rain, index, random, options.speed, false, box); continue; }
      // Mirror at the face (its normal points up and outwards), damp, and put the drop back on the surface
      const side = Math.sign(x) || 1;
      const length = Math.hypot(roof.rise, roof.half);
      const nx = (side * roof.rise) / length;
      const ny = roof.half / length;
      const along = rain.vx[index] * nx + rain.vy[index] * ny;
      rain.vx[index] = (rain.vx[index] - 2 * along * nx) * DAMPING;
      rain.vy[index] = (rain.vy[index] - 2 * along * ny) * DAMPING;
      rain.y[index] = roofSurface(roof, x);
      rain.bounced[index] = 1;
      if (random() < ROOF_SPLASH) burst(rain, [x, rain.y[index], along], [nx, ny], options.splashes, random, options.wind);
    } else if (rain.y[index] <= 0) {
      if (options.ground && random() < GROUND_SPLASH) burst(rain, [x, 0, along], [0, 1], Math.max(1, options.splashes - 1), random, options.wind);
      spawn(rain, index, random, options.speed, false, box);
    }
  }
  const splash = rain.splash;
  for (let index = 0; index < splash.life.length; index++) {
    if (splash.life[index] <= 0) continue;
    splash.vy[index] -= GRAVITY * dt;
    splash.x[index] += splash.vx[index] * dt;
    splash.y[index] += splash.vy[index] * dt;
    splash.z[index] += splash.vz[index] * dt;
    splash.life[index] -= dt / SPLASH_LIFE;
    if (splash.life[index] <= 0 || splash.y[index] < 0) { splash.life[index] = 0; splash.y[index] = HIDDEN; }
  }
}

// Wind in gusts: between -1 and max, a new target every `every` seconds, smooth in between
export function gust(time: number, every: number, max: number, seed: number) {
  const step = Math.floor(time / every);
  const part = time / every - step;
  const target = (index: number) => -1 + (max + 1) * hash(seed * 977 + index);
  const smooth = (1 - Math.cos(part * Math.PI)) / 2;
  return target(step) + (target(step + 1) - target(step)) * smooth;
}

// Lightning: the first bolt after a moment, then one every `every` seconds; null before the first
const FIRST_BOLT = 2.5;
export function boltAt(time: number, every: number): { index: number; age: number } | null {
  if (time < FIRST_BOLT) return null;
  const index = Math.floor((time - FIRST_BOLT) / every);
  return { index, age: time - FIRST_BOLT - index * every };
}

// Light of a bolt over its age: a bright flash, a short dip, a second flash, then it fades within a second
export function flashLevel(age: number) {
  if (age < 0) return 0;
  if (age < 0.04) return 1;
  if (age < 0.12) return 0.2;
  if (age < 0.16) return 0.75;
  return Math.max(0, 0.75 * (1 - (age - 0.16) / 1));
}

// A zigzag line from high in the sky down to near the horizon, far behind the house
export function boltPoints(seed: number, index: number): Point3[] {
  const random = chance(seed * 131 + index);
  const points: Point3[] = [];
  let x = random.between(-18, 18);
  const far = random.between(-34, -26);
  for (let y = 24; y > 2; y -= random.between(1.2, 2.6)) {
    points.push([x, y, far]);
    x += random.between(-1.6, 1.6);
  }
  return points;
}
