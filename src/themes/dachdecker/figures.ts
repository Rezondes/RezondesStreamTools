// Minime figures of the Dachdecker theme as data (DESIGN-DACHDECKER.md "Figuren"): small blueprint workers with a hard
// hat and a reflective stripe in the color of their type, boots, belt, hands and their own tool made of several parts,
// built from capsules, cylinders, boxes and spheres around joints, in a box one unit high. pose gives the joint angles of an animation over its run (0 to 1), starting and ending at rest, so
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
// Shapes and what size means for them: box [width, height, depth], sphere and dome [radius], capsule [radius, length],
// cylinder [top radius, height, bottom radius], gutter = open half cylinder [radius, length]
export type FigureShape = "box" | "sphere" | "dome" | "capsule" | "cylinder" | "gutter";
// tone: solid colors of the settings (skin, shirt, pants, boots and belt, metal, helmet and stripe in the color of the
// type, tool wood or copper, tile terracotta, paper); turn: own rotation of the part; lifts: rises when the figure tips its hat
export type FigureTone = "skin" | "shirt" | "pants" | "boots" | "metal" | "helmet" | "tool" | "tile" | "paper";
export type FigurePart = { joint: Joint; shape: FigureShape; size: Point3; pivot: Point3; offset: Point3; tone: FigureTone; turn?: Point3; lifts?: boolean };

const HIP_L: Point3 = [-0.065, 0.36, 0];
const HIP_R: Point3 = [0.065, 0.36, 0];
const WAIST: Point3 = [0, 0.36, 0];
const SHOULDER_L: Point3 = [-0.155, 0.64, 0];
const SHOULDER_R: Point3 = [0.155, 0.64, 0];
const NECK: Point3 = [0, 0.68, 0];
const QUARTER = Math.PI / 2;

// Body in units of the figure height: legs in work pants with boots, shirt with belt and reflective stripe, arms with
// hands, head with eyes, hard hat and brim
const BODY: FigurePart[] = [
  { joint: "legL", shape: "capsule", size: [0.05, 0.22, 0], pivot: HIP_L, offset: [0, -0.16, 0], tone: "pants" },
  { joint: "legL", shape: "box", size: [0.1, 0.06, 0.15], pivot: HIP_L, offset: [0, -0.33, 0.025], tone: "boots" },
  { joint: "legR", shape: "capsule", size: [0.05, 0.22, 0], pivot: HIP_R, offset: [0, -0.16, 0], tone: "pants" },
  { joint: "legR", shape: "box", size: [0.1, 0.06, 0.15], pivot: HIP_R, offset: [0, -0.33, 0.025], tone: "boots" },
  { joint: "torso", shape: "cylinder", size: [0.13, 0.3, 0.115], pivot: WAIST, offset: [0, 0.15, 0], tone: "shirt" },
  { joint: "torso", shape: "cylinder", size: [0.119, 0.045, 0.119], pivot: WAIST, offset: [0, 0.02, 0], tone: "boots" },
  { joint: "torso", shape: "cylinder", size: [0.129, 0.035, 0.125], pivot: WAIST, offset: [0, 0.19, 0], tone: "helmet" },
  { joint: "armL", shape: "capsule", size: [0.038, 0.19, 0], pivot: SHOULDER_L, offset: [0, -0.12, 0], tone: "shirt" },
  { joint: "armL", shape: "sphere", size: [0.042, 0, 0], pivot: SHOULDER_L, offset: [0, -0.27, 0], tone: "skin" },
  { joint: "armR", shape: "capsule", size: [0.038, 0.19, 0], pivot: SHOULDER_R, offset: [0, -0.12, 0], tone: "shirt" },
  { joint: "armR", shape: "sphere", size: [0.042, 0, 0], pivot: SHOULDER_R, offset: [0, -0.27, 0], tone: "skin" },
  { joint: "head", shape: "sphere", size: [0.1, 0, 0], pivot: NECK, offset: [0, 0.12, 0], tone: "skin" },
  { joint: "head", shape: "sphere", size: [0.014, 0, 0], pivot: NECK, offset: [-0.035, 0.13, 0.092], tone: "metal" },
  { joint: "head", shape: "sphere", size: [0.014, 0, 0], pivot: NECK, offset: [0.035, 0.13, 0.092], tone: "metal" },
  { joint: "head", shape: "dome", size: [0.115, 0, 0], pivot: NECK, offset: [0, 0.15, 0], tone: "helmet", lifts: true },
  { joint: "head", shape: "cylinder", size: [0.145, 0.014, 0.145], pivot: NECK, offset: [0, 0.15, 0.015], tone: "helmet", lifts: true },
];

// The tool sits in the right hand; its parts in units of the figure height, forward is +z
const HAND: Point3 = [0.155, 0.37, 0];
type ToolPart = Pick<FigurePart, "shape" | "size" | "offset" | "tone" | "turn">;
const TOOLS: Record<FigureType, ToolPart[]> = {
  // Hammer: handle forward, head across
  dachdecker: [
    { shape: "cylinder", size: [0.014, 0.18, 0.014], offset: [0, 0, 0.08], tone: "tool", turn: [QUARTER, 0, 0] },
    { shape: "box", size: [0.035, 0.1, 0.035], offset: [0, 0.02, 0.17], tone: "metal" },
  ],
  // Folding rule, half unfolded
  zimmerer: [
    { shape: "box", size: [0.026, 0.01, 0.15], offset: [0, 0, 0.075], tone: "tool" },
    { shape: "box", size: [0.026, 0.01, 0.15], offset: [0, 0.05, 0.19], tone: "tool", turn: [-0.7, 0, 0] },
  ],
  // Gutter over the shoulder line, open at the top
  spengler: [
    { shape: "gutter", size: [0.045, 0.42, 0], offset: [0, 0.03, 0.08], tone: "tool", turn: [QUARTER, 0, Math.PI] },
  ],
  // Stack of tiles carried in front with both hands
  azubi: [
    { shape: "box", size: [0.2, 0.024, 0.11], offset: [-0.155, 0.01, 0.1], tone: "tile" },
    { shape: "box", size: [0.2, 0.024, 0.11], offset: [-0.155, 0.04, 0.1], tone: "tile" },
    { shape: "box", size: [0.2, 0.024, 0.11], offset: [-0.155, 0.07, 0.1], tone: "tile" },
  ],
  // Rolled plan with a band
  polier: [
    { shape: "cylinder", size: [0.03, 0.26, 0.03], offset: [0, 0, 0.08], tone: "paper", turn: [QUARTER, 0, 0] },
    { shape: "cylinder", size: [0.033, 0.03, 0.033], offset: [0, 0, 0.08], tone: "tool", turn: [QUARTER, 0, 0] },
  ],
};

export function figure(type: FigureType): FigurePart[] {
  return [...BODY, ...TOOLS[type].map(part => ({ ...part, joint: "tool" as const, pivot: HAND }))];
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
