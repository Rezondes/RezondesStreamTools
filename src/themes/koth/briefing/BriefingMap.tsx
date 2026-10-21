// Briefing map of the KOTH Starting: a paper sheet held by tape, the contour lines of the hill and the route draw
// themselves, the objective gets circled and crossed and its label types in. Every part follows the time of the scene.
import type { CSSProperties } from "react";
import { nail, type Steps, stepShare } from "../build.ts";
import { typed } from "../briefing.ts";

type Props = { time: number; steps: Steps; label: string; target: string; grid: boolean };

// fixed: drawing of the prototype (refs/starting.html) in the 420x300 sheet
const CONTOURS = [
  "M210 70 C290 70 340 120 330 170 C320 220 260 240 200 236 C130 232 90 200 96 156 C102 110 140 70 210 70Z",
  "M212 100 C268 100 300 132 294 166 C288 200 246 212 204 210 C156 208 128 188 132 158 C136 124 164 100 212 100Z",
  "M214 128 C246 128 264 146 260 166 C256 186 232 192 208 190 C182 188 166 178 168 160 C170 142 186 128 214 128Z",
];
const ROUTE = "M30 270 C70 250 80 210 120 196 C150 186 170 176 196 164";
const ARROW = "M184 152 L200 162 L184 176";
const CROSS = "M200 146 L228 174 M228 146 L200 174";
const TILT = { from: -9, to: -2.5 };
const DROP = 40;

// A path that draws itself: pathLength 1, the dash offset is what is still missing
const drawn = (share: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - share });

export default function BriefingMap({ time, steps, label, target, grid }: Props) {
  const shown = nail(stepShare(steps.map, time));
  const style = {
    opacity: Math.min(1, shown),
    transform: `translateY(${(1 - shown) * -DROP}px) rotate(${TILT.from + (TILT.to - TILT.from) * shown}deg)`,
  } as CSSProperties;
  return (
    <div className={`kh-briefing-map${grid ? " grid" : ""}`} style={style}>
      <svg viewBox="0 0 420 300">
        <g className="kh-contours">
          {CONTOURS.map((path, index) => <path key={index} d={path} {...drawn(stepShare(steps.contours, time, index))} />)}
        </g>
        <path className="kh-route" d={ROUTE} {...drawn(stepShare(steps.route, time))} />
        <path className="kh-route" d={ARROW} {...drawn(stepShare(steps.arrow, time))} />
        <circle className="kh-objective" cx={214} cy={160} r={30} {...drawn(stepShare(steps.objective, time))} />
        <path className="kh-objective" d={CROSS} {...drawn(stepShare(steps.cross, time))} />
        <text className="kh-target" x={252} y={128}>{typed(target, stepShare(steps.target, time))}</text>
      </svg>
      <p className="kh-map-label">{label}</p>
    </div>
  );
}
