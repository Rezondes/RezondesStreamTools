// The scribbles of the painted Chaos screens (PLAN-CHAOS.md package 6): the same layout as the wall of Backdrop.tsx, each
// mark in three takes (other hands of the same mark, a share of them Rough.js shapes with a filled inside); after the
// build they boil through the takes and drift a little, the neon ones flicker (idle.ts). The takes are switched and moved
// directly on the DOM, so React does not repaint 300 marks; an attribute is only written when it changes (most frames
// keep every take, writing them anyway cost a style pass over 1000 groups per frame). They draw themselves one after
// the other: the paths have pathLength 1, so a dash of 1 moved from 1 to 0 draws them without measuring every path
// (drawSVG would ask getTotalLength and getBBox of all of them at the start). Once drawn, every take with its filter is
// turned into a bitmap (useMarkSprites.ts) and the boil moves those on a canvas: the filters were about three quarters
// of the frame time. Until the bitmaps are ready, and at the lowest performance level (no filters), the SVG boils.
// Own module, so Rough.js stays out of the dashboard that shows Backdrop.tsx.
import { type CSSProperties, type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";
import { seedOf } from "../../core/hash.ts";
import { useViewport } from "../../core/hooks/useViewport.ts";
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { quality } from "../../core/three/quality.ts";
import { Filters, FREE, LAYER, VIEW_BOX } from "./Backdrop.tsx";
import { boilTake, driftAt, flickerAt } from "./idle.ts";
import { scribbleTakes } from "./roughScribbles.ts";
import { layoutScribbles } from "./scribbles.ts";
import { sliceFit } from "./sprites.ts";
import { type Sprite, useMarkSprites } from "./useMarkSprites.ts";
import { useChaos } from "./useChaos.ts";

type Boiling = { seed: string; clock: () => number; idleFrom: number; fps: number };

const SECOND_MS = 1000; // fixed: seconds in ms
// fixed: when the scribbles start drawing (s), the factor on scribbleStagger per scribble, the flicker cycle of the neon (s)
const DRAW = { from: 1.3, step: 0.08 };
const FLICKER_CYCLE = 7;
const HIDDEN: CSSProperties = { display: "none" };
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
  // The rough edges and the neon glow are one filter per mark, the most expensive part of the screens (measured: about
  // three quarters of the frame time); the lowest performance level draws the marks without them
  const filtered = quality(values.quality).bloom;
  const drawn = useDrawn(DRAW.from + (marks.length - 1) * (values.scribbleStagger / SECOND_MS) * DRAW.step + values.drawMs / SECOND_MS, marks);
  const viewport = useViewport(SETTLE_MS);
  const sprites = useMarkSprites(layer, filtered && drawn, values, viewport);
  useBoil(groups, marks, { seed, clock, idleFrom, fps }, sprites ? { canvas, sprites } : null);
  useTimeline(timeline => {
    groups.current.forEach((group, index) => {
      const paths = group?.querySelectorAll(".ch-mark path");
      if (!paths?.length) return;
      timeline.set(paths, { strokeDasharray: 1 }, 0);
      timeline.from(paths, { strokeDashoffset: 1, duration: values.drawMs / SECOND_MS, ease: "power2.out" }, DRAW.from + index * (values.scribbleStagger / SECOND_MS) * DRAW.step);
    });
  }, [marks, values.drawMs, values.scribbleStagger], layer);
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <>
      {/* Inline display: the class sets display: block, which beats the attribute */}
      <canvas ref={canvas} className="ch-layer ch-scribbles" style={sprites ? undefined : HIDDEN} aria-hidden="true" />
      <svg ref={layer} className="ch-layer ch-scribbles ch-boil" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={sprites ? HIDDEN : undefined}>
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

type Marks = { mark: ReturnType<typeof layoutScribbles>[number] }[];
type Painted = { canvas: RefObject<HTMLCanvasElement | null>; sprites: Sprite[][] };

const DEGREE = Math.PI / 180; // fixed: one degree in radians

// Every frame: the take of each mark, its drift and the flicker of the neon ones, written straight to the groups, or
// with the bitmaps drawn onto the canvas
function useBoil(groups: RefObject<(SVGGElement | null)[]>, marks: Marks, { clock, idleFrom, fps }: Boiling, painted: Painted | null) {
  const values = useChaos();
  useEffect(() => {
    let frame = 0;
    // What each group shows right now; only a change is written
    const shown = marks.map(() => ({ take: 0, transform: "", opacity: "" }));
    const paint = painted && canvasPainter(painted, marks);
    const tick = () => {
      const seconds = clock();
      const idle = values.idleOn && seconds >= idleFrom;
      if (paint) {
        paint(index => ({
          take: boilTake(index, seconds, fps, idle && values.boilOn),
          drift: driftAt(index, seconds, values.driftAmount, idle),
          opacity: marks[index].mark.line === "neon" ? flickerAt(seconds, FLICKER_CYCLE, values.flicker) : 1,
        }));
        frame = requestAnimationFrame(tick);
        return;
      }
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
  }, [groups, clock, idleFrom, marks, fps, values.idleOn, values.boilOn, values.driftAmount, values.flicker, painted]);
}

type MarkState = { take: number; drift: ReturnType<typeof driftAt>; opacity: number };

// Draws the bitmaps of the takes like the SVG groups: the viewBox fitted like "xMidYMid slice", each mark shifted by its
// drift and turned around its own point (translate, then rotate around x, y, as the transform of the group)
function canvasPainter({ canvas, sprites }: Painted, marks: Marks) {
  const element = canvas.current;
  const context = element?.getContext("2d");
  if (!element || !context) return null;
  element.width = Math.round(element.clientWidth * devicePixelRatio);
  element.height = Math.round(element.clientHeight * devicePixelRatio);
  const [x, y, width, height] = VIEW_BOX.split(" ").map(Number);
  const fit = sliceFit({ x, y, width, height }, { width: element.width, height: element.height });
  return (stateOf: (index: number) => MarkState) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, element.width, element.height);
    sprites.forEach((takes, index) => {
      const { take, drift, opacity } = stateOf(index);
      const sprite = takes[take] ?? takes[0];
      const { x: markX, y: markY } = marks[index].mark;
      context.setTransform(fit.scale, 0, 0, fit.scale, fit.x, fit.y);
      context.translate(drift.x + markX, drift.y + markY);
      context.rotate(drift.rotate * DEGREE);
      context.translate(-markX, -markY);
      context.globalAlpha = opacity;
      context.drawImage(sprite.image, sprite.box.x, sprite.box.y, sprite.box.width, sprite.box.height);
    });
    context.globalAlpha = 1;
  };
}
