// Things drifting through the Plantage world, every position a pure function of seed, index and time (no running state):
// falling leaves that sway down and come back in at the top, and light motes that float and glitter. Periodic, so a
// still at any time shows the same as the live scene. Drawn by pixi/Drift.tsx. Check: drift.check.ts.
import { hash } from "../../core/hash.ts";

export type Leaf = { x: number; y: number; rotation: number; color: 0 | 1 };
export type Mote = { x: number; y: number; size: number; alpha: number };

// fixed: the leaves of the prototype (refs/starting.html) in stage px and px/s
const STAGE_WIDTH = 1920;
const FALL = { from: -40, height: 1160 };
const LEAF_SPEED = { min: 50, by: 50 };
const LEAF_SWAY = { size: 60, turns: 8, tilt: 1.2, spin: 10 };
const PHASE = 10;
// fixed: motes float in this band with these sizes; their frequencies are multiples of 0.1 per s, so they repeat
const MOTE_BAND = { top: 200, height: 700 };
const MOTE_SIZE = { min: 1.5, by: 3 };
const MOTE_FREQUENCY = { x: 0.4, y: 0.3, glitter: 1.3 };
export const MOTE_PERIOD = (2 * Math.PI) / 0.1;

const random = (seed: number, index: number, salt: number) => hash(seed * 7919 + index * 13 + salt);

// Seconds a leaf needs for one fall from the top to below the bottom edge
export const leafPeriod = (seed: number, index: number) => FALL.height / (LEAF_SPEED.min + random(seed, index, 1) * LEAF_SPEED.by);

export function leafAt(seed: number, index: number, seconds: number): Leaf {
  const phase = random(seed, index, 2) * PHASE;
  const share = (((seconds / leafPeriod(seed, index) + random(seed, index, 3)) % 1) + 1) % 1;
  return {
    x: random(seed, index, 0) * STAGE_WIDTH + Math.sin(share * LEAF_SWAY.turns + phase) * LEAF_SWAY.size,
    y: FALL.from + share * FALL.height,
    rotation: Math.sin(share * LEAF_SWAY.spin + phase) * LEAF_SWAY.tilt,
    color: random(seed, index, 4) > 0.5 ? 1 : 0,
  };
}

export function moteAt(seed: number, index: number, seconds: number): Mote {
  const phase = random(seed, index, 7) * 6;
  return {
    x: random(seed, index, 5) * STAGE_WIDTH + Math.sin(seconds * MOTE_FREQUENCY.x + phase) * 30,
    y: MOTE_BAND.top + random(seed, index, 6) * MOTE_BAND.height + Math.sin(seconds * MOTE_FREQUENCY.y + phase * 2) * 20,
    size: MOTE_SIZE.min + random(seed, index, 8) * MOTE_SIZE.by,
    alpha: 0.3 + 0.3 * Math.sin(seconds * MOTE_FREQUENCY.glitter + phase),
  };
}
