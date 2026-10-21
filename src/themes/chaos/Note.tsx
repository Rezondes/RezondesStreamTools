// A note of the Chaos theme stuck on the wall: violet surface, slightly crooked, optionally held by a strip of tape, with
// a rough marker edge in magenta or cyan from Rough.js that draws itself when the note appears (PLAN-CHAOS.md package
// 8). Used for alerts, chat, music and the commands page; the look comes from theme.css.
import { useId, useMemo, type CSSProperties, type ReactNode } from "react";
import { roughPath } from "../../core/rough/roughSvg.ts";
import { useChaos } from "./useChaos.ts";

// Notes in a row change ink: magenta, cyan, magenta, ...
export const inkOf = (index: number) => (index % 2 ? "cyan" : "magenta");

type Props = { ink?: "magenta" | "cyan"; tape?: boolean; className?: string; style?: CSSProperties; children: ReactNode };

// fixed: the edge as a crooked box in a 100 x 100 frame stretched over the note (the line keeps its width), the hand
const EDGE: [number, number][] = [[1.5, 3], [98.5, 1.5], [99, 96.5], [2.5, 98.5]];
const HAND = { roughness: 0.6, bowing: 0.6, strokeWidth: 1, fill: "none" as const };
const EDGE_SEED = 5;

export default function Note({ ink = "magenta", tape = false, className = "", style, children }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const edge = useMemo(() => roughPath({ kind: "polygon", points: EDGE }, HAND, EDGE_SEED), []);
  return (
    <div className={`ch-note ch-ink-${ink} ${className}`} style={{ ...style, "--rough": `url(#${id}-rough)` } as CSSProperties}>
      <svg className="ch-defs" aria-hidden="true">
        <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves={2} seed={9} result="wave" />
          <feDisplacementMap in="SourceGraphic" in2="wave" scale={10 * values.jitter} />
        </filter>
      </svg>
      <svg className="ch-note-edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {edge.map(part => <path key={part.d} d={part.d} pathLength={1} vectorEffect="non-scaling-stroke" />)}
      </svg>
      {tape && <span className="ch-tape" aria-hidden="true" />}
      {children}
    </div>
  );
}
