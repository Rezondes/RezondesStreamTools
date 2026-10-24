// Plan of the Starting scene of the Dogs theme (DESIGN-DOGS.md "Starting", prototype refs/px-starting.html): the six
// dogs drop one after another onto cushions in a row, a paw marker hops over their heads (the dog under it barks) and
// back to the streamer's dog, hearts burst, it jumps, walks to the rug in front and barks again and again. All places in
// world pixels, all times in s from the settings; every function is pure in time, so stills with ?t= match.
// Check: starting.check.ts.
import { easeInOut } from "../../core/easing.ts";
import type { Point } from "./pixels.ts";

// fixed: the layout of the prototype on a world of 216 rows (scaled to the height of the world): horizon, fence, the
// feet of the row and in front, the margin of the row; drops start at 0.4 s, take 0.5 s and fall from 60 pixels
export const LAYOUT = { rows: 216, horizon: 120, fence: 107, row: 150, front: 202, margin: 12 };
const DROP = { start: 0.4, duration: 0.5, height: 60, overshoot: 2.2 };
// fixed: the jump after the landing (0.4 s, 8 pixels high), the walk starts 0.3 s later and lasts at least 1.2 s; the
// first bark 0.5 s after the arrival, each bark 0.7 s long; a dog barks while the marker is close (above 0.7)
const JUMP = { duration: 0.4, height: 8, toWalk: 0.3, minWalk: 1.2 };
const BARK = { after: 0.5, length: 0.7, near: 0.7, nearWindow: 0.4 };
// fixed: wag speeds of the prototype: in the row, barking, the chosen one; marker above the head, how it hops and pops
const WAG = { row: 9, bark: 18, chosen: 16 };
const MARKER = { above: 12, arc: 12, sway: 1.5, swayRate: 6, appear: 0.3, glide: 0.75, reach: 0.9, fadeAfter: 0.4, overshoot: 2 };
// fixed: the card comes 0.2 s after the first bark; labels fade in over 0.4 s from 0.6 s, out over 0.8 s after the
// arrival (the others keep 40 %), and grow in two steps of 6 % while the marker is close
export const CARD_AFTER_BARK = 0.2;
const LABELS = { fadeIn: 0.4, from: 0.6, fade: 0.8, keep: 0.4, grow: 0.06, steps: 2 };
// fixed: the top of a dog image above its ground: feet on row height - 2 of the grid, the image is 4 rows taller
const FEET_TO_TOP = 5;

export type DogSize = { width: number; height: number; head: Point };
export type StartingSizes = { width: number; height: number; dogs: readonly DogSize[] };
export type StartingTiming = { chosen: number; dropEvery: number; markerStart: number; markerHop: number; walkSpeed: number; barkEvery: number };

export type StartingPlan = {
  sizes: StartingSizes; timing: StartingTiming; row: number; front: number; xs: readonly number[]; frontX: number;
  order: readonly number[]; land: number; up: number; walk: number; arrive: number; bark: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const segment = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
const lerp = (from: number, to: number, share: number) => from + (to - from) * share;
const smooth = (share: number) => share * share * (3 - 2 * share);
const backOut = (share: number, overshoot: number) => 1 + (overshoot + 1) * (share - 1) ** 3 + overshoot * (share - 1) ** 2;

export const topOn = (dog: DogSize, ground: number) => ground - dog.height + FEET_TO_TOP;
export const scaledRow = (sizes: StartingSizes, row: number) => Math.round((row * sizes.height) / LAYOUT.rows);

export function startingPlan(timing: StartingTiming, sizes: StartingSizes): StartingPlan {
  const { dogs, width } = sizes;
  const room = width - 2 * LAYOUT.margin - dogs.reduce((sum, dog) => sum + dog.width, 0);
  const gap = room / Math.max(1, dogs.length - 1);
  let cursor = LAYOUT.margin;
  const xs = dogs.map(dog => {
    const x = Math.round(cursor);
    cursor += dog.width + gap;
    return x;
  });
  const chosen = Math.min(dogs.length - 1, Math.max(0, timing.chosen));
  const order = [...dogs.keys()];
  for (let place = dogs.length - 2; place >= chosen; place--) order.push(place);
  if (chosen === dogs.length - 1) order.push(chosen);
  const row = scaledRow(sizes, LAYOUT.row);
  const front = scaledRow(sizes, LAYOUT.front);
  const frontX = Math.round(width / 2 - dogs[chosen].width / 2);
  const land = timing.markerStart + (order.length - 1) * timing.markerHop;
  const up = land + JUMP.duration;
  const walk = up + JUMP.toWalk;
  const arrive = walk + Math.max(JUMP.minWalk, Math.hypot(frontX - xs[chosen], front - row) / timing.walkSpeed);
  return { sizes, timing: { ...timing, chosen }, row, front, xs, frontX, order, land, up, walk, arrive, bark: arrive + BARK.after };
}

// How close the marker is to the dog at index (0 to 1), while it hops
export function nearness(plan: StartingPlan, index: number, time: number) {
  const { markerStart, markerHop } = plan.timing;
  if (time < markerStart || time > plan.land + BARK.nearWindow) return 0;
  let best = 0;
  plan.order.forEach((place, step) => {
    if (place === index) best = Math.max(best, 1 - clamp(Math.abs(time - (markerStart + step * markerHop)) / (markerHop * MARKER.reach)));
  });
  return smooth(best);
}

const barking = (time: number, from: number) => time > from && time < from + BARK.length;

export type DogPlace = { x: number; y: number; mode: "stand" | "walk" | "bark"; flip: boolean; wagSpeed: number; near: number };

// Where the dog at index stands at time and what it does
export function dogAt(plan: StartingPlan, index: number, time: number): DogPlace {
  const dog = plan.sizes.dogs[index];
  const { dropEvery, barkEvery } = plan.timing;
  const start = DROP.start + index * dropEvery;
  const drop = (1 - backOut(segment(time, start, start + DROP.duration), DROP.overshoot)) * DROP.height;
  let x = plan.xs[index];
  let y = topOn(dog, plan.row) - drop;
  let mode: DogPlace["mode"] = "stand";
  let flip = false;
  let wagSpeed = WAG.row;
  const near = nearness(plan, index, time);
  if (near > BARK.near) {
    mode = "bark";
    wagSpeed = WAG.bark;
  }
  if (index === plan.timing.chosen && time >= plan.land) {
    wagSpeed = WAG.chosen;
    if (time < plan.up) y -= Math.round(Math.sin(segment(time, plan.land, plan.up) * Math.PI) * JUMP.height);
    const share = easeInOut(segment(time, plan.walk, plan.arrive));
    x = lerp(plan.xs[index], plan.frontX, share);
    y = lerp(y, topOn(dog, plan.front), share);
    if (time > plan.walk && time < plan.arrive) {
      mode = "walk";
      flip = plan.frontX < plan.xs[index];
    }
    const loop = Math.floor((time - plan.bark) / barkEvery);
    if (barking(time, plan.bark) || (time > plan.bark && barking(time, plan.bark + barkEvery * loop))) mode = "bark";
  }
  return { x: Math.round(x), y: Math.round(y), mode, flip, wagSpeed, near };
}

// The head of the dog at index in world pixels at time (mirrored when it faces left)
export function headAt(plan: StartingPlan, index: number, time: number): Point {
  const place = dogAt(plan, index, time);
  const dog = plan.sizes.dogs[index];
  return [place.x + (place.flip ? dog.width - 1 - dog.head[0] : dog.head[0]), place.y + dog.head[1]];
}

// The marker over the heads: its middle and its size (0 to 1), null while it is not there
export function markerAt(plan: StartingPlan, time: number): { x: number; y: number; share: number } | null {
  const { markerStart, markerHop } = plan.timing;
  if (time < markerStart - MARKER.appear || time >= plan.walk + MARKER.fadeAfter) return null;
  const hops = (time - markerStart) / markerHop;
  const from = Math.min(plan.order.length - 1, Math.max(0, Math.floor(hops)));
  const to = Math.min(plan.order.length - 1, from + 1);
  const along = time < markerStart ? 0 : clamp(hops - from);
  const above = (place: number): Point => {
    const [x, y] = headAt(plan, place, time);
    return [x, y - MARKER.above];
  };
  const [startX, startY] = above(plan.order[from]);
  const [endX, endY] = above(plan.order[to]);
  const glide = easeInOut(clamp(along / MARKER.glide));
  const arc = from !== to ? Math.sin(glide * Math.PI) * MARKER.arc : 0;
  const share = backOut(segment(time, markerStart - MARKER.appear, markerStart), MARKER.overshoot) * (1 - easeInOut(segment(time, plan.up, plan.walk + MARKER.fadeAfter)));
  return { x: Math.round(lerp(startX, endX, glide)), y: Math.round(lerp(startY, endY, glide) - arc + Math.sin(time * MARKER.swayRate) * MARKER.sway), share };
}

// The label under the cushion at index: how visible, how much bigger while the marker is close, highlighted
export function labelAt(plan: StartingPlan, index: number, time: number) {
  const delay = index * plan.timing.dropEvery;
  const fadeIn = smooth(segment(time, LABELS.from + delay, LABELS.from + LABELS.fadeIn + delay));
  const chosen = index === plan.timing.chosen;
  const fadeOut = smooth(segment(time, plan.arrive, plan.arrive + LABELS.fade)) * (chosen ? 1 : 1 - LABELS.keep);
  const near = nearness(plan, index, time);
  return { opacity: chosen && time > plan.walk ? 0 : fadeIn * (1 - fadeOut), scale: 1 + Math.round(near * LABELS.steps) * LABELS.grow, highlight: near > 1 / LABELS.steps };
}

// fixed: the speech bubble springs in over 0.6 s with each bark of the chosen dog and shrinks away 2.2 to 2.6 s after it
const BUBBLE = { grow: 0.6, from: 2.2, to: 2.6 };
const elasticOut = (share: number) => (share <= 0 || share >= 1 ? share : 2 ** (-10 * share) * Math.sin((share * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);

// The size of the speech bubble (0 = hidden) at time: after the last bark of the chosen dog
export function bubbleAt(plan: StartingPlan, time: number) {
  if (time < plan.bark) return 0;
  const last = plan.bark + Math.floor((time - plan.bark) / plan.timing.barkEvery) * plan.timing.barkEvery;
  return elasticOut(segment(time, last, last + BUBBLE.grow)) * (1 - smooth(segment(time, last + BUBBLE.from, last + BUBBLE.to)));
}

// fixed: labels sit 6 pixels below the feet of the row, the bubble 16 pixels right of and 2 below the head
const SIGN = { labelBelow: 6, bubbleRight: 16, bubbleDown: 2 };

// Where the label of the dog at index hangs (its top middle, world pixels)
export const labelPlace = (plan: StartingPlan, index: number): Point => [plan.xs[index] + plan.sizes.dogs[index].width / 2, plan.row + SIGN.labelBelow];

// Where the bubble of the chosen dog starts at time (its bottom left, world pixels)
export function bubblePlace(plan: StartingPlan, time: number): Point {
  const [x, y] = headAt(plan, plan.timing.chosen, time);
  return [x + SIGN.bubbleRight, y + SIGN.bubbleDown];
}

// fixed: the entrance of the sign layer in the GSAP timeline (s, stage px, eases): pill, title, subtitle, countdown box
// and the card that slides up after the first bark
export const INTRO = {
  pill: { at: 0, duration: 0.5, y: -80, ease: "back.out(1.7)" },
  title: { at: 0.15, duration: 1.05, y: -40, scale: 0.6, ease: "elastic.out(1, 0.5)", fade: 0.25 },
  subtitle: { at: 0.8, duration: 0.5 },
  countdown: { at: 1, duration: 0.6, y: 260, ease: "back.out(1.7)" },
  card: { duration: 0.6, y: 300, ease: "back.out(2)" },
};

export type StartingSound ={ at: number; kind: "land" | "hop" | "chosen" | "card" | "bark"; dog: number };

// The sounds that are due after from up to to: landings, hops, the dog under the marker barks, the choice, the card and
// the chosen dog barking again and again
export function soundsBetween(plan: StartingPlan, from: number, to: number): StartingSound[] {
  const { dropEvery, markerStart, markerHop, barkEvery, chosen } = plan.timing;
  const events: StartingSound[] = plan.sizes.dogs.map((_, dog) => ({ at: DROP.start + dog * dropEvery + DROP.duration / 2, kind: "land" as const, dog }));
  plan.order.forEach((place, step) => {
    const at = markerStart + step * markerHop;
    if (step > 0 && place !== plan.order[step - 1]) events.push({ at, kind: "hop", dog: place });
    if (step < plan.order.length - 1) events.push({ at: at - (markerHop * MARKER.reach * (1 - BARK.near)) / 2, kind: "bark", dog: place });
  });
  events.push({ at: plan.land, kind: "chosen", dog: chosen }, { at: plan.bark + CARD_AFTER_BARK, kind: "card", dog: chosen });
  for (let bark = Math.max(0, Math.ceil((from - plan.bark) / barkEvery)); plan.bark + bark * barkEvery <= to; bark++) events.push({ at: plan.bark + bark * barkEvery, kind: "bark", dog: chosen });
  return events.filter(event => event.at > from && event.at <= to).sort((first, second) => first.at - second.at);
}
