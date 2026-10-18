// Shapes of the mango plantation and the symbols of the Plantage theme as SVG paths (text), plus path building blocks
// for circles, stars and rolling hills. Only shapes, no colors: the scenes color the parts via CSS classes (settings).
// Check: field.check.ts.
import { hash } from "../../core/hash.ts";

// Part of a shape: main/detail = area in main or detail color, line = line only
type ShapePart = { kind: "main" | "detail" | "line"; d: string };
export type Shape = { viewBox: string; parts: readonly ShapePart[] };

const round = (value: number) => Math.round(value * 10) / 10;

// Circle as a path (two arcs), so everything is drawn uniformly as <path>
export const circle = (x: number, y: number, radius: number) =>
  `M${round(x - radius)} ${y} a${radius} ${radius} 0 1 0 ${radius * 2} 0 a${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;

// Star or spiky circle: count points around (x, y), points on radius, valleys depth further inside
export function spikes(x: number, y: number, radius: number, depth: number, count: number) {
  const points = Array.from({ length: count * 2 }, (_, index) => {
    const angle = (index * Math.PI) / count - Math.PI / 2;
    const reach = index % 2 ? radius - depth : radius;
    return `${round(x + reach * Math.cos(angle))} ${round(y + reach * Math.sin(angle))}`;
  });
  return `M${points.join(" L")} Z`;
}

// Rolling hill line: top edge as a sine around top (amplitude, wavelength), closed at the bottom down to bottom
export function hillPath(width: number, amplitude: number, wavelength: number, top: number, bottom: number) {
  const steps = Math.max(1, Math.round((width / wavelength) * 16));
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const x = (index / steps) * width;
    return `${round(x)} ${round(top + amplitude * Math.sin((x / wavelength) * 2 * Math.PI))}`;
  });
  return `M0 ${bottom} L${points.join(" L")} L${width} ${bottom} Z`;
}

// A round blob of a cluster (leaf bunch of a tree crown, puff of a cloud)
export type Blob = { x: number; y: number; radius: number };

// Cluster of count blobs inside the ellipse (cx, cy, rx, ry); seed makes every crown or cloud look different, the same
// seed always gives the same cluster. Radii between a third and a half of rx.
export function blobs(seed: number, count: number, cx: number, cy: number, rx: number, ry: number): Blob[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * 2 * Math.PI + hash(seed * 31 + index) * 0.8;
    const reach = 0.3 + hash(seed * 17 + index) * 0.7;
    const radius = rx * (0.32 + hash(seed * 7 + index) * 0.18);
    return { x: round(cx + Math.cos(angle) * (rx - radius) * reach), y: round(cy + Math.sin(angle) * (ry - radius * 0.6) * reach), radius: round(radius) };
  });
}

// Furrows of a field in perspective: count lines from near the vanishing point at the horizon (top) spreading to the
// bottom edge, as one path
export function furrows(width: number, top: number, bottom: number, count: number, vanishX: number) {
  return Array.from({ length: count + 1 }, (_, index) => {
    const end = (index / count) * width * 1.6 - width * 0.3;
    const start = vanishX + (end - vanishX) * 0.12;
    return `M${round(start)} ${top} L${round(end)} ${bottom}`;
  }).join(" ");
}

// A mango (100 x 100): body and a leaf at the stem
const MANGO_BODY = "M48 12 C74 10 92 36 86 64 C80 90 50 98 30 86 C12 75 12 46 26 28 C32 19 40 13 48 12 Z";

// Leaf of the alerts and the camera frame
export const LEAF: Shape = {
  viewBox: "0 0 160 80",
  parts: [
    { kind: "main", d: "M4 70 C30 18 96 2 156 14 C112 30 62 52 4 70 Z" },
    { kind: "line", d: "M4 70 C50 42 100 22 156 14 M40 46 L34 32 M70 34 L66 18 M100 24 L98 10 M52 42 L60 54 M86 30 L96 40" },
  ],
};
// Crop duster pulling the ticker
export const PLANE: Shape = {
  viewBox: "0 0 120 60",
  parts: [
    { kind: "main", d: "M10 30 L84 26 C100 26 112 28 116 32 C112 36 100 38 84 38 L10 34 Z M40 26 L34 4 L48 4 L60 26 Z M40 38 L34 56 L48 56 L60 38 Z M12 30 L4 18 L12 18 L22 30 Z" },
    { kind: "detail", d: "M116 22 L118 22 L118 42 L116 42 Z" },
  ],
};

// Symbols of the alerts (and decoration), each in 100 x 100
export const ICONS = {
  mango: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: MANGO_BODY },
    { kind: "detail", d: "M50 13 C58 4 70 2 80 6 C72 14 60 16 50 13 Z" },
  ] },
  blatt: { viewBox: "0 0 100 100", parts: [
    { kind: "detail", d: "M10 90 C10 40 40 10 92 8 C88 60 60 90 10 90 Z" },
    { kind: "line", d: "M10 90 C40 60 66 36 92 8 M36 64 L30 48 M56 44 L54 26 M44 56 L60 62 M64 34 L80 40" },
  ] },
  kiste: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M8 30 L92 30 L92 92 L8 92 Z" },
    { kind: "line", d: "M8 52 L92 52 M8 72 L92 72" },
    { kind: "detail", d: `${circle(30, 26, 12)} ${circle(54, 22, 12)} ${circle(76, 26, 12)}` },
  ] },
  korb: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M10 44 L90 44 L78 92 L22 92 Z" },
    { kind: "line", d: "M14 58 L86 58 M18 74 L82 74 M30 44 L34 92 M50 44 L50 92 M70 44 L66 92 M20 44 C20 10 80 10 80 44" },
    { kind: "detail", d: `${circle(36, 40, 10)} ${circle(58, 36, 10)}` },
  ] },
  leiter: { viewBox: "0 0 100 100", parts: [
    { kind: "line", d: "M30 6 L22 96 M70 6 L78 96 M28 22 L72 22 M26 42 L74 42 M24 62 L76 62 M23 82 L77 82" },
  ] },
  sonne: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: circle(50, 50, 22) },
    { kind: "line", d: "M50 6 L50 20 M50 80 L50 94 M6 50 L20 50 M80 50 L94 50 M19 19 L29 29 M71 71 L81 81 M81 19 L71 29 M29 71 L19 81" },
  ] },
  baum: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M44 96 L46 60 L54 60 L56 96 Z" },
    { kind: "detail", d: "M50 6 C76 6 94 24 92 46 C90 64 72 70 50 68 C28 70 10 64 8 46 C6 24 24 6 50 6 Z" },
  ] },
  stern: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: spikes(50, 52, 44, 24, 5) },
  ] },
} as const satisfies Record<string, Shape>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
