// Bone motion of the Bärenbande bears (PLAN-BEARS.md package 11): the moves of a figure as joint angles and a body
// transform over the time, pure functions of the seconds since a move began, so a GSAP timeline (and a still with ?t=)
// sets them on the bone groups of Bear.tsx around their pivots from the rig. Every move begins in the rest pose and ends
// in it after its length (landing only ends in it); looping moves pass the rest pose once per loop. The angles stay in
// BONE_LIMITS. Check: boneMotion.check.ts.

// Degrees; positive turns clockwise on the stage
export type BodyFrame = { x: number; y: number; rotate: number; scaleX: number; scaleY: number };
export type BoneFrame = { visible: boolean; body: BodyFrame; arm: number; head: number; eyes: number };

export const REST_BODY: BodyFrame = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
export const REST: BoneFrame = { visible: true, body: REST_BODY, arm: 0, head: 0, eyes: 1 };

// The bounds of the moves in degrees (arm and head around their pivots, body around the feet) and the body scale
export const BONE_LIMITS = { arm: [-40, 40], head: [-15, 15], body: [-20, 20], scale: [0.6, 1.4] } as const;

// fixed: a waddle step (s) and the bob of each step (px); the wave swing (degrees) and its loop (s); the head sway loop
// (s); how long the eyes stay shut (s); the landing: press down (s), settle (s), springs in the settle
const STEP = 0.2;
const BOB = 10;
const WAVE = { reach: -16, loop: 0.64 };
const SWAY_LOOP = 1.28;
const BLINK = 0.16;
const LAND = { press: 0.12, settle: 0.7, springs: 2 };
// How much wider the body gets against the press of the landing
const STRETCH = 0.8;

const clamp = (value: number, [low, high]: readonly [number, number]) => Math.min(high, Math.max(low, value));

// Waddling for steps half steps: rocking side to side and bobbing; at rest at the start and after the last step
export function waddleAt(seconds: number, angle: number, steps: number): BodyFrame {
  const time = Math.min(Math.max(0, seconds), steps * STEP);
  const swing = Math.sin((Math.PI * time) / STEP);
  return { ...REST_BODY, rotate: clamp(angle * swing, BONE_LIMITS.body), y: -BOB * Math.abs(swing) };
}
export const waddleLength = (steps: number) => steps * STEP;

// Landing: pressed flat (squash: share of the height), then springing back into the rest pose
export function landAt(seconds: number, squash: number): BodyFrame {
  const time = Math.max(0, seconds);
  let press: number;
  if (time < LAND.press) press = squash * Math.sin((Math.PI / 2) * (time / LAND.press));
  else {
    const settle = Math.min(1, (time - LAND.press) / LAND.settle);
    press = squash * (1 - settle) ** 2 * Math.cos(2 * Math.PI * LAND.springs * settle);
  }
  return { ...REST_BODY, scaleX: clamp(1 + press * STRETCH, BONE_LIMITS.scale), scaleY: clamp(1 - press, BONE_LIMITS.scale) };
}
export const LAND_LENGTH = LAND.press + LAND.settle;

// Waving: the near arm swings up and back in a loop, speed as a factor
export const waveAt = (seconds: number, speed: number) =>
  clamp((WAVE.reach * (1 - Math.cos((2 * Math.PI * Math.max(0, seconds) * speed) / WAVE.loop))) / 2, BONE_LIMITS.arm);
export const waveLoop = (speed: number) => WAVE.loop / speed;

// The head sways by degrees to both sides in a loop
export const swayAt = (seconds: number, degrees: number) => clamp(degrees * Math.sin((2 * Math.PI * Math.max(0, seconds)) / SWAY_LOOP), BONE_LIMITS.head);
export const SWAY_LOOP_SECONDS = SWAY_LOOP;

// Eyes: open (1) and shut (0.1) for a moment at the end of every interval of every seconds; never with 0
export function blinkAt(seconds: number, every: number): number {
  if (every <= 0) return 1;
  return Math.max(0, seconds) % every > every - BLINK ? 0.1 : 1;
}

// Breathing: the height grows by amount (share) and back once per breath (s)
export const breathAt = (seconds: number, amount: number, breath: number) =>
  1 + (amount * (1 - Math.cos((2 * Math.PI * Math.max(0, seconds)) / breath))) / 2;

export type StartingMotion = {
  waddleIn: boolean; waddleAngle: number; landSquash: number; waveSpeed: number; headSway: number;
  blinkEvery: number; breathe: boolean; breathAmount: number; breathSeconds: number;
};
// fixed: the bear comes in at 0.9 s from this far outside (px), waddling 7 half steps, lands at 2.4 s, waves from 2.9 s
export const ENTER = { from: 0.9, way: 520, steps: 7, land: 2.4, wave: 2.9 } as const;

// The Starting bear at seconds since the scene began: waddles in from the side (side -1 = from the left, 1 = from the
// right), lands, then waves and sways its head; blinks and breathes all along. Without waddleIn it stands and waves.
export function startingMotion(seconds: number, motion: StartingMotion, side: -1 | 1): BoneFrame {
  const breath = motion.breathe ? breathAt(seconds, motion.breathAmount, motion.breathSeconds) : 1;
  const eyes = blinkAt(seconds, motion.blinkEvery);
  if (!motion.waddleIn) {
    return { visible: true, body: { ...REST_BODY, scaleY: breath }, arm: waveAt(seconds, motion.waveSpeed), head: swayAt(seconds, motion.headSway), eyes };
  }
  if (seconds < ENTER.from) return { ...REST, visible: false };
  const walked = Math.min(1, (seconds - ENTER.from) / waddleLength(ENTER.steps));
  // Fast at first, slowing into the spot
  const x = side * ENTER.way * (1 - walked) ** 2;
  const body = seconds < ENTER.land ? waddleAt(seconds - ENTER.from, motion.waddleAngle, ENTER.steps) : landAt(seconds - ENTER.land, motion.landSquash);
  const waving = seconds - ENTER.wave;
  return {
    visible: true,
    body: { ...body, x, scaleY: body.scaleY * breath },
    arm: waving > 0 ? waveAt(waving, motion.waveSpeed) : 0,
    head: waving > 0 ? swayAt(waving, motion.headSway) : 0,
    eyes,
  };
}
