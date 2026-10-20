// Big gestures of the Chaos theme: brush strokes with a ragged body, bristle tracks along the whole length, a dry tail,
// splatter and drips, the composition of strokes per scene (two X, one X, one stroke, none), and the spray of a title
// (drips under the letters, speckles around it). Never symmetric: sizes, angles and crossings differ, and each scene
// moves its strokes a little by its own seed. Only shapes and places in stage pixels; colors come from the settings.
// Pure and deterministic. Check: strokes.check.ts.
import { between, chance, weighted, type Chance } from "./chance.ts";
import { linePath, smoothPath, type Point } from "./paths.ts";

export type Bristle = { d: string; width: number; opacity: number; light: boolean };
export type Drop = { x: number; y: number; radiusX: number; radiusY: number; opacity: number };
export type BrushStroke = { body: string; bristles: Bristle[]; tail: Bristle[]; drops: Drop[]; drips: string[] };

const BODY_STEPS = 30;
const BRISTLES = 140;
const TAIL = 26;
const DROPS = 70;
const DRIPS = 7;

// A drip: a thin streak down from y with a round drop at its end
export const dripPath = (x: number, y: number, length: number, thickness: number) =>
  `M${x - thickness / 2} ${y} L${x - thickness * 0.35} ${y + length} Q${x} ${y + length + thickness * 1.4} ${x + thickness * 0.35} ${y + length} L${x + thickness / 2} ${y} Z`;

// One brush stroke from one point to another, width in stage pixels
export function brushStroke(from: Point, to: Point, width: number, random: Chance): BrushStroke {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [alongX, alongY, acrossX, acrossY] = [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle)];
  const point = (share: number, offset: number): Point => [from[0] + alongX * share * length + acrossX * offset, from[1] + alongY * share * length + acrossY * offset];
  const half = width / 2;
  const edge = (side: number) => Array.from({ length: BODY_STEPS + 1 }, (_, step) => {
    const share = step / BODY_STEPS;
    const taper = Math.min(1, share * 6, (1 - share) * 4);
    return point(share + between(random, -0.004, 0.004), side * half * taper * between(random, 0.86, 1));
  });
  const body = `${linePath(edge(-1))} L${linePath(edge(1).reverse()).slice(1)} Z`;
  const bristles = Array.from({ length: BRISTLES }, () => {
    const offset = between(random, -half, half);
    const [start, end] = [between(random, -0.02, 0.25), between(random, 0.7, 1.04)];
    const points = Array.from({ length: 9 }, (_, step) => point(start + (end - start) * (step / 8), offset + between(random, -2, 2)));
    return { d: smoothPath(points), width: between(random, 0.8, 3.5), opacity: between(random, 0.2, 0.55), light: random() < 0.55 };
  });
  const tail = Array.from({ length: TAIL }, () => {
    const offset = between(random, -half, half) * 0.9;
    const begin = between(random, 0.88, 0.97);
    return { d: linePath([point(begin, offset), point(begin + between(random, 0.03, 0.12), offset + between(random, -6, 6))]), width: between(random, 1, 4), opacity: between(random, 0.4, 1), light: false };
  });
  const drops = Array.from({ length: DROPS }, () => {
    const [x, y] = point(between(random, 0, 1), between(random, -1, 1) * width * between(random, 0.55, 1.6));
    const radius = weighted(random, [[between(random, 0.8, 2), 70], [between(random, 2, 5), 25], [between(random, 5, 9), 5]]);
    return { x, y, radiusX: radius, radiusY: radius * between(random, 0.6, 1.6), opacity: between(random, 0.5, 1) };
  });
  const drips = Array.from({ length: DRIPS }, () => {
    const [x, y] = point(between(random, 0.15, 0.85), half * 0.8);
    return dripPath(x, y, between(random, 30, 150), between(random, 4, 10));
  });
  return { body, bristles, tail, drops, drips };
}

// Composition of a scene: two X (cyan left, magenta right, plus a loose stroke of the other color each), one X or one
// stroke in the main color of the scene, or none
export type GestureKind = "zweix" | "x" | "strich" | "keine";
export type GestureColor = "cyan" | "magenta" | "main";
export type GestureStroke = { from: Point; to: Point; width: number; color: GestureColor };

// Stage pixels of each composition (the two X as approved with the style sample)
const COMPOSITIONS: Record<GestureKind, readonly GestureStroke[]> = {
  zweix: [
    { from: [60, 340], to: [1010, 990], width: 210, color: "cyan" },
    { from: [780, 110], to: [150, 930], width: 115, color: "cyan" },
    { from: [1480, 860], to: [1900, 690], width: 60, color: "cyan" },
    { from: [1210, 40], to: [1640, 780], width: 125, color: "magenta" },
    { from: [1900, 240], to: [990, 660], width: 175, color: "magenta" },
    { from: [40, 120], to: [430, 40], width: 55, color: "magenta" },
  ],
  x: [
    { from: [520, 170], to: [1420, 900], width: 210, color: "main" },
    { from: [1440, 190], to: [520, 880], width: 160, color: "main" },
  ],
  strich: [{ from: [260, 820], to: [1680, 250], width: 230, color: "main" }],
  keine: [],
};
// How far a scene moves the ends of its strokes and changes their width
const SHIFT = 28;
const WIDEN = 0.12;

export function gestureLayout(kind: GestureKind, seed: number): GestureStroke[] {
  const random = chance(seed);
  const shift = ([x, y]: Point): Point => [x + between(random, -SHIFT, SHIFT), y + between(random, -SHIFT, SHIFT)];
  return COMPOSITIONS[kind].map(stroke => ({ ...stroke, from: shift(stroke.from), to: shift(stroke.to), width: stroke.width * between(random, 1 - WIDEN, 1 + WIDEN) }));
}

// Drips under a title: where (share of its width), how thick and how long (pixels)
export type TitleDrip = { at: number; thickness: number; length: number };
export const titleDrips = (seed: number, count: number): TitleDrip[] => {
  const random = chance(seed);
  return Array.from({ length: count }, () => ({ at: between(random, 0.04, 0.96), thickness: between(random, 5, 11), length: between(random, 25, 140) }));
};

// Spray speckles around a box of the given size (pixels, origin top left), a few of them in the hot color
export type Speckle = { x: number; y: number; radius: number; opacity: number; hot: boolean };
const SPECKLE_REACH = 40;
export const speckles = (seed: number, width: number, height: number, count: number): Speckle[] => {
  const random = chance(seed);
  return Array.from({ length: count }, () => ({
    x: between(random, -SPECKLE_REACH, width + SPECKLE_REACH),
    y: between(random, -SPECKLE_REACH * 0.75, height + SPECKLE_REACH),
    radius: weighted(random, [[0.8, 70], [1.6, 25], [2.8, 5]]),
    opacity: between(random, 0.25, 0.9),
    hot: random() >= 0.85,
  }));
};
