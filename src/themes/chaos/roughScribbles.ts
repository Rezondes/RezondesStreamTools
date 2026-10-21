// Rough.js scribbles of the Chaos theme (DESIGN-CHAOS.md "Modernisierung"): star, heart, circle, bolt and crown drawn
// with jitter and a filled inside (hachure, cross-hatch, zigzag, dashed) through roughPath of the core, in pixels around
// 0 for a mark of the given size. The same seed gives the same sketch, another seed another take of it (boiling).
// Check: roughScribbles.check.ts.
import { type RoughPart, roughPath, type RoughShape, type RoughStyle } from "../../core/rough/roughSvg.ts";

export const ROUGH_KINDS = ["star", "heart", "circle", "bolt", "crown"] as const;
export type RoughKind = (typeof ROUGH_KINDS)[number];

// fixed: how each kind is filled
const FILLS: Record<RoughKind, RoughStyle["fill"]> = { star: "hachure", heart: "cross-hatch", circle: "zigzag", bolt: "hachure", crown: "dashed" };
// fixed: the hand of the prototype: roughness, bowing
const HAND = { roughness: 1.8, bowing: 2 };

function shapeOf(kind: RoughKind, radius: number): RoughShape {
  switch (kind) {
    case "star": return { kind: "polygon", points: Array.from({ length: 10 }, (_, index) => {
      const [angle, reach] = [-Math.PI / 2 + (index * Math.PI) / 5, index % 2 ? radius * 0.45 : radius];
      return [Math.cos(angle) * reach, Math.sin(angle) * reach] as [number, number];
    }) };
    case "heart": return { kind: "path", d: `M0 ${radius * 0.8} C${-radius * 1.6} ${-radius * 0.2} ${-radius * 0.6} ${-radius * 1.2} 0 ${-radius * 0.3} C${radius * 0.6} ${-radius * 1.2} ${radius * 1.6} ${-radius * 0.2} 0 ${radius * 0.8}Z` };
    case "circle": return { kind: "ellipse", x: 0, y: 0, width: radius * 2, height: radius * 2 };
    case "bolt": return { kind: "polygon", points: [[-0.3, -1], [0.5, -1], [0, -0.1], [0.6, -0.1], [-0.4, 1], [-0.05, 0.05], [-0.5, 0.05]].map(([x, y]) => [x * radius, y * radius] as [number, number]) };
    case "crown": return { kind: "polygon", points: [[-1, 0.6], [-1, -0.3], [-0.5, 0.1], [0, -0.7], [0.5, 0.1], [1, -0.3], [1, 0.6]].map(([x, y]) => [x * radius, y * radius] as [number, number]) };
  }
}

// One Rough scribble of size px (its width and height), stroke width in px; fill = false leaves the inside empty
export function roughScribble(kind: RoughKind, size: number, seed: number, strokeWidth: number, fill: boolean): RoughPart[] {
  return roughPath(shapeOf(kind, size / 2), { ...HAND, strokeWidth, fill: fill ? FILLS[kind] : "none" }, seed);
}
