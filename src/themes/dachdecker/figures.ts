// Minime figures of the Dachdecker theme as data (DESIGN-DACHDECKER.md "Figuren"): small blueprint workers with a helmet
// in the color of their type and their own tool, built from boxes, a sphere head and a dome helmet around joints, in a
// box one unit high. pose gives the joint angles of an animation over its run (0 to 1), starting and ending at rest, so
// the next action follows seamlessly. Check: figures.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import type { Point3 } from "../../core/three/beam.ts";

export const FIGURE_TYPES = ["dachdecker", "zimmerer", "spengler", "azubi", "polier"] as const;
export type FigureType = (typeof FIGURE_TYPES)[number];

// The types for the chat command !typ, with the words chatters may use
export const FIGURE_SET: MinimeVariantSet = {
  command: "!typ",
  label: "Typ",
  variants: [
    { id: "dachdecker", label: "Dachdecker", names: ["dachdecker", "decker"] },
    { id: "zimmerer", label: "Zimmerer", names: ["zimmerer", "zimmermann"] },
    { id: "spengler", label: "Spengler", names: ["spengler", "klempner"] },
    { id: "azubi", label: "Azubi", names: ["azubi", "lehrling"] },
    { id: "polier", label: "Polier", names: ["polier", "chef"] },
  ],
};
export type Joint = "torso" | "head" | "armL" | "armR" | "legL" | "legR" | "tool";
// tone: plan lines (body), helmet color of the type, tool (copper)
export type FigurePart = { joint: Joint; shape: "box" | "sphere" | "dome"; size: Point3; pivot: Point3; offset: Point3; tone: "line" | "helmet" | "tool" };

// Body in units of the figure height
const BODY: FigurePart[] = [
  { joint: "legL", shape: "box", size: [0.09, 0.36, 0.1], pivot: [-0.07, 0.36, 0], offset: [0, -0.18, 0], tone: "line" },
  { joint: "legR", shape: "box", size: [0.09, 0.36, 0.1], pivot: [0.07, 0.36, 0], offset: [0, -0.18, 0], tone: "line" },
  { joint: "torso", shape: "box", size: [0.26, 0.32, 0.14], pivot: [0, 0.36, 0], offset: [0, 0.16, 0], tone: "line" },
  { joint: "armL", shape: "box", size: [0.07, 0.3, 0.08], pivot: [-0.17, 0.66, 0], offset: [0, -0.15, 0], tone: "line" },
  { joint: "armR", shape: "box", size: [0.07, 0.3, 0.08], pivot: [0.17, 0.66, 0], offset: [0, -0.15, 0], tone: "line" },
  { joint: "head", shape: "sphere", size: [0.11, 0.11, 0.11], pivot: [0, 0.7, 0], offset: [0, 0.12, 0], tone: "line" },
  { joint: "head", shape: "dome", size: [0.13, 0.13, 0.13], pivot: [0, 0.7, 0], offset: [0, 0.15, 0], tone: "helmet" },
];

// The tool hangs at the right hand
const HAND: Point3 = [0.17, 0.36, 0];
const TOOLS: Record<FigureType, Pick<FigurePart, "size" | "offset">> = {
  dachdecker: { size: [0.04, 0.2, 0.04], offset: [0, -0.06, 0.06] }, // hammer
  zimmerer: { size: [0.03, 0.03, 0.28], offset: [0, -0.02, 0.12] }, // folding rule
  spengler: { size: [0.06, 0.06, 0.4], offset: [0, 0.02, 0.1] }, // gutter
  azubi: { size: [0.16, 0.12, 0.12], offset: [-0.17, 0.02, 0.1] }, // stack of tiles, held in front
  polier: { size: [0.05, 0.05, 0.24], offset: [0, -0.02, 0.08] }, // rolled plan
};

export function figure(type: FigureType): FigurePart[] {
  return [...BODY, { joint: "tool", shape: "box", pivot: HAND, tone: "tool", ...TOOLS[type] }];
}

export type Pose = Record<Joint, number> & { lift: number; bob: number };
const REST: Pose = { torso: 0, head: 0, armL: 0, armR: 0, legL: 0, legR: 0, tool: 0, lift: 0, bob: 0 };

// Every animation fades in and out with the envelope, so it starts and ends at rest; wave = how often a swing repeats
const envelope = (part: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, part)));
const swing = (part: number, times: number) => Math.sin(part * Math.PI * 2 * times);

const POSES: Record<string, (part: number) => Partial<Pose>> = {
  walk: part => ({ legL: 0.5 * swing(part, 4), legR: -0.5 * swing(part, 4), armL: -0.35 * swing(part, 4), armR: 0.35 * swing(part, 4), bob: 0.02 * Math.abs(swing(part, 4)) }),
  hammer: part => ({ armR: -1.4 + 0.6 * swing(part, 5), tool: 0.4 * swing(part, 5), torso: 0.1 }),
  measure: part => ({ armL: -1.2, armR: -1.2, tool: 1.2 * (0.5 + 0.5 * swing(part, 1)), head: 0.2 }),
  carry: part => ({ armL: -1.3, armR: -1.3, legL: 0.3 * swing(part, 3), legR: -0.3 * swing(part, 3) }),
  // The Azubi stumbles once in the middle of carrying
  carryStumble: part => ({ armL: -1.3, armR: -1.3, legL: 0.3 * swing(part, 3), legR: -0.3 * swing(part, 3), torso: part > 0.45 && part < 0.6 ? 0.35 : 0 }),
  climb: part => ({ armL: -2.6 + 0.4 * swing(part, 2), armR: -2.6 - 0.4 * swing(part, 2), legL: 0.6 * Math.max(0, swing(part, 2)), legR: 0.6 * Math.max(0, -swing(part, 2)) }),
  plan: part => ({ armL: -1.5, armR: -1.5, head: 0.3 * swing(part, 1), torso: 0.05 }),
  wave: part => ({ armL: -2.6 + 0.4 * swing(part, 3) }),
  snack: part => ({ armR: -2 + 0.3 * swing(part, 4), head: 0.15, legL: 1.2, legR: 1.2, bob: -0.18 }),
  tip: () => ({ lift: 0.12, armR: -2.8 }),
};

// Joint angles of animation at part (0 to 1 of its run); unknown animations stand still
export function pose(animation: string, part: number): Pose {
  const shape = POSES[animation];
  if (!shape) return REST;
  const weight = envelope(part);
  const angles = shape(part);
  return Object.fromEntries(Object.entries(REST).map(([joint, rest]) => [joint, rest + (angles[joint as keyof Pose] ?? 0) * weight])) as Pose;
}

export const ANIMATIONS = Object.keys(POSES);
