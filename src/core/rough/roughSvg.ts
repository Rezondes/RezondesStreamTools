// Sketched shapes with Rough.js as SVG paths (plans/PLAN-GRAFIK.md, package 5): only shapes, no colors (the theme colors
// them through its settings). A fixed seed makes the same sketch in scene and clip.
import rough from "roughjs";

export type RoughShape =
  | { kind: "line"; from: [number, number]; to: [number, number] }
  | { kind: "rectangle"; x: number; y: number; width: number; height: number }
  | { kind: "ellipse"; x: number; y: number; width: number; height: number }
  | { kind: "polygon"; points: [number, number][] }
  | { kind: "path"; d: string };

export type RoughStyle = { roughness: number; bowing: number; strokeWidth: number; fill: "none" | "hachure" | "solid" | "zigzag" | "cross-hatch" | "dots" | "dashed" };

// One path per part: the outline and, if filled, the fill strokes
export type RoughPart = { d: string; filled: boolean };

const generator = rough.generator();

type Options = Parameters<typeof generator.line>[4];

function drawableOf(shape: RoughShape, options: Options) {
  switch (shape.kind) {
    case "line": return generator.line(shape.from[0], shape.from[1], shape.to[0], shape.to[1], options);
    case "rectangle": return generator.rectangle(shape.x, shape.y, shape.width, shape.height, options);
    case "ellipse": return generator.ellipse(shape.x, shape.y, shape.width, shape.height, options);
    case "polygon": return generator.polygon(shape.points, options);
    case "path": return generator.path(shape.d, options);
  }
}

export function roughPath(shape: RoughShape, style: RoughStyle, seed: number): RoughPart[] {
  // Rough.js needs a seed from 1 up; 0 would mean "random"
  const options = { seed: Math.max(1, Math.floor(seed)), roughness: style.roughness, bowing: style.bowing, strokeWidth: style.strokeWidth, ...(style.fill === "none" ? {} : { fill: "#000", fillStyle: style.fill }) };
  const drawable = drawableOf(shape, options);
  // toPaths gives one path per set; the set type tells outline ("path") from fill ("fillSketch", "fillPath")
  return generator.toPaths(drawable).map((path, index) => ({ d: path.d, filled: drawable.sets[index]?.type !== "path" }));
}
