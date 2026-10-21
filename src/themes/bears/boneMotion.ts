// Bone motion of the Bärenbande bears (PLAN-BEARS.md package 11): the moves of a figure as joint angles and a body
// transform over the time, pure functions of the seconds since a move began, so a GSAP timeline (and a still with ?t=)
// sets them on the bone groups of Bear.tsx around their pivots from the rig. Every move begins in the rest pose and ends
// in it after its length (landing only ends in it); looping moves pass the rest pose once per loop. The angles stay in
// BONE_LIMITS. Check: boneMotion.check.ts.

// Degrees; positive turns clockwise on the stage. lift moves the near arm with its paw and prop up (negative) or down;
// flash: the light of a selfie flash from 0 to 1
export type BodyFrame = { x: number; y: number; rotate: number; scaleX: number; scaleY: number };
export type BoneFrame = { visible: boolean; body: BodyFrame; arm: number; lift: number; head: number; eyes: number; flash: number };

export const REST_BODY: BodyFrame = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
export const REST: BoneFrame = { visible: true, body: REST_BODY, arm: 0, lift: 0, head: 0, eyes: 1, flash: 0 };

// The bounds of the moves in degrees (arm and head around their pivots, body around the feet), the body scale and the
// lift of the arm in rig units
export const BONE_LIMITS = { arm: [-40, 40], head: [-15, 15], body: [-20, 20], scale: [0.6, 1.4], lift: [-12, 12] } as const;

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

// The loop of a scene pose after the entry, beginning in the rest pose: waving (head sways along), cooking (the pan
// swings), looking at the phone (the head nods), holding the sign (the arm bobs it), taking a selfie (the raised arm
// sways, the flash goes off); a pose without a move only blinks and breathes
export type Move = "wave" | "cook" | "phone" | "sign" | "selfie" | "still";
// fixed: the pan swing (degrees) and its loop (s), the phone nod (degrees) and its loop (s), the sign bob (rig units) and
// its loop (s), the selfie sway (degrees) and its loop (s), how long the flash shines (s)
const COOK = { swing: 7, loop: 0.9 };
const NOD = { reach: 6, loop: 1.6 };
const BOB_SIGN = { lift: -6, loop: 1.1 };
const SELFIE = { sway: 3, loop: 2.2 };
const FLASH = 0.25;

const swing = (seconds: number, loop: number) => Math.sin((2 * Math.PI * Math.max(0, seconds)) / loop);
const rise = (seconds: number, loop: number) => (1 - Math.cos((2 * Math.PI * Math.max(0, seconds)) / loop)) / 2;

// The flash of a selfie: bright at the end of every interval of every seconds, fading over FLASH; never with 0
export function flashAt(seconds: number, every: number): number {
  if (every <= 0) return 0;
  const since = (Math.max(0, seconds) % every) - (every - FLASH);
  return since > 0 ? 1 - since / FLASH : 0;
}

export type MoveSettings = { waveSpeed: number; headSway: number; flashEvery: number };
type Pose = Pick<BoneFrame, "arm" | "lift" | "head" | "flash">;
const STILL: Pose = { arm: 0, lift: 0, head: 0, flash: 0 };

export function moveAt(move: Move, seconds: number, settings: MoveSettings): Pose {
  switch (move) {
    case "wave": return { ...STILL, arm: waveAt(seconds, settings.waveSpeed), head: swayAt(seconds, settings.headSway) };
    case "cook": return { ...STILL, arm: clamp(COOK.swing * swing(seconds, COOK.loop), BONE_LIMITS.arm), head: swayAt(seconds, settings.headSway / 2) };
    case "phone": return { ...STILL, head: clamp(NOD.reach * rise(seconds, NOD.loop), BONE_LIMITS.head) };
    case "sign": return { ...STILL, lift: clamp(BOB_SIGN.lift * rise(seconds, BOB_SIGN.loop), BONE_LIMITS.lift), head: swayAt(seconds, settings.headSway) };
    case "selfie": return { ...STILL, arm: clamp(SELFIE.sway * swing(seconds, SELFIE.loop), BONE_LIMITS.arm), flash: flashAt(seconds, settings.flashEvery) };
    case "still": return STILL;
  }
}

export type SceneMotion = MoveSettings & {
  waddleIn: boolean; waddleAngle: number; landSquash: number; blinkEvery: number; breathe: boolean; breathAmount: number; breathSeconds: number;
};
// fixed: the bear comes in at 0.9 s from this far outside (px), waddling 7 half steps, lands at 2.4 s, moves from 2.9 s
export const ENTER = { from: 0.9, way: 520, steps: 7, land: 2.4, move: 2.9 } as const;

// The bear of a screen at seconds since the scene began: waddles in from the side (side -1 = from the left, 1 = from the
// right), lands, then plays its move; blinks and breathes all along. Without waddleIn it stands and moves from the start.
export function sceneMotion(seconds: number, move: Move, motion: SceneMotion, side: -1 | 1): BoneFrame {
  const breath = motion.breathe ? breathAt(seconds, motion.breathAmount, motion.breathSeconds) : 1;
  const eyes = blinkAt(seconds, motion.blinkEvery);
  if (!motion.waddleIn) return { visible: true, body: { ...REST_BODY, scaleY: breath }, ...moveAt(move, seconds, motion), eyes };
  if (seconds < ENTER.from) return { ...REST, visible: false };
  const walked = Math.min(1, (seconds - ENTER.from) / waddleLength(ENTER.steps));
  // Fast at first, slowing into the spot
  const x = side * ENTER.way * (1 - walked) ** 2;
  const body = seconds < ENTER.land ? waddleAt(seconds - ENTER.from, motion.waddleAngle, ENTER.steps) : landAt(seconds - ENTER.land, motion.landSquash);
  const moving = seconds - ENTER.move;
  return { visible: true, body: { ...body, x, scaleY: body.scaleY * breath }, ...(moving > 0 ? moveAt(move, moving, motion) : STILL), eyes };
}
