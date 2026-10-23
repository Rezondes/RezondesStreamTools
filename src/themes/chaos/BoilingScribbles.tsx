// The scribbles of the painted Chaos screens (PLAN-CHAOS.md package 6): the same layout as the wall of Backdrop.tsx, each
// mark in three takes (other hands of the same mark, a share of them Rough.js shapes with a filled inside); after the
// build they boil through the takes and drift a little, the neon ones flicker (idle.ts). The takes are switched and moved
// directly on the DOM, so React does not repaint 300 marks; an attribute is only written when it changes (most frames
// keep every take, writing them anyway cost a style pass over 1000 groups per frame). They draw themselves one after
// the other: the paths have pathLength 1, so a dash of 1 moved from 1 to 0 draws them without measuring every path
// (drawSVG would ask getTotalLength and getBBox of all of them at the start).
// Own module, so Rough.js stays out of the dashboard that shows Backdrop.tsx.
import { type CSSProperties, type RefObject, useEffect, useId, useMemo, useRef } from "react";
import { seedOf } from "../../core/hash.ts";
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { quality } from "../../core/three/quality.ts";
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
  useBoil(groups, marks, { seed, clock, idleFrom, fps });
  const layer = useRef<SVGSVGElement>(null);
  useTimeline(timeline => {
    groups.current.forEach((group, index) => {
      const paths = group?.querySelectorAll(".ch-mark path");
      if (!paths?.length) return;
      timeline.set(paths, { strokeDasharray: 1 }, 0);
      timeline.from(paths, { strokeDashoffset: 1, duration: values.drawMs / SECOND_MS, ease: "power2.out" }, DRAW.from + index * (values.scribbleStagger / SECOND_MS) * DRAW.step);
    });
  }, [marks, values.drawMs, values.scribbleStagger], layer);
  const url = (name: string) => `url(#${id}-${name})`;
  // The rough edges and the neon glow are one filter per mark, the most expensive part of the screens (measured: about
  // three quarters of the frame time); the lowest performance level draws the marks without them
  const filtered = quality(values.quality).bloom;
  return (
    <svg ref={layer} className="ch-layer ch-scribbles ch-boil" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Filters id={id} />
      {marks.map(({ mark, takes }, index) => (
        <g key={index} ref={group => { groups.current[index] = group; }} filter={filtered ? url(mark.line) : undefined}>
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

type Marks = { mark: ReturnType<typeof layoutScribbles>[number] }[];

// Every frame: the take of each mark, its drift and the flicker of the neon ones, written straight to the groups
function useBoil(groups: RefObject<(SVGGElement | null)[]>, marks: Marks, { clock, idleFrom, fps }: Boiling) {
  const values = useChaos();
  useEffect(() => {
    let frame = 0;
    // What each group shows right now; only a change is written
    const shown = marks.map(() => ({ take: 0, transform: "", opacity: "" }));
    const tick = () => {
      const seconds = clock();
      const idle = values.idleOn && seconds >= idleFrom;
      groups.current.forEach((group, index) => {
        if (!group) return;
        const last = shown[index];
        const take = boilTake(index, seconds, fps, idle && values.boilOn);
        if (take !== last.take) {
          group.children[last.take]?.setAttribute("display", "none");
          group.children[take]?.setAttribute("display", "inline");
          last.take = take;
        }
        const drift = driftAt(index, seconds, values.driftAmount, idle);
        const { x, y } = marks[index].mark;
        const transform = `translate(${(drift.x).toFixed(2)} ${(drift.y).toFixed(2)}) rotate(${(drift.rotate).toFixed(2)} ${x.toFixed(0)} ${y.toFixed(0)})`;
        if (transform !== last.transform) group.setAttribute("transform", (last.transform = transform));
        if (marks[index].mark.line !== "neon") return;
        const opacity = flickerAt(seconds, FLICKER_CYCLE, values.flicker).toFixed(2);
        if (opacity !== last.opacity) group.setAttribute("opacity", (last.opacity = opacity));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [groups, clock, idleFrom, marks, fps, values.idleOn, values.boilOn, values.driftAmount, values.flicker]);
}
