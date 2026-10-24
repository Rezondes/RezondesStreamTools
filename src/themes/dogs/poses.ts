// Poses of the Dogs theme (DESIGN-DOGS.md "Posen"): time picks a discrete state (frame of the walk cycle, wag stage of
// the tail, blink, mouth), so every pose can be painted once and reused (dog.ts). Pure function of its input.
// Check: poses.check.ts.

export const MODES = ["stand", "walk", "bark", "lie"] as const;
export type PoseMode = (typeof MODES)[number];
export type Mouth = "open" | "pant" | "";
export type PoseState = { mode: PoseMode; frame: number; tail: number; blink: boolean; mouth: Mouth };
// time in s; fps: frames of the walk per s; wagSpeed: wag in radians per s; blinkEvery: s between blinks (0 = never);
// pant: the tongue shows while walking and every other third of a second while standing
export type PoseInput = { time: number; mode: PoseMode; fps: number; wagSpeed: number; blinkEvery: number; pant: boolean };

// fixed: the walk cycle of the prototype, per frame the foot offset and lift of a leg (diagonal pairs a half cycle apart)
export const LEG_CYCLE: readonly (readonly [number, number])[] = [[2, 0], [1, 0], [0, 0], [-1, 0], [-2, 0], [0, 2]];
// fixed: five wag stages; lying dogs wag slowly and little; a blink lasts 0.15 s; barking opens the jaw 6 times per s,
// panting 3 times per s
const TAIL_STAGES = 5;
const LIE_WAG = { speed: 2, amount: 0.3 };
const BLINK_SECONDS = 0.15;
const RATE = { bark: 6, pant: 3 };

export function poseAt({ time, mode, fps, wagSpeed, blinkEvery, pant }: PoseInput): PoseState {
  const lying = mode === "lie";
  const wag = lying ? Math.sin(time * LIE_WAG.speed) * LIE_WAG.amount : Math.sin(time * wagSpeed);
  const half = (TAIL_STAGES - 1) / 2;
  const tail = Math.max(0, Math.min(TAIL_STAGES - 1, Math.round((wag + 1) * half)));
  const frame = mode === "walk" ? Math.floor(time * fps) % LEG_CYCLE.length : 0;
  const blink = lying || (blinkEvery > 0 && time % blinkEvery < BLINK_SECONDS);
  let mouth: Mouth = "";
  if (mode === "bark" && Math.floor(time * RATE.bark) % 2 === 0) mouth = "open";
  else if (!lying && pant && (mode !== "stand" || Math.floor(time * RATE.pant) % 2 === 0)) mouth = "pant";
  return { mode, frame, tail, blink, mouth };
}

// Equal states give equal keys (the key of the pose cache)
export const poseKey = (state: PoseState) => `${state.mode}|${state.frame}|${state.tail}|${state.blink ? 1 : 0}|${state.mouth}`;
