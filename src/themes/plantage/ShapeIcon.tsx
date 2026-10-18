// A shape from field.ts as SVG; the parts carry the classes part-main, part-detail and part-line, the colors are set by
// the scene's CSS. Decoration, so hidden from screen readers.
import type { Shape } from "./field.ts";

export default function ShapeIcon({ shape, className = "" }: { shape: Shape; className?: string }) {
  return (
    <svg className={`pl-shape ${className}`} viewBox={shape.viewBox} aria-hidden="true">
      {shape.parts.map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
    </svg>
  );
}
