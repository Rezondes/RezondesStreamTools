// A shape from field.ts as SVG; the parts carry the classes part-main, part-detail and part-line, the colors are set by
// the scene's CSS. Filled parts get a sheen on top (light from above, shade below), so the symbols have the same depth
// as the illustrated backdrop. Decoration, so hidden from screen readers.
import { useId } from "react";
import type { Shape } from "./field.ts";

export default function ShapeIcon({ shape, className = "" }: { shape: Shape; className?: string }) {
  const sheen = `pl-sheen-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg className={`pl-shape ${className}`} viewBox={shape.viewBox} aria-hidden="true">
      <defs>
        <linearGradient id={sheen} x1="0" y1="0" x2="0.35" y2="1">
          <stop className="pl-stop-sheen-light" offset="0" />
          <stop className="pl-stop-sheen-clear" offset="0.5" />
          <stop className="pl-stop-sheen-shade" offset="1" />
        </linearGradient>
      </defs>
      {shape.parts.map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
      {shape.parts.filter(part => part.kind !== "line").map((part, index) => <path key={`sheen-${index}`} className="part-sheen" d={part.d} fill={`url(#${sheen})`} />)}
    </svg>
  );
}
