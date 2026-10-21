// The scribbles of the painted Chaos screens (PLAN-CHAOS.md package 6): the same layout as the wall of Backdrop.tsx, each
// mark in three takes (other hands of the same mark, a share of them Rough.js shapes with a filled inside); after the
// build they boil through the takes and drift a little (idle.ts). The takes are switched and moved directly on the DOM,
// so React does not repaint 300 marks. Own module, so Rough.js stays out of the dashboard that shows Backdrop.tsx.
import { type CSSProperties, useEffect, useId, useMemo, useRef } from "react";
import { hash, seedOf } from "../../core/hash.ts";
import { Filters, FREE, LAYER, VIEW_BOX } from "./Backdrop.tsx";
import { chance } from "./chance.ts";
import { boilTake, driftAt, TAKES } from "./idle.ts";
import { ROUGH_KINDS, roughScribble } from "./roughScribbles.ts";
import { layoutScribbles, type Scribble, scribbleShape } from "./scribbles.ts";
import { useChaos } from "./useChaos.ts";

type Take = { rough: boolean; parts: { d: string; filled: boolean }[] };
type Boiling = { seed: string; clock: () => number; idleFrom: number; fps: number };

function takesOf(mark: Scribble, index: number, base: number, rough: { share: number; fill: boolean; width: number }): Take[] {
  const takeSeed = (take: number) => base * 101 + index * 7 + take * 5003;
  if (hash(base * 13 + index) < rough.share) {
    const kind = ROUGH_KINDS[Math.floor(hash(base * 17 + index) * ROUGH_KINDS.length)];
    return Array.from({ length: TAKES }, (_, take) => ({ rough: true, parts: roughScribble(kind, mark.size, takeSeed(take), mark.width * rough.width, rough.fill) }));
  }
  return Array.from({ length: TAKES }, (_, take) => ({ rough: false, parts: (take === 0 ? mark.paths : scribbleShape(mark.kind, chance(takeSeed(take)))).map(path => ({ d: path, filled: false })) }));
}

export default function BoilingScribbles({ seed, clock, idleFrom, fps }: Boiling) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const base = seedOf(seed);
  const rough = useMemo(() => ({ share: values.roughShare / 100, fill: values.roughFill, width: values.scribbleWidth }), [values.roughShare, values.roughFill, values.scribbleWidth]);
  const marks = useMemo(() => layoutScribbles(base + LAYER.scribbles, values.scribbleCount, FREE, values.scribbleWhite)
    .map((mark, index) => ({ mark, takes: takesOf(mark, index, base, rough) })), [base, values.scribbleCount, values.scribbleWhite, rough]);
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
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, idleFrom, marks, fps, values.idleOn, values.boilOn, values.driftAmount]);
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg className="ch-layer ch-scribbles ch-boil" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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
