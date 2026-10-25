// Schedule of a Dogs alert (DESIGN-DOGS.md "Alerts", prototype refs/px-alert.html): the dog runs in with the toy of
// the kind, stops, drops it with a hop, barks, the card springs in; it picks the toy up again and runs out. With a raid
// the dog waits with the card until the pack has passed (raidPack in the core) and barks every raidBarkEvery; the alert
// lasts as long as that. Pure functions of the time since the alert started. Check: alert.check.ts.

import type { DogsValues } from "./settings.ts";

// fixed: the ground of the prototype at pixel row 200, where the dogs and the toy stand; the feet end two rows lower
export const ALERT_GROUND = 200;
export const ALERT_FEET = ALERT_GROUND + 2;
const PERCENT = 100;

// The size of the alert (alertSize % of the pixel size): whole screen pixels per pixel, the share for the card and the
// bubble, and how far the smaller world moves down so the feet stay where they end at the full pixel size (the source)
export function alertScaleOf(pixelScale: number, alertSize: number): { pixel: number; ratio: number; lift: number } {
  const pixel = Math.max(1, Math.round((pixelScale * alertSize) / PERCENT));
  return { pixel, ratio: pixel / pixelScale, lift: ALERT_FEET * (pixelScale - pixel) };
}
// The times of the settings in s: stop, drop, card, first bark (a double bark doubleBark apart), the dog stands still,
// picks up, runs out and is gone; the pack starts packAfterCard after the card, the dog waits waitAfterPack after the
// last runner. The card springs in over cardGrow (overshoot cardOvershoot) and leaves cardLeaveFrom to cardLeaveTo after
// the run out began; the toy slides toySlide pixels in toySlideTime after the drop and goes back in the last toyBack
export type AlertTimes = {
  stop: number; drop: number; card: number; bark: number; doubleBark: number; stand: number; pick: number; run: number; gone: number;
  packAfterCard: number; waitAfterPack: number; cardGrow: number; cardOvershoot: number; cardLeaveFrom: number; cardLeaveTo: number;
  toySlide: number; toySlideTime: number; toyBack: number;
};
export const alertTimesOf = (values: DogsValues): AlertTimes => ({
  stop: values.alertAtStop, drop: values.alertAtDrop, card: values.alertAtCard, bark: values.alertAtBark, doubleBark: values.alertBarkGap,
  stand: values.alertAtStand, pick: values.alertAtPick, run: values.alertAtRun, gone: values.alertAtGone, packAfterCard: values.alertPackAfterCard,
  waitAfterPack: values.alertWaitAfterPack, cardGrow: values.cardGrow, cardOvershoot: values.cardOvershoot, cardLeaveFrom: values.cardLeaveFrom,
  cardLeaveTo: values.cardLeaveTo, toySlide: values.toySlide, toySlideTime: values.toySlideTime, toyBack: values.toyBack,
});
// fixed: a bark lasts 0.55 s; the bubble pops with each bark (not the second of the double bark) and goes 2.1 to 2.5 s
// after it (the first one 3.2 to 3.6 s), and not in the last 0.2 s of standing
const BARK = { length: 0.55, beforeStand: 1, bubbleGrow: 0.6, bubbleGone: [2.1, 2.5], firstGone: [3.2, 3.6], bubbleStop: 0.2 };
// fixed: how the dog runs: ease in with power 2.2 to the stop, ease out with 60 % cubic to the far side
const RUN = { inPower: 2.2, outCubic: 0.6 };
export type AlertSchedule = { shift: number; packStart: number; end: number; barks: readonly number[]; times: AlertTimes };

// duration: the alert without raid (s); packEndMs: when the last runner of the pack is done (0 without raid)
export function alertSchedule(duration: number, packEndMs: number, barkEvery: number, times: AlertTimes): AlertSchedule {
  const packStart = times.card + times.packAfterCard;
  const packEnd = packEndMs > 0 ? packStart + packEndMs / 1000 : 0;
  const shift = Math.max(0, packEnd + times.waitAfterPack - times.stand);
  const barks = [times.bark, times.bark + times.doubleBark];
  for (let bark = times.bark + barkEvery; barkEvery > 0 && bark < times.stand + shift - BARK.beforeStand; bark += barkEvery) barks.push(bark);
  return { shift, packStart, end: duration + shift, barks, times };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const lerp = (from: number, to: number, share: number) => from + (to - from) * share;
const smooth = (share: number) => share * share * (3 - 2 * share);
const backOut = (share: number, overshoot: number) => 1 + (overshoot + 1) * (share - 1) ** 3 + overshoot * (share - 1) ** 2;
const elasticOut = (share: number) => (share <= 0 || share >= 1 ? share : 2 ** (-10 * share) * Math.sin((share * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);

// A time of the plain alert, moved by the wait of a raid when it comes after the card
const later = (schedule: AlertSchedule, time: number) => time + schedule.shift;

// The places the dog runs between: start left outside, the stop, out right
export type AlertTrack = { start: number; stop: number; out: number };

// Where the dog is (left edge) and what it does at time
export function alertDogAt(schedule: AlertSchedule, track: AlertTrack, time: number): { x: number; mode: "walk" | "stand" | "bark" } {
  const run = later(schedule, schedule.times.run);
  if (time < schedule.times.stop) return { x: Math.round(lerp(track.start, track.stop, 1 - (1 - segment(time, 0, schedule.times.stop)) ** RUN.inPower)), mode: "walk" };
  if (time < run) return { x: track.stop, mode: schedule.barks.some(bark => time > bark && time < bark + BARK.length) ? "bark" : "stand" };
  const share = segment(time, run, later(schedule, schedule.times.gone));
  return { x: Math.round(lerp(track.stop, track.out, share ** 3 * RUN.outCubic + share * (1 - RUN.outCubic))), mode: "walk" };
}

// The toy: held in the mouth (null), or dropped at its place as a share of the slide and the time since the drop;
// back: how far it went back to the mouth (0 to 1); gone after the dog left
export function toyAt(schedule: AlertSchedule, time: number): { held: boolean; slide: number; since: number; back: number; gone: boolean } {
  const pick = later(schedule, schedule.times.pick);
  const gone = time >= later(schedule, schedule.times.gone);
  if (time < schedule.times.drop || time > pick) return { held: true, slide: 0, since: 0, back: 0, gone };
  const since = time - schedule.times.drop;
  return { held: false, slide: Math.min(1, since / schedule.times.toySlideTime) * schedule.times.toySlide, since, back: segment(time, pick - schedule.times.toyBack, pick), gone };
}

// The card: how far it came in (0 to 1 with overshoot) and how far it left (0 to 1)
export function cardAt(schedule: AlertSchedule, time: number): { come: number; leave: number } {
  const run = later(schedule, schedule.times.run);
  return { come: backOut(segment(time, schedule.times.card, schedule.times.card + schedule.times.cardGrow), schedule.times.cardOvershoot), leave: smooth(segment(time, run + schedule.times.cardLeaveFrom, run + schedule.times.cardLeaveTo)) };
}

// The size of the speech bubble at time (0 = hidden)
export function alertBubbleAt(schedule: AlertSchedule, time: number): number {
  const second = schedule.times.bark + schedule.times.doubleBark;
  const last = schedule.barks.filter(bark => bark <= time && bark !== second).pop();
  if (last === undefined || time > later(schedule, schedule.times.stand) - BARK.bubbleStop) return 0;
  const [from, to] = last === schedule.times.bark ? BARK.firstGone : BARK.bubbleGone;
  return elasticOut(segment(time, last, last + BARK.bubbleGrow)) * (1 - smooth(segment(time, last + from, last + to)));
}

// The sounds due after from up to to: running in, the toy, each bark, the card, running out
export function alertSoundsBetween(schedule: AlertSchedule, from: number, to: number): { at: number; kind: "run" | "toy" | "bark" | "card" | "leave" }[] {
  const events = [
    { at: 0.01, kind: "run" as const }, { at: schedule.times.drop, kind: "toy" as const }, { at: schedule.times.card, kind: "card" as const },
    ...schedule.barks.map(at => ({ at, kind: "bark" as const })), { at: later(schedule, schedule.times.run), kind: "leave" as const },
  ];
  return events.filter(event => event.at > from && event.at <= to).sort((first, second) => first.at - second.at);
}
