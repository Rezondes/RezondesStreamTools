// Schedule of a Dogs alert (DESIGN-DOGS.md "Alerts", prototype refs/px-alert.html): the dog runs in with the toy of
// the kind, stops, drops it with a hop, barks, the card springs in; it picks the toy up again and runs out. With a raid
// the dog waits with the card until the pack has passed (raidPack in the core) and barks every raidBarkEvery; the alert
// lasts as long as that. Pure functions of the time since the alert started. Check: alert.check.ts.

// fixed: the ground of the prototype at pixel row 200, where the dogs and the toy stand
export const ALERT_GROUND = 200;
// fixed: the times of the prototype in s: stop, drop, card, first bark (a double bark 1.4 s apart), the dog stands
// still, picks up, runs out and is gone; the pack starts 0.3 s after the card, the dog waits 0.3 s after the last runner
export const ALERT_TIMES = { stop: 1.25, drop: 1.3, card: 1.4, bark: 2, doubleBark: 1.4, stand: 5.6, pick: 5.85, run: 6.2, gone: 7.4, packAfterCard: 0.3, waitAfterPack: 0.3 };
// fixed: a bark lasts 0.55 s; the bubble pops with each bark (not the second of the double bark) and goes 2.1 to 2.5 s
// after it (the first one 3.2 to 3.6 s), and not in the last 0.2 s of standing
const BARK = { length: 0.55, beforeStand: 1, bubbleGrow: 0.6, bubbleGone: [2.1, 2.5], firstGone: [3.2, 3.6], bubbleStop: 0.2 };
// fixed: how the dog runs: ease in with power 2.2 to the stop, ease out with 60 % cubic to the far side
const RUN = { inPower: 2.2, outCubic: 0.6 };
// fixed: the card springs in over 0.5 s (overshoot 1.6) and leaves 0.2 to 0.6 s after the run out began; the toy
// slides 14 pixels in 0.6 s after the drop and goes back to the mouth in the last 0.15 s
const CARD = { grow: 0.5, overshoot: 1.6, leaveFrom: 0.2, leaveTo: 0.6 };
const TOY = { slide: 14, slideTime: 0.6, back: 0.15 };

export type AlertSchedule = { shift: number; packStart: number; end: number; barks: readonly number[] };

// duration: the alert without raid (s); packEndMs: when the last runner of the pack is done (0 without raid)
export function alertSchedule(duration: number, packEndMs: number, barkEvery: number): AlertSchedule {
  const packStart = ALERT_TIMES.card + ALERT_TIMES.packAfterCard;
  const packEnd = packEndMs > 0 ? packStart + packEndMs / 1000 : 0;
  const shift = Math.max(0, packEnd + ALERT_TIMES.waitAfterPack - ALERT_TIMES.stand);
  const barks = [ALERT_TIMES.bark, ALERT_TIMES.bark + ALERT_TIMES.doubleBark];
  for (let bark = ALERT_TIMES.bark + barkEvery; barkEvery > 0 && bark < ALERT_TIMES.stand + shift - BARK.beforeStand; bark += barkEvery) barks.push(bark);
  return { shift, packStart, end: duration + shift, barks };
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
  const run = later(schedule, ALERT_TIMES.run);
  if (time < ALERT_TIMES.stop) return { x: Math.round(lerp(track.start, track.stop, 1 - (1 - segment(time, 0, ALERT_TIMES.stop)) ** RUN.inPower)), mode: "walk" };
  if (time < run) return { x: track.stop, mode: schedule.barks.some(bark => time > bark && time < bark + BARK.length) ? "bark" : "stand" };
  const share = segment(time, run, later(schedule, ALERT_TIMES.gone));
  return { x: Math.round(lerp(track.stop, track.out, share ** 3 * RUN.outCubic + share * (1 - RUN.outCubic))), mode: "walk" };
}

// The toy: held in the mouth (null), or dropped at its place as a share of the slide and the time since the drop;
// back: how far it went back to the mouth (0 to 1); gone after the dog left
export function toyAt(schedule: AlertSchedule, time: number): { held: boolean; slide: number; since: number; back: number; gone: boolean } {
  const pick = later(schedule, ALERT_TIMES.pick);
  const gone = time >= later(schedule, ALERT_TIMES.gone);
  if (time < ALERT_TIMES.drop || time > pick) return { held: true, slide: 0, since: 0, back: 0, gone };
  const since = time - ALERT_TIMES.drop;
  return { held: false, slide: Math.min(1, since / TOY.slideTime) * TOY.slide, since, back: segment(time, pick - TOY.back, pick), gone };
}

// The card: how far it came in (0 to 1 with overshoot) and how far it left (0 to 1)
export function cardAt(schedule: AlertSchedule, time: number): { come: number; leave: number } {
  const run = later(schedule, ALERT_TIMES.run);
  return { come: backOut(segment(time, ALERT_TIMES.card, ALERT_TIMES.card + CARD.grow), CARD.overshoot), leave: smooth(segment(time, run + CARD.leaveFrom, run + CARD.leaveTo)) };
}

// The size of the speech bubble at time (0 = hidden)
export function alertBubbleAt(schedule: AlertSchedule, time: number): number {
  const second = ALERT_TIMES.bark + ALERT_TIMES.doubleBark;
  const last = schedule.barks.filter(bark => bark <= time && bark !== second).pop();
  if (last === undefined || time > later(schedule, ALERT_TIMES.stand) - BARK.bubbleStop) return 0;
  const [from, to] = last === ALERT_TIMES.bark ? BARK.firstGone : BARK.bubbleGone;
  return elasticOut(segment(time, last, last + BARK.bubbleGrow)) * (1 - smooth(segment(time, last + from, last + to)));
}

// The sounds due after from up to to: running in, the toy, each bark, the card, running out
export function alertSoundsBetween(schedule: AlertSchedule, from: number, to: number): { at: number; kind: "run" | "toy" | "bark" | "card" | "leave" }[] {
  const events = [
    { at: 0.01, kind: "run" as const }, { at: ALERT_TIMES.drop, kind: "toy" as const }, { at: ALERT_TIMES.card, kind: "card" as const },
    ...schedule.barks.map(at => ({ at, kind: "bark" as const })), { at: later(schedule, ALERT_TIMES.run), kind: "leave" as const },
  ];
  return events.filter(event => event.at > from && event.at <= to).sort((first, second) => first.at - second.at);
}
