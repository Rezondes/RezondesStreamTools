// Minime figures as data for the 3D themes (plans/PLAN-GRAFIK.md): a figure is a list of parts (capsules, cylinders,
// boxes, spheres) around joints, in a box one unit high, colored by tone; a pose gives the joint angles of an animation
// over its run (0 to 1). The theme supplies its parts and its moves, PartFigure.tsx draws them. Check: figure.check.ts.
import type { Point3 } from "./beam.ts";

export type Joint = "torso" | "head" | "armL" | "armR" | "legL" | "legR" | "tool";
// Shapes and what size means for them: box [width, height, depth], sphere and dome [radius], capsule [radius, length],
// cylinder [top radius, height, bottom radius], gutter = open half cylinder [radius, length]
type FigureShape = "box" | "sphere" | "dome" | "capsule" | "cylinder" | "gutter";
// tone: a color of the theme's looks; turn: own rotation of the part; lifts: rises with the pose's lift (tipping the
// hat); blinks: closes when the figure blinks or lies down (eyes)
export type FigurePart<Tone extends string = string> = {
  joint: Joint; shape: FigureShape; size: Point3; pivot: Point3; offset: Point3; tone: Tone; turn?: Point3; lifts?: boolean; blinks?: boolean;
};

// Joint angles in radians around x; lift raises the lifting parts, bob moves the whole figure up or down (in figure
// heights), fall tips it over to lying (1 = flat), turn swings it around the vertical axis
export type Pose = Record<Joint, number> & { lift: number; bob: number; fall: number; turn: number };
export const REST: Pose = { torso: 0, head: 0, armL: 0, armR: 0, legL: 0, legR: 0, tool: 0, lift: 0, bob: 0, fall: 0, turn: 0 };

// A move: the shape of the pose over the run, faded in and out by its weight (default: the envelope, at rest at both ends)
export type PoseShape = (part: number) => Partial<Pose>;
export type PoseMove = PoseShape | { shape: PoseShape; weight: (part: number) => number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));
// Soft in and out over the whole run
export const envelope = (part: number) => Math.sin(Math.PI * clamp(part));
// Quickly in, held, quickly out: edge = share of the run for each ramp
export const plateau = (edge: number) => (part: number) => clamp(Math.min(part, 1 - part) / edge);
export const swing = (part: number, times: number) => Math.sin(part * Math.PI * 2 * times);

// The pose function of a set of moves: joint angles of an animation at part; unknown animations stand still
export function poser(moves: Readonly<Record<string, PoseMove>>) {
  return (animation: string, part: number): Pose => {
    const move = moves[animation];
    if (!move) return REST;
    const { shape, weight } = typeof move === "function" ? { shape: move, weight: envelope } : move;
    const share = weight(part);
    const angles = shape(part);
    return Object.fromEntries(Object.entries(REST).map(([key, rest]) => [key, rest + (angles[key as keyof Pose] ?? 0) * share])) as Pose;
  };
}
