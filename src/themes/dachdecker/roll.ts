// Timing of the Dachdecker stinger without three.js (render.ts needs it in the entry chunk): where the roll of the
// blueprint is at a time, how thick it is and how much of the picture the sheet covers. stinger.ts builds the 3D scene
// from it. Check: stinger.check.ts.
// Size of the stinger in px; the frame rate is a setting (stingerFps)
export const STINGER_SIZE = { width: 1920, height: 1080 };

// duration and cut in s, hold as a share of each half, roll = full diameter of the roll in px
export type RollTiming = { duration: number; cut: number; hold: number; roll: number };
type RollState = { x: number; radius: number; phase: "out" | "up" };

// The roll keeps a core of this share of its full radius
const CORE = 0.35;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const inOut = (part: number) => (part < 0.5 ? 4 * part ** 3 : 1 - (-2 * part + 2) ** 3 / 2);

// Where the roll is at time: rolling out until the hold before the cut, rolling up after the hold behind it. x is the
// middle of the roll in px, the sheet lies left of it (out) or right of it (up). It thins while it gives paper.
export function rollAt(time: number, timing: RollTiming): RollState {
  const full = timing.roll / 2;
  const travel = (part: number) => -full + inOut(part) * (STINGER_SIZE.width + 2 * full);
  if (time <= timing.cut) {
    const part = clamp01(time / (timing.cut * (1 - timing.hold)));
    return { x: travel(part), radius: full * (CORE + (1 - CORE) * (1 - inOut(part))), phase: "out" };
  }
  const start = timing.cut + (timing.duration - timing.cut) * timing.hold;
  const part = clamp01((time - start) / (timing.duration - start));
  return { x: travel(part), radius: full * (CORE + (1 - CORE) * inOut(part)), phase: "up" };
}

// Share of the picture covered by the sheet at time
export function coverage(time: number, timing: RollTiming): number {
  const roll = rollAt(time, timing);
  return clamp01(roll.phase === "out" ? roll.x / STINGER_SIZE.width : 1 - roll.x / STINGER_SIZE.width);
}
