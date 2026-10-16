// Eine Form aus beach.ts als SVG; die Teile tragen die Klassen part-main, part-detail und part-line, die Farben setzt
// das CSS der Szene. Dekoration, darum für Screenreader verborgen.
import type { Shape } from "./beach.ts";

export default function ShapeIcon({ shape, className = "" }: { shape: Shape; className?: string }) {
  return (
    <svg className={`sf-shape ${className}`} viewBox={shape.viewBox} aria-hidden="true">
      {shape.parts.map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
    </svg>
  );
}
