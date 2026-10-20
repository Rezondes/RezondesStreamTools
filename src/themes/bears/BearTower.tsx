// The tower of all three bears (bears.ts TOWER_LEVELS): Eisbär at the bottom, Panda in the middle, Grizzly on top with
// the raised front leg, each on all fours with its feet on the back of the one below (rig.ts towerLayout). One SVG; the
// whole tower sways gently (CSS).
import { BearFigure } from "./Bear.tsx";
import { TOWER_LEVELS } from "./bears.ts";
import { POSES, towerLayout } from "./rig.ts";

const LEVELS = towerLayout(TOWER_LEVELS);
const BOX = POSES.four;
const LEFT = Math.min(...LEVELS.map(level => level.x));
const TOP = Math.min(...LEVELS.map(level => level.y));
const WIDTH = BOX.width + Math.max(...LEVELS.map(level => level.x)) - LEFT;
const HEIGHT = BOX.height - TOP;

export default function BearTower({ className = "" }: { className?: string }) {
  return (
    <svg className={`bb-bear bb-tower ${className}`} viewBox={`${LEFT} ${TOP} ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <g className="bb-tower-sway">
        {LEVELS.map((level, index) => (
          <g key={level.bear} className={`bb-level bb-level-${index}`} transform={`translate(${level.x} ${level.y})`}>
            <BearFigure bear={level.bear} pose={level.pose} drops={level.drops} />
          </g>
        ))}
      </g>
    </svg>
  );
}
