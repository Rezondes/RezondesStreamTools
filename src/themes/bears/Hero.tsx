// The bear of a scene as the streamer chose it: one bear in the pose the scene asks for, or the tower of all three.
// An unknown value (old settings) shows the Grizzly.
import Bear from "./Bear.tsx";
import BearTower from "./BearTower.tsx";
import { isBearChoice, TOWER, type BearId } from "./bears.ts";
import type { PoseName } from "./rig.ts";

type Props = { choice: string; poses: Record<BearId, PoseName>; sign?: string; className?: string };

export default function Hero({ choice, poses, sign, className = "" }: Props) {
  const picked = isBearChoice(choice) ? choice : "grizzly";
  if (picked === TOWER) return <BearTower className={className} />;
  return <Bear bear={picked} pose={poses[picked]} sign={sign} className={className} />;
}
