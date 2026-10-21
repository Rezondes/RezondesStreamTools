// The progress of the realistic Urlaub Starting (PLAN-URLAUB.md package 5): a life buoy drifts along a twisted rope from
// left to right as the countdown runs and bobs on the water (theme.css).
import { useLayoutEffect, useRef } from "react";

// fixed: the rope as a path in its own box (480 x 54)
const ROPE = "M0 27 C120 40 240 14 360 30 S460 28 480 26";
const BOX = "0 0 480 54"; // fixed: see above
const STRIPES = "M-17 0 A17 17 0 0 1 0 -17 L0 0 Z M17 0 A17 17 0 0 1 0 17 L0 0 Z"; // fixed: the red quarters of the buoy

export default function BuoyRope({ progress }: { progress: number }) {
  const rope = useRef<SVGPathElement>(null);
  const buoy = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const line = rope.current;
    if (!line || !buoy.current || typeof line.getTotalLength !== "function") return;
    const point = line.getPointAtLength(line.getTotalLength() * Math.min(1, Math.max(0, progress)));
    buoy.current.setAttribute("transform", `translate(${point.x} ${point.y})`);
  }, [progress]);
  return (
    <svg className="ul-buoy-rope" viewBox={BOX} aria-hidden="true">
      <path ref={rope} className="ul-rope-line" d={ROPE} />
      <path className="ul-rope-twist" d={ROPE} />
      <g ref={buoy}>
        <g className="ul-buoy">
          <circle r="17" className="ul-buoy-ring" />
          <path className="ul-buoy-stripes" d={STRIPES} />
          <circle r="6" className="ul-buoy-ring" />
        </g>
      </g>
    </svg>
  );
}
