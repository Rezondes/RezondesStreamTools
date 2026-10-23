// One dish of the minimes (dishes.ts) as SVG in its 100 x 100 box: feet, body, the part of its own move, face and arm,
// drawn in the red line like the chef (Ink.tsx). Every frame sets the pose of the running animation (dishPose) from the
// wall clock: jump, turn, the dürüm's layer, the lahmacun's half, the fries stick, the waving arm, sauce and steam. In
// a tower an upper dish stands on a plate. Classes kb-dish-* for minimes.css.
import { type RefObject, useMemo, useRef } from "react";
import type { InkPart } from "../chef.ts";
import { DISH_TYPES, type DishType, dishParts, dishPose, FLAP_X, FOLD_X, MOVE_OF, OWN_MOVES, sauceDrops, SHOULDER } from "../dishes.ts";
import { useFrame } from "../useFrame.ts";
import Ink, { type InkStyle } from "./Ink.tsx";

// fixed: in box units: how high a dish jumps, how far the arm and the fries tilt, how high the stick flies and how
// often it turns, the sauce drops, the steam puffs and how far they rise
const JUMP = 34;
const WAVE_ANGLE = 35;
const WIGGLE_ANGLE = 6;
const STICK = { rise: 44, turns: 1 };
const DROPS = { count: 5, radius: 2.6 };
const PUFFS = [{ x: 34, r: 7 }, { x: 50, r: 9 }, { x: 66, r: 7 }];
const STEAM = { from: 6, rise: 24 };
const SALT = { type: 100, plate: 90 };
const FULL_TURN = 360;
// fixed: the plate under a dish standing in a tower
const PLATE: InkPart = { fills: [], lines: [{ shape: { kind: "ellipse", x: 50, y: 98, width: 86, height: 10 }, width: 2.6 }], dots: [] };

const wallClock = () => Date.now();

type Props = { type: DishType; action: string; startedAt: number; durationMs: number; style: InkStyle; onPlate: boolean };
type Refs = Record<"jump" | "turn" | "move" | "arm" | "sauce" | "steam", RefObject<SVGGElement | null>>;

function useDishPose(type: DishType, animation: string, startedAt: number, durationMs: number, refs: Refs) {
  useFrame(wallClock, now => {
    const pose = dishPose(animation, durationMs > 0 ? (now - startedAt) / durationMs : 1);
    const shoulder = SHOULDER[type];
    refs.jump.current?.setAttribute("transform", `translate(0 ${-pose.lift * JUMP})`);
    refs.turn.current?.setAttribute("transform", `translate(50 0) scale(${pose.turn} 1) translate(-50 0) rotate(${pose.wiggle * WIGGLE_ANGLE} 50 92)`);
    refs.arm.current?.setAttribute("transform", `rotate(${-pose.wave * WAVE_ANGLE} ${shoulder.x} ${shoulder.y})`);
    if (type === "duerum") refs.move.current?.setAttribute("transform", `translate(${FLAP_X} 0) scale(${Math.cos(Math.PI * pose.flap)} 1) translate(${-FLAP_X} 0)`);
    if (type === "lahmacun") refs.move.current?.setAttribute("transform", `translate(${FOLD_X} 0) scale(${Math.cos(Math.PI * pose.fold)} 1) translate(${-FOLD_X} 0)`);
    if (type === "pommes") refs.move.current?.setAttribute("transform", `translate(0 ${-pose.stick * STICK.rise}) rotate(${pose.stick * STICK.turns * FULL_TURN} 50 30)`);
    const drops = sauceDrops(pose.sauce);
    refs.sauce.current?.querySelectorAll("circle").forEach((drop, index) => {
      drop.setAttribute("cx", String(drops[index]?.x ?? 0));
      drop.setAttribute("cy", String(drops[index]?.y ?? 0));
      drop.style.visibility = drops[index] ? "visible" : "hidden";
    });
    refs.steam.current?.setAttribute("transform", `translate(0 ${-pose.steam * STEAM.rise})`);
    refs.steam.current?.setAttribute("opacity", String(Math.sin(Math.PI * pose.steam)));
  });
}

export default function Dish({ type, action, startedAt, durationMs, style, onPlate }: Props) {
  const parts = useMemo(() => dishParts(type), [type]);
  const salt = DISH_TYPES.indexOf(type) * SALT.type;
  const refs: Refs = { jump: useRef(null), turn: useRef(null), move: useRef(null), arm: useRef(null), sauce: useRef(null), steam: useRef(null) };
  // Any of the four own moves makes the dish do its own one
  useDishPose(type, (OWN_MOVES as readonly string[]).includes(action) ? MOVE_OF[type] : action, startedAt, durationMs, refs);
  return (
    <svg className="kb-dish" viewBox="0 0 100 100">
      {onPlate && <Ink part={PLATE} style={style} salt={salt + SALT.plate} />}
      <g ref={refs.jump}>
        <g ref={refs.turn}>
          <Ink part={parts.feet} style={style} salt={salt + 1} />
          <Ink part={parts.body} style={style} salt={salt + 2} />
          {parts.move && <g ref={refs.move}><Ink part={parts.move} style={style} salt={salt + 3} /></g>}
          <Ink part={parts.face} style={style} salt={salt + 4} />
          <g ref={refs.arm}><Ink part={parts.arm} style={style} salt={salt + 5} /></g>
          {type === "doener" && (
            <g ref={refs.sauce} className="kb-dish-sauce">
              {Array.from({ length: DROPS.count }, (_, index) => <circle key={index} r={DROPS.radius} style={{ visibility: "hidden" }} />)}
            </g>
          )}
        </g>
        <g ref={refs.steam} className="kb-dish-steam" opacity={0}>
          {PUFFS.map(puff => <circle key={puff.x} cx={puff.x} cy={STEAM.from} r={puff.r} />)}
        </g>
      </g>
    </svg>
  );
}
