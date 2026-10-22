// The webcam frame of the Chaos theme (scene cam), transparent inside: four rough marker strokes with overhang (or glowing neon lines, or
// a plain line), small scribbles at the corners that boil through three takes like the scribbles of the screens (idle.ts),
// the name on tape at the bottom left and a magenta live pill at the top right.
import gsap from "gsap";
import { useEffect, useId, useMemo, useRef, type CSSProperties } from "react";
import { fillTemplate } from "../../core/template.ts";
import { chance } from "./chance.ts";
import { boilTake, TAKES } from "./idle.ts";
import { scribbleShape, type ScribbleKind } from "./scribbles.ts";
import { chaosNames, useChaos } from "./useChaos.ts";

const SECOND_MS = 1000; // fixed: seconds in ms

const CORNERS: readonly { spot: string; kind: ScribbleKind; color: string }[] = [
  { spot: "top-left", kind: "star", color: "color2" },
  { spot: "top-right", kind: "bolt", color: "color1" },
  { spot: "bottom-right", kind: "x", color: "color2" },
  { spot: "bottom-left", kind: "heart", color: "color1" },
];

export default function CamFrame() {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const corners = useMemo(() => {
    const random = chance(values.camFrameWidth);
    return CORNERS.map(corner => ({ ...corner, takes: Array.from({ length: TAKES }, () => scribbleShape(corner.kind, random)) }));
  }, [values.camFrameWidth]);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const started = performance.now();
    const tick = () => {
      const seconds = (performance.now() - started) / SECOND_MS;
      frame.current?.querySelectorAll(".ch-cam-corner").forEach((corner, index) => {
        const take = boilTake(index, seconds, values.boilFps, values.boilOn);
        [...corner.children].forEach((child, which) => child.setAttribute("display", which === take ? "inline" : "none"));
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [values.boilFps, values.boilOn]);
  return (
    <div ref={frame} className={`ch-cam ch-cam-${values.camStyle}`} style={{ "--rough": `url(#${id}-rough)` } as CSSProperties}>
      <svg className="ch-defs" aria-hidden="true">
        <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves={2} seed={4} result="wave" />
          <feDisplacementMap in="SourceGraphic" in2="wave" scale={14 * values.jitter} />
        </filter>
      </svg>
      <i className="ch-cam-edge ch-cam-top" />
      <i className="ch-cam-edge ch-cam-right" />
      <i className="ch-cam-edge ch-cam-bottom" />
      <i className="ch-cam-edge ch-cam-left" />
      {values.camScribbles && corners.map(corner => (
        <svg key={corner.spot} className={`ch-cam-corner ch-${corner.spot} ch-mark ch-mark-${corner.color}`} viewBox="-0.6 -0.6 1.2 1.2" style={{ "--w": 0.09 } as CSSProperties} aria-hidden="true">
          {corner.takes.map((paths, take) => <g key={take} display={take === 0 ? "inline" : "none"}>{paths.map(path => <path key={path} d={path} />)}</g>)}
        </svg>
      ))}
      <span className="ch-cam-name">{fillTemplate(values.camLabel, chaosNames(values))}</span>
      {values.camLive && <span className="ch-cam-live">{values.camLiveText}</span>}
    </div>
  );
}
