// Build of the roof frame in the Starting scene of the Dachdecker theme (src/themes/dachdecker/docs/PLAN-DACHDECKER.md,
// package 1): start and length of every step in seconds, scaled with buildSpeed, how far a beam has grown at a time and
// where the camera stands. The scene drives one clock with its GSAP timeline, the 3D parts read it. Check:
// schedule.check.ts.
import type { Point3 } from "../../core/three/beam.ts";

export type BuildStep = { start: number; duration: number; stagger: number; each: number };
export const BUILD_STEPS = ["walls", "front", "trusses", "purlins", "battens", "tiles"] as const;
export type StepName = (typeof BUILD_STEPS)[number] | "head" | "block" | "title" | "count" | "camera";
export type Schedule = Record<StepName, BuildStep>;

// The clock of a scene in seconds since it opened; the timeline drives it, the 3D parts read it every frame
export type BuildClock = { time: number };
// fixed: the timeline runs the clock for a day, longer than any stream
export const CLOCK_SECONDS = 86_400;

const MS = 1000;
// Count reveal as a share of the title reveal
const COUNT_SHARE = 0.7;

// Times at speed 1 from the design: start, length of one beam, offset between beams, offset between trusses
const STEPS: Record<Exclude<StepName, "title" | "count">, BuildStep> = {
  walls: { start: 0.2, duration: 0.8, stagger: 0.1, each: 0 },
  front: { start: 0.5, duration: 0.7, stagger: 0.16, each: 0 },
  trusses: { start: 1.4, duration: 0.5, stagger: 0.04, each: 0.35 },
  purlins: { start: 2.6, duration: 0.9, stagger: 0.12, each: 0 },
  battens: { start: 3.4, duration: 0.5, stagger: 0.05, each: 0 },
  tiles: { start: 4.6, duration: 0.35, stagger: 0.025, each: 0 },
  head: { start: 0.3, duration: 0.6, stagger: 0, each: 0 },
  block: { start: 0.5, duration: 0.6, stagger: 0, each: 0 },
  camera: { start: 0, duration: 5, stagger: 0, each: 0 },
};
const TITLE_AT = 1.2;
const COUNT_AT = 2.2;

export function buildSchedule(values: { buildSpeed: number; scrambleMs: number }): Schedule {
  const scale = (step: BuildStep): BuildStep => ({
    start: step.start / values.buildSpeed, duration: step.duration / values.buildSpeed,
    stagger: step.stagger / values.buildSpeed, each: step.each / values.buildSpeed,
  });
  const reveal = values.scrambleMs / MS;
  return {
    ...(Object.fromEntries(Object.entries(STEPS).map(([name, step]) => [name, scale(step)])) as Record<keyof typeof STEPS, BuildStep>),
    title: scale({ start: TITLE_AT, duration: reveal, stagger: 0, each: 0 }),
    count: scale({ start: COUNT_AT, duration: reveal * COUNT_SHARE, stagger: 0, each: 0 }),
  };
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

// Time when the last of count beams or tiles of a step is done
export const stepEnd = (step: BuildStep, count: number, groups = 1) => step.start + (groups - 1) * step.each + (count - 1) * step.stagger + step.duration;

// Time when all texts are revealed; after it the texts no longer change with the clock
export const textsEnd = (schedule: Schedule) =>
  Math.max(...(["head", "block", "title", "count"] as const).map(name => schedule[name].start + schedule[name].duration));

// Linear share of a step (texts, fades)
export const reached = (step: BuildStep, time: number) => clamp01((time - step.start) / (step.duration || 1));

export type Orbit = { radius: number; height: number; speed: number; intro: boolean };
export type CameraPose = { position: Point3; target: Point3 };

// The camera looks at the middle of the frame a little below the ground line
const TARGET: Point3 = [0, -1.1, -3];
const START_ANGLE = 0.35;
// The ride out starts at this share of the radius and of the height
const INTRO_RADIUS = 0.44;
const INTRO_HEIGHT = 1.33;

export function cameraPose(schedule: Schedule, orbit: Orbit, time: number): CameraPose {
  const ride = orbit.intro ? outCubic(reached(schedule.camera, time)) : 1;
  const radius = orbit.radius * (INTRO_RADIUS + (1 - INTRO_RADIUS) * ride);
  const height = orbit.height * (INTRO_HEIGHT + (1 - INTRO_HEIGHT) * ride);
  const angle = START_ANGLE + time * orbit.speed;
  return { position: [TARGET[0] + Math.sin(angle) * radius, height, TARGET[2] + Math.cos(angle) * radius], target: TARGET };
}
