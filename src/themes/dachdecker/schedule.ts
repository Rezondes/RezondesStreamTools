// Timing of the Dachdecker screens (src/themes/dachdecker/docs/PLAN-DACHDECKER.md, packages 1 and 2): start and length
// of every step in seconds (the build of the roof frame in Starting scaled with buildSpeed, the texts, the lights,
// protocol and stamp of the Ending), how far a beam has grown at a time and where the camera stands. The scene drives one
// clock with its GSAP timeline, the 3D parts read it. Check: schedule.check.ts.
import type { Point3 } from "../../core/three/beam.ts";
import type { ScreenKind } from "../../core/screens/screens.ts";

export type BuildStep = { start: number; duration: number; stagger: number; each: number };
export const BUILD_STEPS = ["walls", "front", "trusses", "purlins", "battens", "tiles"] as const;
const TEXT_STEPS = ["head", "block", "title", "subtitle", "count", "card", "rows", "stamp"] as const;
export type StepName = (typeof BUILD_STEPS)[number] | (typeof TEXT_STEPS)[number] | "camera" | "wreath" | "windows" | "fireworks";
export type Schedule = Record<StepName, BuildStep>;

// The clock of a scene in seconds since it opened; the timeline drives it, the 3D parts read it every frame
export type BuildClock = { time: number };
// fixed: the timeline runs the clock for a day, longer than any stream
export const CLOCK_SECONDS = 86_400;
// A clock where everything is built (BRB, Ending)
export const BUILT: BuildClock = { time: CLOCK_SECONDS };

const MS = 1000;
// Count reveal as a share of the title reveal
const COUNT_SHARE = 0.7;
// At most this many protocol rows count up one after the other
const ROWS_MAX = 12;

const phase = (start: number, duration: number, stagger = 0, each = 0): BuildStep => ({ start, duration, stagger, each });
// Never: steps a scene does not have
const NEVER = phase(CLOCK_SECONDS, 0);

// The build at speed 1 from the design: start, length of one beam, offset between beams, offset between trusses
const BUILD: Record<(typeof BUILD_STEPS)[number] | "camera", BuildStep> = {
  walls: phase(0.2, 0.8, 0.1),
  front: phase(0.5, 0.7, 0.16),
  trusses: phase(1.4, 0.5, 0.04, 0.35),
  purlins: phase(2.6, 0.9, 0.12),
  battens: phase(3.4, 0.5, 0.05),
  tiles: phase(4.6, 0.35, 0.025),
  camera: phase(0, 5),
};

type Timing = { buildSpeed: number; scrambleMs: number; countUpMs?: number; windowStep?: number; stampAt?: number };

// Texts and lights per scene; reveal = length of the decoding title
function sceneSteps(kind: ScreenKind, timing: Timing, reveal: number): Omit<Schedule, (typeof BUILD_STEPS)[number] | "camera"> {
  const none = { card: NEVER, rows: NEVER, stamp: NEVER, wreath: NEVER, windows: NEVER, fireworks: NEVER };
  if (kind === "starting") {
    return { ...none, head: phase(0.3, 0.6), block: phase(0.5, 0.6), title: phase(1.2, reveal), subtitle: phase(1.2, 1.2), count: phase(2.2, reveal * COUNT_SHARE) };
  }
  if (kind === "brb") {
    return { ...none, head: phase(0.2, 0.6), block: phase(0.4, 0.6), title: phase(0.6, reveal), subtitle: phase(1.4, 1.2), count: phase(2, 0.4) };
  }
  const stampAt = timing.stampAt ?? 6;
  return {
    head: phase(0.4, 0.6), block: phase(0.6, 0.6), title: phase(3.2, reveal), subtitle: phase(3.8, 1.2), count: phase(3.8, 1.2),
    card: phase(4.2, 0.6), rows: phase(4.5, (timing.countUpMs ?? MS) / MS, 0.18), stamp: phase(stampAt, 0.35),
    wreath: phase(0.6, 0.9), windows: phase(2.2, 0.25, (timing.windowStep ?? 0) / MS), fireworks: phase(stampAt + 0.4, 0),
  };
}

// Starting scales the whole scene with buildSpeed; BRB and Ending show the finished frame and keep their times
export function buildSchedule(timing: Timing, kind: ScreenKind = "starting"): Schedule {
  const speed = kind === "starting" ? timing.buildSpeed : 1;
  const scale = (entry: BuildStep): BuildStep => ({
    start: entry.start / speed, duration: entry.duration / speed, stagger: entry.stagger / speed, each: entry.each / speed,
  });
  const steps = { ...BUILD, ...sceneSteps(kind, timing, timing.scrambleMs / MS) };
  return Object.fromEntries(Object.entries(steps).map(([name, entry]) => [name, scale(entry)])) as Schedule;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
// GSAP power2.inOut and power3.out as plain functions
const inOut = (part: number) => (part < 0.5 ? 2 * part * part : 1 - (2 - 2 * part) ** 2 / 2);
const outCubic = (part: number) => 1 - (1 - part) ** 3;

// Share of a step reached at time: index = beam within its group, group = truss behind the front one
export const growth = (step: BuildStep, index: number, time: number, group = 0) =>
  inOut(clamp01((time - step.start - group * step.each - index * step.stagger) / (step.duration || 1)));

// A tile lands like a hammered nail: scale from 0 past 1 and back (GSAP back.out with this overshoot)
const OVERSHOOT = 2.5;
export function landing(step: BuildStep, index: number, time: number): number {
  const part = clamp01((time - step.start - index * step.stagger) / (step.duration || 1)) - 1;
  return 1 + (OVERSHOOT + 1) * part ** 3 + OVERSHOOT * part ** 2;
}

// Covering the roof over the countdown: the first tiles land during the build like landing, the rest one after the
// other until until (seconds), the last one done exactly then. Without time left after the build they simply follow on.
export function coverLanding(step: BuildStep, index: number, time: number, first: number, total: number, until: number): number {
  const built = stepEnd(step, first);
  const rest = total - first;
  if (index < first || rest <= 0 || until <= built) return landing(step, index, time);
  const done = built + ((index - first + 1) / rest) * (until - built);
  return landing({ ...step, start: done - step.duration }, 0, time);
}

// Time when the last tile of coverLanding is done
export const coverEnd = (step: BuildStep, first: number, total: number, until: number) => Math.max(stepEnd(step, total), until > stepEnd(step, first) ? until : 0);

// Time when the last of count beams or tiles of a step is done
export const stepEnd = (step: BuildStep, count: number, groups = 1) => step.start + (groups - 1) * step.each + (count - 1) * step.stagger + step.duration;

// After the stamp hits, the protocol shakes for a moment: an offset from -1 to 1, 0 before and after
const SHAKE = { length: 0.2, speed: 60 };
export function shakeAt(stamp: BuildStep, time: number) {
  const since = time - stamp.start - stamp.duration;
  return since > 0 && since < SHAKE.length ? Math.sin(since * SHAKE.speed) * (1 - since / SHAKE.length) : 0;
}

// Time when all texts are revealed (and the protocol has stopped shaking); after it the texts no longer follow the clock
export const textsEnd = (schedule: Schedule) =>
  Math.max(...TEXT_STEPS.map(name => schedule[name]).filter(entry => entry.duration > 0)
    .map(entry => entry.start + entry.duration + entry.stagger * ROWS_MAX)) + SHAKE.length;

// Linear share of a step (texts, fades)
export const reached = (step: BuildStep, time: number) => clamp01((time - step.start) / (step.duration || 1));

// center: depth of the middle of the frame (half way from the front to the last truss)
export type Orbit = { radius: number; height: number; speed: number; intro: boolean; center: number };
export type CameraPose = { position: Point3; target: Point3 };
// Where a scene looks from: start angle, height of the target, and shares of radius, height and speed of the orbit
export type View = { angle: number; look: number; radius: number; height: number; speed: number };

// Starting looks at the frame a little below the ground line; BRB a little lower and farther, slower
export const STARTING_VIEW: View = { angle: 0.35, look: -1.1, radius: 1, height: 1, speed: 1 };
export const BRB_VIEW: View = { angle: 0.5, look: -1.3, radius: 1.09, height: 0.94, speed: 0.71 };
// The ride out starts at this share of the radius and of the height
const INTRO_RADIUS = 0.44;
const INTRO_HEIGHT = 1.33;

export function cameraPose(schedule: Schedule, orbit: Orbit, time: number, view = STARTING_VIEW): CameraPose {
  const ride = orbit.intro ? outCubic(reached(schedule.camera, time)) : 1;
  const radius = orbit.radius * view.radius * (INTRO_RADIUS + (1 - INTRO_RADIUS) * ride);
  const height = orbit.height * view.height * (INTRO_HEIGHT + (1 - INTRO_HEIGHT) * ride);
  const angle = view.angle + time * orbit.speed * view.speed;
  return { position: [Math.sin(angle) * radius, height, orbit.center + Math.cos(angle) * radius], target: [0, view.look, orbit.center] };
}

// Ending: starts close at the wreath and rides back to the whole house, then circles slowly. roofTop = height of the ridge
const ENDING = { from: { radius: 0.7, angle: 0.15, above: 1.8 }, to: { radius: 1.41, height: 1.25, angle: 0.55, look: 0.32 }, speed: 0.5 };
const inOutCubic = (part: number) => (part < 0.5 ? 4 * part ** 3 : 1 - (2 - 2 * part) ** 3 / 2);

export function endingPose(schedule: Schedule, orbit: Orbit, time: number, roofTop: number): CameraPose {
  const ride = orbit.intro ? inOutCubic(reached(schedule.camera, time)) : 1;
  const mix = (from: number, to: number) => from + (to - from) * ride;
  const radius = orbit.radius * mix(ENDING.from.radius, ENDING.to.radius);
  const height = mix(roofTop + ENDING.from.above, orbit.height * ENDING.to.height);
  const look = mix(roofTop, roofTop * ENDING.to.look);
  const after = Math.max(0, time - schedule.camera.start - schedule.camera.duration);
  const angle = mix(ENDING.from.angle, ENDING.to.angle) + after * orbit.speed * ENDING.speed;
  return { position: [Math.sin(angle) * radius, height, orbit.center + Math.cos(angle) * radius], target: [0, look, orbit.center] };
}
