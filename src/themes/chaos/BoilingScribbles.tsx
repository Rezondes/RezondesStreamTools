// The scribbles of the painted Chaos screens (PLAN-CHAOS.md package 6): the same layout as the wall of Backdrop.tsx, each
// mark in three takes (other hands of the same mark, a share of them Rough.js shapes with a filled inside); after the
// build they boil through the takes and drift a little, the neon ones flicker (idle.ts). The takes are switched and moved
// directly on the DOM, so React does not repaint 300 marks; an attribute is only written when it changes (most frames
// keep every take, writing them anyway cost a style pass over 1000 groups per frame). They draw themselves one after
// the other: the paths have pathLength 1, so a dash of 1 moved from 1 to 0 draws them without measuring every path
// (drawSVG would ask getTotalLength and getBBox of all of them at the start). The marks of a line type share one group
// with its filter: the noise of the filters lies in the coordinates of the viewBox, which are those of each mark until
// the drift starts, so they look the same as with a filter each (only where marks of different types cross, the order
// differs), and the build ran at a third of the frames with 340 filters. During the build every take with the filter of
// its mark is turned into a bitmap (useMarkSprites.ts); once drawn, the boil moves those on a canvas: the filters were
// about three quarters of the frame time. Until the bitmaps are ready, and at the lowest performance level (no filters), the SVG
// boils.
// Own module, so Rough.js stays out of the dashboard that shows Backdrop.tsx.
import { type CSSProperties, type RefObject, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { seedOf } from "../../core/hash.ts";
import { useViewport } from "../../core/hooks/useViewport.ts";
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { quality } from "../../core/three/quality.ts";
import { Filters, FREE, LAYER, VIEW_BOX } from "./Backdrop.tsx";
import { boilTake, driftAt, flickerAt, idleShare } from "./idle.ts";
import { scribbleTakes } from "./roughScribbles.ts";
import { layoutScribbles } from "./scribbles.ts";
import { sliceFit } from "./sprites.ts";
import { type Sprite, useMarkSprites } from "./useMarkSprites.ts";
import { useChaos } from "./useChaos.ts";

type Boiling = { seed: string; clock: () => number; idleFrom: number; fps: number };

const SECOND_MS = 1000; // fixed: seconds in ms
const HIDDEN: CSSProperties = { display: "none" };
// fixed: the line types, each a group with its filter (Backdrop.tsx)
const LINES = ["chalk", "marker", "neon"] as const;
// fixed: how long the size of the source has to stand still before the bitmaps are drawn again (drawing 340 marks
// with their filters takes a moment, so not on every step of a resize)
const SETTLE_MS = 300;

export default function BoilingScribbles({ seed, clock, idleFrom, fps }: Boiling) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const base = seedOf(seed);
  const rough = useMemo(() => ({ share: values.roughShare / 100, fill: values.roughFill, width: values.scribbleWidth }), [values.roughShare, values.roughFill, values.scribbleWidth]);
  const marks = useMemo(() => layoutScribbles(base + LAYER.scribbles, values.scribbleCount, FREE, values.scribbleWhite)
    .map((mark, index) => ({ mark, takes: scribbleTakes(mark, index, base, rough) })), [base, values.scribbleCount, values.scribbleWhite, rough]);
  const groups = useRef<(SVGGElement | null)[]>([]);
  const layer = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // The rough edges and the neon glow are the most expensive part of the screens (measured: about three quarters of the
  // frame time); the lowest performance level draws the marks without them
  const filtered = quality(values.quality).bloom;
  const drawn = useDrawn(values.scribbleDrawFrom + (marks.length - 1) * (values.scribbleStagger / SECOND_MS) * values.scribbleDrawStep + values.drawMs / SECOND_MS, marks);
  const viewport = useViewport(SETTLE_MS);
  const sprites = useMarkSprites(layer, filtered && drawn, values, viewport);
  // The drift waits for the bitmaps: without it the shared filters and the bitmaps show the same, so the switch does
  // not show (with drift the noise of the shared filters stands while the marks move, and every mark changed its grain
  // at the switch). Drawing the bitmaps during the build instead cost the build a sixth of its frames.
  const driftFrom = useDriftFrom(clock, idleFrom, !filtered || sprites !== null);
  useBoil(groups, marks, { seed, clock, idleFrom, fps }, driftFrom, sprites ? { canvas, sprites } : null);
  useTimeline(timeline => {
    groups.current.forEach((group, index) => {
      const paths = group?.querySelectorAll(".ch-mark path");
      if (!paths?.length) return;
      timeline.set(paths, { strokeDasharray: 1 }, 0);
      timeline.from(paths, { strokeDashoffset: 1, duration: values.drawMs / SECOND_MS, ease: "power2.out" }, values.scribbleDrawFrom + index * (values.scribbleStagger / SECOND_MS) * values.scribbleDrawStep);
    });
  }, [marks, values.drawMs, values.scribbleStagger, values.scribbleDrawFrom, values.scribbleDrawStep], layer);
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <>
      {/* Inline display: the class sets display: block, which beats the attribute */}
      <canvas ref={canvas} className="ch-layer ch-scribbles" style={sprites ? undefined : HIDDEN} aria-hidden="true" />
      <svg ref={layer} className="ch-layer ch-scribbles ch-boil" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={sprites ? HIDDEN : undefined}>
        <Filters id={id} />
        {LINES.map(type => (
          <g key={type} filter={filtered ? url(type) : undefined}>
            {marks.map(({ mark, takes }, index) => mark.line === type && (
              <g key={index} ref={group => { groups.current[index] = group; }} data-mark={index}>
                {takes.map((take, which) => (
                  <g key={which} display={which === 0 ? "inline" : "none"} className={`ch-mark ch-mark-${mark.color}`} style={{ "--i": index, "--w": take.rough ? mark.width : mark.width / mark.size } as CSSProperties}
                    transform={take.rough ? `translate(${mark.x} ${mark.y}) rotate(${mark.rotate})` : `translate(${mark.x} ${mark.y}) rotate(${mark.rotate}) scale(${mark.size})`}>
                    {take.parts.map((part, line) => <path key={line} className={part.filled ? "ch-rough-fill" : undefined} d={part.d} pathLength={1} />)}
                  </g>
                ))}
              </g>
            ))}
          </g>
        ))}
      </svg>
    </>
  );
}

// True once the scribbles drew themselves (the time of the last one from now; again when the marks change)
function useDrawn(seconds: number, marks: unknown) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    setDrawn(false);
    const timer = setTimeout(() => setDrawn(true), seconds * SECOND_MS);
    return () => clearTimeout(timer);
  }, [seconds, marks]);
  return drawn;
}

// When the drift starts (s on the clock): with the movement, but not before ready (the bitmaps show); once set it stays,
// also when the bitmaps are drawn again. Before that never (infinity).
function useDriftFrom(clock: () => number, idleFrom: number, ready: boolean) {
  const [from, setFrom] = useState(Infinity);
  useEffect(() => {
    if (ready) setFrom(current => (current === Infinity ? Math.max(idleFrom, clock()) : current));
  }, [clock, idleFrom, ready]);
  return from;
}

type Marks = { mark: ReturnType<typeof layoutScribbles>[number] }[];
type Painted = { canvas: RefObject<HTMLCanvasElement | null>; sprites: Sprite[][] };

const DEGREE = Math.PI / 180; // fixed: one degree in radians

// Every frame: the take of each mark, its drift and the flicker of the neon ones, written straight to the groups, or
// with the bitmaps drawn onto the canvas. A layout effect that paints at once: the canvas shows in the same frame the
// SVG hides, otherwise one empty frame flashed at the switch
function useBoil(groups: RefObject<(SVGGElement | null)[]>, marks: Marks, { clock, idleFrom, fps }: Boiling, driftFrom: number, painted: Painted | null) {
  const values = useChaos();
  useLayoutEffect(() => {
    let frame = 0;
    // What each group shows right now; only a change is written
    const shown = marks.map(() => ({ take: 0, transform: "", opacity: "" }));
    const paint = painted && canvasPainter(painted, marks);
    const tick = () => {
      const seconds = clock();
      // The boil counts from the start of the movement, the drift grows in from its own start
      const since = seconds - idleFrom;
      const boil = values.idleOn && values.boilOn;
      const share = values.idleOn ? idleShare(seconds - driftFrom, values.idleEaseMs / SECOND_MS) : 0;
      if (paint) {
        paint(index => ({
          take: boilTake(index, since, fps, boil),
          drift: driftAt(index, seconds, values.driftAmount * share, share > 0),
          opacity: marks[index].mark.line === "neon" ? flickerAt(seconds, values.flickerCycle, values.flicker) : 1,
        }));
        frame = requestAnimationFrame(tick);
        return;
      }
      groups.current.forEach((group, index) => {
        if (!group) return;
        const last = shown[index];
        const take = boilTake(index, since, fps, boil);
        if (take !== last.take) {
          group.children[last.take]?.setAttribute("display", "none");
          group.children[take]?.setAttribute("display", "inline");
          last.take = take;
        }
        const drift = driftAt(index, seconds, values.driftAmount * share, share > 0);
        const { x, y } = marks[index].mark;
        const transform = `translate(${(drift.x).toFixed(2)} ${(drift.y).toFixed(2)}) rotate(${(drift.rotate).toFixed(2)} ${x.toFixed(0)} ${y.toFixed(0)})`;
        if (transform !== last.transform) group.setAttribute("transform", (last.transform = transform));
        if (marks[index].mark.line !== "neon") return;
        const opacity = flickerAt(seconds, values.flickerCycle, values.flicker).toFixed(2);
        if (opacity !== last.opacity) group.setAttribute("opacity", (last.opacity = opacity));
      });
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [groups, clock, idleFrom, driftFrom, marks, fps, values.idleOn, values.boilOn, values.driftAmount, values.idleEaseMs, values.flicker, values.flickerCycle, painted]);
}

type MarkState = { take: number; drift: ReturnType<typeof driftAt>; opacity: number };

// Draws the bitmaps of the takes like the SVG groups: in their order (by line type), the viewBox fitted like "xMidYMid
// slice", each mark shifted by its drift and turned around its own point (translate, then rotate around x, y, as the
// transform of the group)
function canvasPainter({ canvas, sprites }: Painted, marks: Marks) {
  const element = canvas.current;
  const context = element?.getContext("2d");
  if (!element || !context) return null;
  const order = LINES.flatMap(type => marks.flatMap(({ mark }, index) => (mark.line === type ? [index] : [])));
  element.width = Math.round(element.clientWidth * devicePixelRatio);
  element.height = Math.round(element.clientHeight * devicePixelRatio);
  const [x, y, width, height] = VIEW_BOX.split(" ").map(Number);
  const fit = sliceFit({ x, y, width, height }, { width: element.width, height: element.height });
  return (stateOf: (index: number) => MarkState) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, element.width, element.height);
    order.forEach(index => {
      const { take, drift, opacity } = stateOf(index);
      const sprite = sprites[index][take] ?? sprites[index][0];
      const { x: markX, y: markY } = marks[index].mark;
      context.setTransform(fit.scale, 0, 0, fit.scale, fit.x, fit.y);
      context.translate(drift.x + markX, drift.y + markY);
      context.rotate(drift.rotate * DEGREE);
      context.translate(-markX, -markY);
      context.globalAlpha = opacity;
      const { cell, box } = sprite;
      context.drawImage(sprite.image, cell.x, cell.y, cell.width, cell.height, box.x, box.y, box.width, box.height);
    });
    context.globalAlpha = 1;
  };
}
