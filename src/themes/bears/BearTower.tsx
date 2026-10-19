// The tower of all three bears (bears.ts TOWER_LEVELS): Eisbär at the bottom, Panda in the middle, Grizzly on top with
// the raised arm, each on all fours on the back of the one below. One SVG; the whole tower sways gently (CSS).
import { BearFigure } from "./Bear.tsx";
import { POSES, TOWER_LEVELS, TOWER_STEP } from "./bears.ts";

const BOX = POSES.four;
const LEVELS = TOWER_LEVELS.length - 1;
const WIDTH = BOX.width + TOWER_STEP.x * LEVELS;
const HEIGHT = BOX.height - TOWER_STEP.y * LEVELS;

export default function BearTower({ className = "" }: { className?: string }) {
  return (
    <svg className={`bb-bear bb-tower ${className}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <g className="bb-tower-sway">
        {TOWER_LEVELS.map((level, index) => (
          <g key={level.bear} className={`bb-level bb-level-${index}`} transform={`translate(${TOWER_STEP.x * index} ${-TOWER_STEP.y * (LEVELS - index)})`}>
            <BearFigure bear={level.bear} pose={level.pose} />
          </g>
        ))}
      </g>
    </svg>
  );
}
