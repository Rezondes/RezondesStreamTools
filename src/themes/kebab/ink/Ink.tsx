// One part of a line drawing (InkPart from chef.ts) as SVG: paper fills first, then every line as a Rough.js path in
// one stroke (roughPath with single) and the dots. Colors come from the CSS of the theme (kb-ink, kb-fill, kb-dot).
import { useMemo } from "react";
import { roughPath } from "../../../core/rough/roughSvg.ts";
import type { InkPart } from "../chef.ts";

export type InkStyle = { roughness: number; bowing: number; width: number; seed: number };

export default function Ink({ part, style, salt }: { part: InkPart; style: InkStyle; salt: number }) {
  const lines = useMemo(() => part.lines.flatMap((line, index) => roughPath(line.shape, {
    roughness: style.roughness, bowing: style.bowing, strokeWidth: line.width * style.width, fill: "none", single: true,
  }, style.seed + salt + index).map(drawn => ({ d: drawn.d, width: line.width * style.width }))), [part, style, salt]);
  return (
    <>
      {part.fills.map(fill => <path key={fill} className="kb-fill" d={fill} />)}
      {lines.map((line, index) => <path key={index} className="kb-ink" d={line.d} strokeWidth={line.width} />)}
      {part.dots.map(dot => <circle key={`${dot.x}-${dot.y}`} className={dot.filled ? "kb-dot filled" : "kb-dot"} cx={dot.x} cy={dot.y} r={dot.radius} />)}
    </>
  );
}
