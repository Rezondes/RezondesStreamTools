// A KOTH soldier as a 3D minime: the parts of its role (soldiers3d.ts) in the colors of the settings, the uniform in the
// faction color, the pants a shade darker; it follows its anchor and takes the pose of its animation (PartFigure of the
// core), with muzzle flash and hit dust (CombatFx.tsx).
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { Color } from "three";
import PartFigure, { type FigureRun } from "../../../core/three/PartFigure.tsx";
import type { KothValues } from "../settings.ts";
import { EXPLOSIVE, LYING, muzzleOf, pose, soldier, type SoldierTone } from "../soldiers3d.ts";
import { HitDust, MuzzleFlash } from "./CombatFx.tsx";

type Box = RefObject<HTMLElement | null>;
type Props = { role: string; team: string; values: KothValues; run: FigureRun; anchor: Box; stage: Box; seed: number; blast: boolean };

// fixed: the pants are the faction color darkened by this share; the soldier turns far towards its target
const PANTS = 0.45;
const TURN = 1;

export default function Soldier3D({ role, team, values, run, anchor, stage, seed, blast }: Props) {
  const parts = useMemo(() => soldier(role, values.soldierFaces), [role, values.soldierFaces]);
  const looks = useMemo<Record<SoldierTone, string>>(() => ({
    skin: values.skin, uniform: team, pants: `#${new Color(team).multiplyScalar(1 - PANTS).getHexString()}`, gear: values.oliveDark,
    eye: values.soldierEye, helmet: values.helmet, weapon: values.weapon, mark: values.weaponMark, bag: values.paper, cross: values.medicCross,
  }), [values, team]);
  const current = useRef(run);
  useEffect(() => { current.current = run; }, [run]);
  const muzzle = muzzleOf(role);
  return (
    <PartFigure
      parts={parts}
      looks={looks}
      run={run}
      pose={pose}
      anchor={anchor}
      stage={stage}
      turn={TURN}
      blinkEvery={values.soldierBlinkEvery}
      lying={LYING}
      held={muzzle && <MuzzleFlash run={current} at={muzzle} color={values.muzzle} blast={EXPLOSIVE.includes(role)} />}
    >
      <HitDust run={current} seed={seed} colors={{ dust: values.dustColor, fire: values.muzzle }} blast={blast} />
    </PartFigure>
  );
}
