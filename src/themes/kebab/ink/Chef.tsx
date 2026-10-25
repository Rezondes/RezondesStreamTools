// The chef at the spit (chef.ts) as SVG groups inside the logo SVG: body with hat, face, eyes and moustache, the spit
// with the meat cone whose strokes slide (the spit turns, or the bare spit in the Ending), in front either the arm with
// the knife (pose "saw"), the tea break of BRB (pose "tea", pause.ts: glass in the hand, knife on the counter) or the
// waving arm with the knife on the counter (pose "wave", Ending), counter and plate. Each frame sets the pose of life.ts from the clock; before idleFrom only the spit turns. Classes
// kb-chef-* let the GSAP timeline of the scene draw the lines in.
import { type RefObject, useMemo, useRef } from "react";
import { CHEF_PARTS, chefParts, EYE_LINE, HAT_PIVOT, type InkPart, MEAT, SHOULDER, STACHE_PIVOT } from "../chef.ts";
import { hatchOffset, meatHatch } from "../hatch.ts";
import { chefPose, waveTransform } from "../life.ts";
import { pauseParts } from "../pause.ts";
import type { KebabValues } from "../settings.ts";
import { useFrame } from "../useFrame.ts";
import Ink, { type InkStyle } from "./Ink.tsx";

// fixed: the strokes of the meat repeat every 42 units and are 2 units wide, like the prototype
const PERIOD = 42;
const HATCH_WIDTH = 2;
const SALT = 100;
// The knife lying on the counter while the chef waves
const RESTING_KNIFE = pauseParts().knife;
// The rod of the bare spit where the meat was (Ending)
const BARE_ROD: InkPart = { fills: [], lines: [{ shape: { kind: "path", d: "M320 204 L320 412" }, width: 3.4 }], dots: [] };

export type ChefPoseName = "saw" | "tea" | "wave";
// meat: false shows the bare spit (Ending)
type Props = { values: KebabValues; clock: () => number; idleFrom: number; pose: ChefPoseName; meat?: boolean };
type GroupRef = RefObject<SVGGElement | null>;
type Refs = {
  hat: GroupRef;
  eyes: GroupRef;
  stache: GroupRef;
  arm: GroupRef;
  hatch: RefObject<SVGPathElement | null>;
};

function TeaBreak({ style }: { style: InkStyle }) {
  const parts = useMemo(() => pauseParts(), []);
  return (
    <>
      <g className="kb-chef-arm">
        <Ink part={parts.arm} style={style} salt={SALT * 20} />
        <Ink part={parts.glass} style={style} salt={SALT * 21} />
      </g>
      <g className="kb-chef-table"><Ink part={parts.knife} style={style} salt={SALT * 22} /></g>
    </>
  );
}

function useIdle(values: KebabValues, clock: () => number, idleFrom: number, pose: ChefPoseName, refs: Refs) {
  useFrame(clock, time => {
    refs.hatch.current?.setAttribute("transform", `translate(${hatchOffset(time, values.spitSpeed, PERIOD)} 0)`);
    if (time < idleFrom) return;
    const life = chefPose(time - idleFrom, { ...values, sawOn: values.sawOn && pose === "saw" });
    const arm = pose === "wave" ? waveTransform(time - idleFrom, SHOULDER) : `rotate(${life.armAngle} ${SHOULDER.x} ${SHOULDER.y}) translate(${life.armShift.x} ${life.armShift.y})`;
    refs.arm.current?.setAttribute("transform", arm);
    refs.hat.current?.setAttribute("transform", `rotate(${life.hatAngle} ${HAT_PIVOT.x} ${HAT_PIVOT.y})`);
    refs.stache.current?.setAttribute("transform", `rotate(${life.stacheAngle} ${STACHE_PIVOT.x} ${STACHE_PIVOT.y})`);
    refs.eyes.current?.setAttribute("transform", life.blink ? `translate(0 ${EYE_LINE}) scale(1 0.15) translate(0 ${-EYE_LINE})` : "");
  });
}

export default function Chef({ values, clock, idleFrom, pose, meat = true }: Props) {
  const parts = useMemo(() => chefParts(), []);
  const style: InkStyle = useMemo(() => ({ roughness: values.inkRoughness, bowing: values.inkBowing, width: values.inkWidth, seed: values.inkSeed }), [values.inkRoughness, values.inkBowing, values.inkWidth, values.inkSeed]);
  const hatch = useMemo(() => meatHatch(values.inkSeed, values.hatchRows, PERIOD), [values.inkSeed, values.hatchRows]);
  const salt = (name: (typeof CHEF_PARTS)[number]) => CHEF_PARTS.indexOf(name) * SALT;
  const refs: Refs = { hat: useRef(null), eyes: useRef(null), stache: useRef(null), arm: useRef(null), hatch: useRef(null) };
  useIdle(values, clock, idleFrom, pose, refs);
  return (
    <g className="kb-chef">
      <clipPath id="kb-meat"><path d={MEAT} /></clipPath>
      <g className="kb-chef-body">
        <g ref={refs.hat}><Ink part={parts.hat} style={style} salt={salt("hat")} /></g>
        <Ink part={parts.head} style={style} salt={salt("head")} />
        <Ink part={parts.face} style={style} salt={salt("face")} />
        <g ref={refs.eyes}><Ink part={parts.eyes} style={style} salt={salt("eyes")} /></g>
        <g ref={refs.stache}><Ink part={parts.stache} style={style} salt={salt("stache")} /></g>
        <Ink part={parts.body} style={style} salt={salt("body")} />
      </g>
      <g className="kb-chef-spit">
        <Ink part={parts.spit} style={style} salt={salt("spit")} />
        {!meat && <Ink part={BARE_ROD} style={style} salt={salt("meat")} />}
        {meat && (
          <>
            <path className="kb-fill" d={MEAT} />
            <g clipPath="url(#kb-meat)"><path ref={refs.hatch} className="kb-ink kb-hatch" d={hatch} strokeWidth={HATCH_WIDTH * values.inkWidth} /></g>
            <Ink part={{ ...parts.meat, fills: [] }} style={style} salt={salt("meat")} />
          </>
        )}
      </g>
      {pose === "saw" ? (
        <g className="kb-chef-arm" ref={refs.arm}>
          <Ink part={parts.arm} style={style} salt={salt("arm")} />
          <Ink part={parts.knife} style={style} salt={salt("knife")} />
        </g>
      ) : pose === "wave" ? (
        <>
          <g className="kb-chef-arm" ref={refs.arm}><Ink part={parts.arm} style={style} salt={salt("arm")} /></g>
          <g className="kb-chef-table"><Ink part={RESTING_KNIFE} style={style} salt={salt("knife")} /></g>
        </>
      ) : <TeaBreak style={style} />}
      <g className="kb-chef-table">
        <Ink part={parts.counter} style={style} salt={salt("counter")} />
        <Ink part={parts.plate} style={style} salt={salt("plate")} />
      </g>
    </g>
  );
}
