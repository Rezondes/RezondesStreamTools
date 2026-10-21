// Timing of the KOTH Starting (PLAN-KOTH.md package 2): start and length of every step of the build in seconds, scaled
// with buildSpeed, how far a step is at a time, the curves of the prototype and where the camera stands. The scene
// drives one clock with its GSAP timeline, the 3D parts and the briefing read it, so a still image with ?t shows the same
// picture. Pure; check: build.check.ts.
import { easeAt } from "../../core/motion/ease.ts";
import type { Point3 } from "../../core/three/beam.ts";

// The clock of a scene in seconds since it opened
export type KothClock = { time: number };
// fixed: the timeline runs the clock for a day, longer than any stream
export const CLOCK_SECONDS = 86_400;

export type Step = { start: number; duration: number; stagger: number };
const step = (start: number, duration: number, stagger = 0): Step => ({ start, duration, stagger });

// The build at speed 1 from the prototype (refs/starting.html)
const STARTING = {
  ground: step(0.1, 1.6),
  mast: step(1.0, 1.6),
  bags: step(1.4, 0.55, 0.025),
  smoke: step(1.2, 2),
  flag: step(2.4, 1.8),
  dish: step(2.4, 0.5, 0.15),
  wires: step(2.6, 0.8),
  markers: step(3.2, 0.6, 0.2),
  head: step(0.4, 0.5, 0.15),
  map: step(0.9, 0.7),
  contours: step(1.3, 1, 0.2),
  route: step(1.9, 1.2),
  arrow: step(3.0, 0.3),
  objective: step(3.2, 0.6),
  cross: step(3.7, 0.4),
  target: step(3.7, 0.7),
  title: step(2.6, 0.28, 0.045),
  display: step(3.4, 0.5),
  screen: step(3.6, 0.25),
  count: step(3.6, 1),
  factions: step(4.2, 0.4),
  progress: step(3.6, 2.4),
  radio: step(4.4, 1.2),
};
export type StepName = keyof typeof STARTING;
export type Steps = Record<StepName, Step>;

// Every step faster or slower; speed 2 builds in half the time
export function startingSteps(speed: number): Steps {
  const scaled = (value: Step) => step(value.start / speed, value.duration / speed, value.stagger / speed);
  return Object.fromEntries(Object.entries(STARTING).map(([name, value]) => [name, scaled(value)])) as Steps;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Share 0..1 of a step at a time; index: the item of a staggered step
export const stepShare = (value: Step, time: number, index = 0) =>
  value.duration > 0 ? clamp01((time - value.start - index * value.stagger) / value.duration) : Number(time >= value.start);

// Curves of the prototype (GSAP names in the comments) besides the named ones of the core
export const outCubic = (share: number) => 1 - (1 - share) ** 3; // power3.out / power2.out
export const inOutCubic = (share: number) => (share < 0.5 ? 4 * share ** 3 : 1 - (-2 * share + 2) ** 3 / 2); // power3.inOut
export const inOutQuad = (share: number) => (share < 0.5 ? 2 * share * share : 1 - (-2 * share + 2) ** 2 / 2); // power1.inOut
export const nail = (share: number) => easeAt("nagel", share);
// bounce.out: falls and bounces three times smaller
export function outBounce(share: number): number {
  const strength = 7.5625;
  const width = 2.75;
  if (share < 1 / width) return strength * share * share;
  if (share < 2 / width) return strength * (share - 1.5 / width) ** 2 + 0.75;
  if (share < 2.5 / width) return strength * (share - 2.25 / width) ** 2 + 0.9375;
  return strength * (share - 2.625 / width) ** 2 + 0.984375;
}

export type CameraOptions = { intro: boolean; radius: number; height: number; speed: number; top: number };
export type CameraPose = { position: Point3; target: Point3 };

// fixed: the intro of the prototype, from close at the flag back to the circle
const INTRO = { start: 0.3, duration: 5.5, radius: 9, lift: 2.5, angle: 0.9, turn: 0.55, look: 2.6, lookEnd: 2.2, sink: 0.6 };

// Camera: starts close at the flag, pulls back and up, then circles the hill slowly; without intro it circles at once
export function cameraPose(time: number, options: CameraOptions): CameraPose {
  const share = options.intro ? inOutCubic(clamp01((time - INTRO.start) / INTRO.duration)) : 1;
  const circling = Math.max(0, time - (options.intro ? INTRO.start + INTRO.duration : 0));
  const radius = INTRO.radius + (options.radius - INTRO.radius) * share;
  const height = options.top + INTRO.lift + (options.height - INTRO.lift) * share;
  const angle = INTRO.angle - share * INTRO.turn + circling * options.speed;
  const lookY = options.top - INTRO.sink + INTRO.look * (1 - share) + INTRO.lookEnd * share;
  return { position: [Math.sin(angle) * radius, height, Math.cos(angle) * radius], target: [0, lookY, 0] };
}
