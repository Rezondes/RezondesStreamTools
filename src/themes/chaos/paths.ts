// Path text building blocks of the Chaos theme: a smooth line through points (Catmull-Rom as cubic Bezier), a straight
// polyline, hand-made wobble and points on a circle. Pure; used by scribbles.ts and strokes.ts. Check: paths.check.ts.
import { between, type Chance } from "./chance.ts";

export type Point = readonly [number, number];

// Three decimals: shapes live in a unit box and are scaled up later
const exact = (value: number) => Number(value.toFixed(3));
const at = ([x, y]: Point) => `${exact(x)} ${exact(y)}`;

// Smooth line through every point; closed joins the last point back to the first
export function smoothPath(points: readonly Point[], closed = false): string {
  const point = (index: number) => points[closed ? (index + points.length) % points.length : Math.max(0, Math.min(points.length - 1, index))];
  const segments = closed ? points.length : points.length - 1;
  let path = `M${at(points[0])}`;
  for (let index = 0; index < segments; index++) {
    const [before, from, to, after] = [point(index - 1), point(index), point(index + 1), point(index + 2)];
    const first: Point = [from[0] + (to[0] - before[0]) / 6, from[1] + (to[1] - before[1]) / 6];
    const second: Point = [to[0] - (after[0] - from[0]) / 6, to[1] - (after[1] - from[1]) / 6];
    path += ` C${at(first)} ${at(second)} ${at(to)}`;
  }
  return closed ? `${path} Z` : path;
}

// Straight polyline through every point
export const linePath = (points: readonly Point[]) => `M${points.map(at).join(" L")}`;

// Every point moved a little at random, like a hand that does not hit the same spot twice
export const wobble = (random: Chance, points: readonly Point[], amount: number): Point[] =>
  points.map(([x, y]) => [x + between(random, -amount, amount), y + between(random, -amount, amount)]);

// Point at a radius and angle (radians) around the origin
export const polar = (radius: number, angle: number): Point => [Math.cos(angle) * radius, Math.sin(angle) * radius];

// Every number pair of a path, for checks of where a shape lies
export const pointsOf = (path: string): Point[] =>
  [...path.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(([, x, y]) => [Number(x), Number(y)]);
