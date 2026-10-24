// The walk of the BRB scene of the Dogs theme (DESIGN-DOGS.md "BRB", prototype refs/px-brb.html): the distance as a
// closed function of time with walking, braking, sniffing and starting again in every period, so stills with ?t= match;
// the steps from the distance; the leash as an arc from the collar out of the picture at the top right.
// Check: walk.check.ts.
import type { Point } from "./pixels.ts";

// period: s of one round (walk, brake, sniff, start); sniff: s standing; pxPerSecond: walking speed
export type WalkTiming = { period: number; sniff: number; pxPerSecond: number };

// fixed: braking and starting again take 0.5 s each and cover half the way of walking that long; the sniff shows from
// 0.4 s into the braking until 0.1 s into the start
const BRAKE = 0.5;
const SNIFF_EDGE = { from: 0.4, to: 0.1 };

const walkSeconds = (timing: WalkTiming) => Math.max(0, timing.period - timing.sniff - 2 * BRAKE);

// Way in pixels after time s: never falling, steady, the same in every period
export function walkDistance(time: number, timing: WalkTiming): number {
  const walk = walkSeconds(timing);
  const period = walk + 2 * BRAKE + timing.sniff;
  const round = Math.floor(time / period);
  const into = time - round * period;
  const perRound = walk + BRAKE;
  let way: number;
  if (into < walk) way = into;
  else if (into < walk + BRAKE) {
    const braking = into - walk;
    way = walk + braking - braking * braking;
  } else if (into < walk + BRAKE + timing.sniff) way = walk + BRAKE / 2;
  else {
    const starting = into - walk - BRAKE - timing.sniff;
    way = walk + BRAKE / 2 + starting * starting;
  }
  return (round * perRound + way) * timing.pxPerSecond;
}

// Whether the dog stands and sniffs at time
export function sniffing(time: number, timing: WalkTiming): boolean {
  const walk = walkSeconds(timing);
  const period = walk + 2 * BRAKE + timing.sniff;
  const into = time % period;
  return into > walk + SNIFF_EDGE.from && into < walk + BRAKE + timing.sniff + SNIFF_EDGE.to;
}

// The start of the sniff in the period that time falls in (for the speech bubble and the sound)
export function sniffStart(time: number, timing: WalkTiming): number {
  const walk = walkSeconds(timing);
  const period = walk + 2 * BRAKE + timing.sniff;
  return Math.floor(time / period) * period + walk + SNIFF_EDGE.from;
}

// The steps after time: the way divided by the length of a step
export const stepsAt = (time: number, timing: WalkTiming, stepPx: number) => Math.floor(walkDistance(time, timing) / Math.max(1, stepPx));

// The leash from the collar to the walker: one point per pixel of its length, sagging by sag in the middle
export function leashPoints(from: Point, to: Point, sag: number): Point[] {
  const length = Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]));
  return Array.from({ length: length + 1 }, (_, step): Point => {
    const share = length ? step / length : 0;
    return [Math.round(from[0] + (to[0] - from[0]) * share), Math.round(from[1] + (to[1] - from[1]) * share + Math.sin(share * Math.PI) * sag)];
  });
}

// fixed: the speech bubble springs in 0.2 to 0.7 s after the sniff began and shrinks away in its last 0.4 to 0.1 s
const BUBBLE = { growFrom: 0.2, growTo: 0.7, shrinkFrom: 0.4, shrinkTo: 0.1 };
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const elasticOut = (share: number) => (share <= 0 || share >= 1 ? share : 2 ** (-10 * share) * Math.sin((share * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
const smooth = (share: number) => share * share * (3 - 2 * share);

// The size of the "Schnüff!" bubble at time (0 = hidden)
export function sniffBubbleAt(time: number, timing: WalkTiming): number {
  const start = sniffStart(time, timing);
  const end = start + timing.sniff + BRAKE / 2;
  return elasticOut(segment(time, start + BUBBLE.growFrom, start + BUBBLE.growTo)) * (1 - smooth(segment(time, end - BUBBLE.shrinkFrom, end - BUBBLE.shrinkTo)));
}

export type WalkSound = { at: number; kind: "sniff" | "steps" };

// The sounds due after from up to to: the sniff at the start of each stop, the steps whenever the dog walks off
export function walkSoundsBetween(timing: WalkTiming, from: number, to: number): WalkSound[] {
  const walk = walkSeconds(timing);
  const period = walk + 2 * BRAKE + timing.sniff;
  const events: WalkSound[] = [];
  for (let round = Math.max(0, Math.floor(from / period)); round * period <= to; round++) {
    events.push({ at: round * period, kind: "steps" }, { at: round * period + walk + SNIFF_EDGE.from, kind: "sniff" });
  }
  return events.filter(event => event.at > from && event.at <= to);
}
