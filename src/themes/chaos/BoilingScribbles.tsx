// The scribbles of the painted Chaos screens (PLAN-CHAOS.md package 6): the same layout as the wall of Backdrop.tsx, each
// mark in three takes (other hands of the same mark, a share of them Rough.js shapes with a filled inside); after the
// build they boil through the takes and drift a little, the neon ones flicker (idle.ts). The takes are switched and moved
// directly on the DOM, so React does not repaint 300 marks. They draw themselves one after the other with GSAP drawSVG.
// Own module, so Rough.js stays out of the dashboard that shows Backdrop.tsx.
import { type CSSProperties, useEffect, useId, useMemo, useRef } from "react";
import { seedOf } from "../../core/hash.ts";
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { Filters, FREE, LAYER, VIEW_BOX } from "./Backdrop.tsx";
import { boilTake, driftAt, flickerAt } from "./idle.ts";
import { scribbleTakes } from "./roughScribbles.ts";
import { layoutScribbles } from "./scribbles.ts";
import { useChaos } from "./useChaos.ts";

type Boiling = { seed: string; clock: () => number; idleFrom: number; fps: number };

const SECOND_MS = 1000; // fixed: seconds in ms
// fixed: when the scribbles start drawing (s), the factor on scribbleStagger per scribble, the flicker cycle of the neon (s)
const DRAW = { from: 1.3, step: 0.08 };
const FLICKER_CYCLE = 7;

export default function BoilingScribbles({ seed, clock, idleFrom, fps }: Boiling) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const base = seedOf(seed);
  const rough = useMemo(() => ({ share: values.roughShare / 100, fill: values.roughFill, width: values.scribbleWidth }), [values.roughShare, values.roughFill, values.scribbleWidth]);
  const marks = useMemo(() => layoutScribbles(base + LAYER.scribbles, values.scribbleCount, FREE, values.scribbleWhite)
    .map((mark, index) => ({ mark, takes: scribbleTakes(mark, index, base, rough) })), [base, values.scribbleCount, values.scribbleWhite, rough]);
  const groups = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const seconds = clock();
      const idle = values.idleOn && seconds >= idleFrom;
      groups.current.forEach((group, index) => {
        if (!group) return;
        const take = boilTake(index, seconds, fps, idle && values.boilOn);
        [...group.children].forEach((child, which) => child.setAttribute("display", which === take ? "inline" : "none"));
        const drift = driftAt(index, seconds, values.driftAmount, idle);
        const { x, y } = marks[index].mark;
        group.setAttribute("transform", `translate(${(drift.x).toFixed(2)} ${(drift.y).toFixed(2)}) rotate(${(drift.rotate).toFixed(2)} ${x.toFixed(0)} ${y.toFixed(0)})`);
        if (marks[index].mark.line === "neon") group.setAttribute("opacity", flickerAt(seconds, FLICKER_CYCLE, values.flicker).toFixed(2));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, idleFrom, marks, fps, values.idleOn, values.boilOn, values.driftAmount, values.flicker]);
  const layer = useRef<SVGSVGElement>(null);
  useTimeline(timeline => {
    groups.current.forEach((group, index) => {
      const paths = group?.querySelectorAll(".ch-mark path");
      if (paths?.length) timeline.from(paths, { drawSVG: "0%", duration: values.drawMs / SECOND_MS, ease: "power2.out" }, DRAW.from + index * (values.scribbleStagger / SECOND_MS) * DRAW.step);
    });
  }, [marks, values.drawMs, values.scribbleStagger], layer);
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg ref={layer} className="ch-layer ch-scribbles ch-boil" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Filters id={id} />
      {marks.map(({ mark, takes }, index) => (
        <g key={index} ref={group => { groups.current[index] = group; }} filter={mark.line === "neon" ? url("neon") : url(mark.line)}>
          {takes.map((take, which) => (
            <g key={which} display={which === 0 ? "inline" : "none"} className={`ch-mark ch-mark-${mark.color}`} style={{ "--i": index, "--w": take.rough ? mark.width : mark.width / mark.size } as CSSProperties}
              transform={take.rough ? `translate(${mark.x} ${mark.y}) rotate(${mark.rotate})` : `translate(${mark.x} ${mark.y}) rotate(${mark.rotate}) scale(${mark.size})`}>
              {take.parts.map((part, line) => <path key={line} className={part.filled ? "ch-rough-fill" : undefined} d={part.d} pathLength={1} />)}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
