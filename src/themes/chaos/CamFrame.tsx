// The webcam frame of the Chaos theme (scene cam), transparent inside: four rough marker strokes with overhang (or glowing neon lines, or
// a plain line), small scribbles at the corners, the name on tape at the bottom left and a magenta live pill at the top
// right.
import { useId, useMemo, type CSSProperties } from "react";
import { fillTemplate } from "../../core/template.ts";
import { chance } from "./chance.ts";
import { scribbleShape, type ScribbleKind } from "./scribbles.ts";
import { chaosNames, useChaos } from "./useChaos.ts";

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
    return CORNERS.map(corner => ({ ...corner, paths: scribbleShape(corner.kind, random) }));
  }, [values.camFrameWidth]);
  return (
    <div className={`ch-cam ch-cam-${values.camStyle}`} style={{ "--rough": `url(#${id}-rough)` } as CSSProperties}>
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
          {corner.paths.map(path => <path key={path} d={path} />)}
        </svg>
      ))}
      <span className="ch-cam-name">{fillTemplate(values.camLabel, chaosNames(values))}</span>
      {values.camLive && <span className="ch-cam-live">{values.camLiveText}</span>}
    </div>
  );
}
