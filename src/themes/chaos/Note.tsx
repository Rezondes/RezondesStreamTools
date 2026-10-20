// A note of the Chaos theme stuck on the wall: violet surface, a rough marker edge in magenta or cyan (the same shaky line
// as the scribbles), slightly crooked, optionally held by a strip of tape. Used for alerts, chat, music and the commands
// page; the look comes from theme.css.
import { useId, type CSSProperties, type ReactNode } from "react";
import { useChaos } from "./useChaos.ts";

// Notes in a row change ink: magenta, cyan, magenta, ...
export const inkOf = (index: number) => (index % 2 ? "cyan" : "magenta");

type Props = { ink?: "magenta" | "cyan"; tape?: boolean; className?: string; style?: CSSProperties; children: ReactNode };

export default function Note({ ink = "magenta", tape = false, className = "", style, children }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  return (
    <div className={`ch-note ch-ink-${ink} ${className}`} style={{ ...style, "--rough": `url(#${id}-rough)` } as CSSProperties}>
      <svg className="ch-defs" aria-hidden="true">
        <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves={2} seed={9} result="wave" />
          <feDisplacementMap in="SourceGraphic" in2="wave" scale={10 * values.jitter} />
        </filter>
      </svg>
      {tape && <span className="ch-tape" aria-hidden="true" />}
      {children}
    </div>
  );
}
