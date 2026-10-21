// Mango trees and mangos of the Plantage world as flat shapes (no outlines, light from the top left): trunk with a shade
// side, crown in three tones (dark bottom right, middle, light top left), hanging mangos with gloss. Every color mixes
// with the sky by the haze of its layer (air perspective); far trees carry no mangos. Shared by the PixiJS scene and the
// canvas clips. Check: tree.check.ts.
import { mixHex } from "../../core/color.ts";

export type Shape =
  | { kind: "circle"; x: number; y: number; r: number; color: string; alpha?: number }
  | { kind: "ellipse"; x: number; y: number; rx: number; ry: number; color: string; alpha?: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; radius?: number; color: string; alpha?: number };
export type TreeColors = { sky: string; trunk: string; trunkDark: string; leafDark: string; leaf: string; leafLight: string; mango: string; mangoBlush: string; gloss: string; shadow: string };

// fixed: shapes of the prototype (refs/starting.html) for a tree of scale 1, ground at y = 0
const BLOBS: readonly [number, number, number][] = [[-70, -220, 78], [60, -230, 82], [0, -290, 88], [-30, -170, 66], [55, -165, 64]];
const MANGOS: readonly [number, number][] = [[-60, -170], [-20, -150], [40, -160], [80, -190], [-90, -200], [10, -200]];
const MANGO_SIZE = 14;
const SHADOW = 0.22;
// Trees hazier than this carry no mangos
export const MANGO_HAZE = 0.5;

// A mango hanging at x, y with the given radius: blush body, mango body shifted to the top left, gloss spot
export function mango(x: number, y: number, size: number, colors: Pick<TreeColors, "mango" | "mangoBlush" | "gloss">, tint = (color: string) => color): Shape[] {
  return [
    { kind: "ellipse", x, y, rx: size * 0.82, ry: size, color: tint(colors.mangoBlush) },
    { kind: "ellipse", x: x - size * 0.12, y: y - size * 0.12, rx: size * 0.66, ry: size * 0.8, color: tint(colors.mango) },
    { kind: "circle", x: x - size * 0.3, y: y - size * 0.38, r: size * 0.18, color: tint(colors.gloss), alpha: 0.9 },
  ];
}

// A tree of the given scale in a layer with the given haze; mangos = false leaves the crown bare
export function tree(scale: number, haze: number, colors: TreeColors, mangos = true): Shape[] {
  const tint = (color: string) => mixHex(color, colors.sky, haze);
  const shapes: Shape[] = [
    { kind: "ellipse", x: 0, y: 0, rx: 120 * scale, ry: 18 * scale, color: colors.shadow, alpha: SHADOW * (1 - haze) },
    { kind: "rect", x: -14 * scale, y: -170 * scale, w: 28 * scale, h: 175 * scale, radius: 10 * scale, color: tint(colors.trunk) },
    { kind: "rect", x: 2 * scale, y: -170 * scale, w: 12 * scale, h: 175 * scale, color: tint(colors.trunkDark) },
    ...BLOBS.map(([x, y, radius]): Shape => ({ kind: "circle", x: (x + 10) * scale, y: (y + 12) * scale, r: radius * scale, color: tint(colors.leafDark) })),
    ...BLOBS.map(([x, y, radius]): Shape => ({ kind: "circle", x: x * scale, y: y * scale, r: radius * scale * 0.92, color: tint(colors.leaf) })),
    ...BLOBS.map(([x, y, radius]): Shape => ({ kind: "circle", x: (x - 18) * scale, y: (y - 22) * scale, r: radius * scale * 0.5, color: tint(colors.leafLight) })),
  ];
  if (mangos && haze < MANGO_HAZE) shapes.push(...MANGOS.flatMap(([x, y]) => mango(x * scale, y * scale, MANGO_SIZE * scale, colors, tint)));
  return shapes;
}

// Lean of a swaying tree (skew) at a time in s; amount 1 = the sway of the prototype; grass sways faster and further
export const SWAY = { tree: { speed: 0.9, size: 0.02 }, grass: { speed: 1.6, size: 0.08 } } as const;
export const swayAt = (seconds: number, phase: number, amount: number, kind: keyof typeof SWAY = "tree") => Math.sin(seconds * SWAY[kind].speed + phase) * SWAY[kind].size * amount;
