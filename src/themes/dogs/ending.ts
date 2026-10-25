// Schedule of the Ending of the Dogs theme (DESIGN-DOGS.md "Ending", prototype refs/px-ending.html): the dog walks in
// from the right to the basket, lies down and sleeps, "Z" rise from its head one after another, the lamp dims and the
// room darkens; the sounds of lying down, the lamp and the snoring. Pure functions of time, so stills with ?t= match.
// Check: ending.check.ts.
import { easeInOut } from "../../core/easing.ts";
import type { Point } from "./pixels.ts";

// fixed: the walk in takes 2.2 s from 8 pixels right of the world, the dog lies down at 2.8 s and sleeps from 4 s; it
// wags 10 times per s until it lies, then 2; a lying dog sinks 5 pixels into the basket
export const ENDING = { walk: 2.2, enter: 8, lie: 2.8, sleep: 4, wag: 10, lyingWag: 2, sink: 5 };
// fixed: three "Z" per cycle, each rising 34 pixels and drifting 16 left while it fades, starting 8 pixels above the head
const ZZZ = { count: 3, rise: 34, drift: 16, wobble: 2, wobbleRate: 9, fade: 2.5, start: [-6, 8] };
// fixed: the room darkens by up to 35 % of the dimmed light
export const DARKNESS = 0.35;
// fixed: the entrance of the sign layer in the GSAP timeline (s, stage px, eases); the stream numbers (scene stats)
// count up for 1 s from 0.3 s on
export const ENDING_INTRO = {
  title: { at: 0.2, duration: 0.7, y: -60, ease: "back.out(1.7)", fade: 0.3 },
  subtitle: { at: 0.8, duration: 0.5 },
  bye: { at: 1.2, duration: 0.5, ease: "back.out(2)" },
};
const COUNT = { from: 0.3, duration: 1 };

export type EndingTiming = { width: number; dogWidth: number; basketX: number; lampDim: number; lampDimFrom: number; lampDimTo: number; zzzEvery: number; snoreEvery: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const smooth = (share: number) => share * share * (3 - 2 * share);

// Where the dog is (left edge in world pixels, facing left) and what it does at time
export function endingDogAt(timing: EndingTiming, time: number): { x: number; mode: "walk" | "stand" | "lie"; wagSpeed: number; sink: number } {
  const bed = Math.round(timing.basketX - timing.dogWidth / 2);
  const start = timing.width + ENDING.enter;
  if (time < ENDING.walk) return { x: Math.round(start + (bed - start) * easeInOut(segment(time, 0, ENDING.walk))), mode: "walk", wagSpeed: ENDING.wag, sink: 0 };
  if (time < ENDING.lie) return { x: bed, mode: "stand", wagSpeed: ENDING.wag, sink: 0 };
  return { x: bed, mode: "lie", wagSpeed: ENDING.lyingWag, sink: ENDING.sink };
}

// The light of the lamp at time: 1 until lampDimFrom, then smoothly down to lampDim at lampDimTo
export const lightAt = (timing: EndingTiming, time: number) => 1 - (1 - timing.lampDim) * smooth(segment(time, timing.lampDimFrom, timing.lampDimTo));

// The "Z" rising from the head of the sleeping dog: their top left corners and alpha
export function zzzAt(timing: EndingTiming, time: number, head: Point): { x: number; y: number; alpha: number }[] {
  if (time <= ENDING.sleep) return [];
  const letters: { x: number; y: number; alpha: number }[] = [];
  for (let letter = 0; letter < ZZZ.count; letter++) {
    const raw = (time - ENDING.sleep) / timing.zzzEvery - letter / ZZZ.count;
    if (raw < 0) continue;
    const share = raw % 1;
    letters.push({
      x: Math.round(head[0] + ZZZ.start[0] - share * ZZZ.drift + Math.sin(share * ZZZ.wobbleRate) * ZZZ.wobble),
      y: Math.round(head[1] - ZZZ.start[1] - share * ZZZ.rise),
      alpha: Math.min(1, (1 - share) * ZZZ.fade),
    });
  }
  return letters;
}

export type EndingSound = { at: number; kind: "lie" | "lamp" | "snore" };

// The sounds due after from up to to: lying down, the lamp switching, the snoring every snoreEvery while asleep
export function endingSoundsBetween(timing: EndingTiming, from: number, to: number): EndingSound[] {
  const events: EndingSound[] = [{ at: ENDING.lie, kind: "lie" }, { at: timing.lampDimFrom, kind: "lamp" }];
  const every = Math.max(1, timing.snoreEvery);
  for (let snore = Math.max(0, Math.ceil((from - ENDING.sleep) / every)); ENDING.sleep + snore * every <= to; snore++) events.push({ at: ENDING.sleep + snore * every, kind: "snore" });
  return events.filter(event => event.at > from && event.at <= to).sort((first, second) => first.at - second.at);
}

// How far the numbers of the card have counted up at time (0 to 1)
export const countShare = (time: number) => smooth(segment(time, COUNT.from, COUNT.from + COUNT.duration));
