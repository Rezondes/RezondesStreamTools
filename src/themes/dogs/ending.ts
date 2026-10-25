// Schedule of the Ending of the Dogs theme (DESIGN-DOGS.md "Ending", prototype refs/px-ending.html): the dog walks in
// from the right to the basket, lies down and sleeps, "Z" rise from its head one after another, the lamp dims and the
// room darkens; the sounds of lying down, the lamp and the snoring. Pure functions of time, so stills with ?t= match.
// Check: ending.check.ts.
import { easeInOut } from "../../core/easing.ts";
import type { Point } from "./pixels.ts";

import type { DogsValues } from "./settings.ts";

// fixed: three "Z" per cycle that wobble 2 pixels 9 times per cycle, starting 8 pixels above the head; how far they rise,
// drift and how fast they fade are settings
const ZZZ = { count: 3, wobble: 2, wobbleRate: 9, start: [-6, 8] };
// fixed: the stream numbers (scene stats) count up for 1 s from 0.3 s on
const COUNT = { from: 0.3, duration: 1 };
// fixed: the lamp setting is in percent
const PERCENT = 100;

// The timing of the settings: the walk in takes walk s from enter pixels right of the world, the dog lies down at lie
// and sleeps from sleep; it wags wag times per s until it lies, then lyingWag; a lying dog sinks sink pixels into the
// basket; the "Z" rise zzzRise and drift zzzDrift pixels; the room darkens by up to darkness of the dimmed light
export type EndingTiming = {
  width: number; dogWidth: number; basketX: number; lampDim: number; lampDimFrom: number; lampDimTo: number; zzzEvery: number; snoreEvery: number;
  walk: number; enter: number; lie: number; sleep: number; wag: number; lyingWag: number; sink: number; zzzRise: number; zzzDrift: number; zzzFade: number;
  darkness: number;
};

// width: of the world in pixels, dogWidth: of the sleeping dog, basketX: the middle of the basket
export const endingTimingOf = (values: DogsValues, width: number, dogWidth: number, basketX: number): EndingTiming => ({
  width, dogWidth, basketX, lampDim: values.lampDim / PERCENT, lampDimFrom: values.lampDimFrom, lampDimTo: values.lampDimTo, zzzEvery: values.zzzEvery,
  snoreEvery: values.snoreEvery, walk: values.endingWalk, enter: values.endingEnter, lie: values.endingLie, sleep: values.endingSleep, wag: values.endingWag,
  lyingWag: values.endingLyingWag, sink: values.endingSink, zzzRise: values.zzzRise, zzzDrift: values.zzzDrift, zzzFade: values.zzzFade, darkness: values.endingDarkness,
});

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const smooth = (share: number) => share * share * (3 - 2 * share);

// Where the dog is (left edge in world pixels, facing left) and what it does at time
export function endingDogAt(timing: EndingTiming, time: number): { x: number; mode: "walk" | "stand" | "lie"; wagSpeed: number; sink: number } {
  const bed = Math.round(timing.basketX - timing.dogWidth / 2);
  const start = timing.width + timing.enter;
  if (time < timing.walk) return { x: Math.round(start + (bed - start) * easeInOut(segment(time, 0, timing.walk))), mode: "walk", wagSpeed: timing.wag, sink: 0 };
  if (time < timing.lie) return { x: bed, mode: "stand", wagSpeed: timing.wag, sink: 0 };
  return { x: bed, mode: "lie", wagSpeed: timing.lyingWag, sink: timing.sink };
}

// The light of the lamp at time: 1 until lampDimFrom, then smoothly down to lampDim at lampDimTo
export const lightAt = (timing: EndingTiming, time: number) => 1 - (1 - timing.lampDim) * smooth(segment(time, timing.lampDimFrom, timing.lampDimTo));

// The "Z" rising from the head of the sleeping dog: their top left corners and alpha
export function zzzAt(timing: EndingTiming, time: number, head: Point): { x: number; y: number; alpha: number }[] {
  if (time <= timing.sleep) return [];
  const letters: { x: number; y: number; alpha: number }[] = [];
  for (let letter = 0; letter < ZZZ.count; letter++) {
    const raw = (time - timing.sleep) / timing.zzzEvery - letter / ZZZ.count;
    if (raw < 0) continue;
    const share = raw % 1;
    letters.push({
      x: Math.round(head[0] + ZZZ.start[0] - share * timing.zzzDrift + Math.sin(share * ZZZ.wobbleRate) * ZZZ.wobble),
      y: Math.round(head[1] - ZZZ.start[1] - share * timing.zzzRise),
      alpha: Math.min(1, (1 - share) * timing.zzzFade),
    });
  }
  return letters;
}

export type EndingSound = { at: number; kind: "lie" | "lamp" | "snore" };

// The sounds due after from up to to: lying down, the lamp switching, the snoring every snoreEvery while asleep
export function endingSoundsBetween(timing: EndingTiming, from: number, to: number): EndingSound[] {
  const events: EndingSound[] = [{ at: timing.lie, kind: "lie" }, { at: timing.lampDimFrom, kind: "lamp" }];
  const every = Math.max(1, timing.snoreEvery);
  for (let snore = Math.max(0, Math.ceil((from - timing.sleep) / every)); timing.sleep + snore * every <= to; snore++) events.push({ at: timing.sleep + snore * every, kind: "snore" });
  return events.filter(event => event.at > from && event.at <= to).sort((first, second) => first.at - second.at);
}

// How far the numbers of the card have counted up at time (0 to 1)
export const countShare = (time: number) => smooth(segment(time, COUNT.from, COUNT.from + COUNT.duration));
