// The chef at the spit (chef.ts) as SVG groups inside the logo SVG: body with hat, face, eyes and moustache, the spit
// with the meat cone whose strokes slide (the spit turns), the arm with the knife in front, counter and plate. Each
// frame sets the pose of life.ts from the clock; before idleFrom only the spit turns. Classes kb-chef-* let the GSAP
// timeline of the scene draw the lines in.
import { useMemo, useRef } from "react";
import { CHEF_PARTS, chefParts, EYE_LINE, HAT_PIVOT, MEAT, SHOULDER, STACHE_PIVOT } from "../chef.ts";
import { hatchOffset, meatHatch } from "../hatch.ts";
import { chefPose } from "../life.ts";
import type { KebabValues } from "../settings.ts";
import { useFrame } from "../useFrame.ts";
import Ink, { type InkStyle } from "./Ink.tsx";

// fixed: the strokes of the meat repeat every 42 units and are 2 units wide, like the prototype
const PERIOD = 42;
const HATCH_WIDTH = 2;
const SALT = 100;

type Props = { values: KebabValues; clock: () => number; idleFrom: number };

export default function Chef({ values, clock, idleFrom }: Props) {
  const parts = useMemo(() => chefParts(), []);
  const style: InkStyle = useMemo(() => ({ roughness: values.inkRoughness, bowing: values.inkBowing, width: values.inkWidth, seed: values.inkSeed }), [values.inkRoughness, values.inkBowing, values.inkWidth, values.inkSeed]);
  const hatch = useMemo(() => meatHatch(values.inkSeed, values.hatchRows, PERIOD), [values.inkSeed, values.hatchRows]);
  const salt = (name: (typeof CHEF_PARTS)[number]) => CHEF_PARTS.indexOf(name) * SALT;
  const hat = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const stache = useRef<SVGGElement>(null);
  const arm = useRef<SVGGElement>(null);
  const turning = useRef<SVGPathElement>(null);
  const refs = { hat, eyes, stache, arm, hatch: turning };
  useFrame(clock, time => {
    refs.hatch.current?.setAttribute("transform", `translate(${hatchOffset(time, values.spitSpeed, PERIOD)} 0)`);
    if (time < idleFrom) return;
    const pose = chefPose(time - idleFrom, values);
    refs.arm.current?.setAttribute("transform", `rotate(${pose.armAngle} ${SHOULDER.x} ${SHOULDER.y}) translate(${pose.armShift.x} ${pose.armShift.y})`);
    refs.hat.current?.setAttribute("transform", `rotate(${pose.hatAngle} ${HAT_PIVOT.x} ${HAT_PIVOT.y})`);
    refs.stache.current?.setAttribute("transform", `rotate(${pose.stacheAngle} ${STACHE_PIVOT.x} ${STACHE_PIVOT.y})`);
    refs.eyes.current?.setAttribute("transform", pose.blink ? `translate(0 ${EYE_LINE}) scale(1 0.15) translate(0 ${-EYE_LINE})` : "");
  });
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
        <path className="kb-fill" d={MEAT} />
        <g clipPath="url(#kb-meat)"><path ref={refs.hatch} className="kb-ink kb-hatch" d={hatch} strokeWidth={HATCH_WIDTH * values.inkWidth} /></g>
        <Ink part={{ ...parts.meat, fills: [] }} style={style} salt={salt("meat")} />
      </g>
      <g className="kb-chef-arm" ref={refs.arm}>
        <Ink part={parts.arm} style={style} salt={salt("arm")} />
        <Ink part={parts.knife} style={style} salt={salt("knife")} />
      </g>
      <g className="kb-chef-table">
        <Ink part={parts.counter} style={style} salt={salt("counter")} />
        <Ink part={parts.plate} style={style} salt={salt("plate")} />
      </g>
    </g>
  );
}
