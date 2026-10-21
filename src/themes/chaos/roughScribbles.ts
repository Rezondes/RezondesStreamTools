// Rough.js scribbles of the Chaos theme (DESIGN-CHAOS.md "Modernisierung"): star, heart, circle, bolt and crown drawn
// with jitter and a filled inside (hachure, cross-hatch, zigzag, dashed) through roughPath of the core, in pixels around
// 0 for a mark of the given size. The same seed gives the same sketch, another seed another take of it (boiling).
// Check: roughScribbles.check.ts.
import { hash } from "../../core/hash.ts";
import { type RoughPart, roughPath, type RoughShape, type RoughStyle } from "../../core/rough/roughSvg.ts";
import { chance } from "./chance.ts";
import { TAKES } from "./idle.ts";
import { type Scribble, scribbleShape } from "./scribbles.ts";

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

// One take of a scribble: rough ones in pixels around the mark, the others in the unit of the mark (scaled by its size)
export type ScribbleTake = { rough: boolean; parts: RoughPart[] };
export type RoughMix = { share: number; fill: boolean; width: number };

// The three takes of scribble index of a layout with seed base: a share of the marks become Rough shapes with a filled
// inside, the others keep their hand in take 0 and get other hands of the same kind in the next takes
export function scribbleTakes(mark: Scribble, index: number, base: number, rough: RoughMix): ScribbleTake[] {
  const takeSeed = (take: number) => base * 101 + index * 7 + take * 5003;
  if (hash(base * 13 + index) < rough.share) {
    const kind = ROUGH_KINDS[Math.floor(hash(base * 17 + index) * ROUGH_KINDS.length)];
    return Array.from({ length: TAKES }, (_, take) => ({ rough: true, parts: roughScribble(kind, mark.size, takeSeed(take), mark.width * rough.width, rough.fill) }));
  }
  return Array.from({ length: TAKES }, (_, take) => ({ rough: false, parts: (take === 0 ? mark.paths : scribbleShape(mark.kind, chance(takeSeed(take)))).map(path => ({ d: path, filled: false })) }));
}
