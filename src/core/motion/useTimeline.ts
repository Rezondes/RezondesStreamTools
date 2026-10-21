// GSAP timelines for scenes (plans/PLAN-GRAFIK.md, package 2): registers the free plugins and the named curves once,
// builds the timeline after mount, rebuilds it when deps change and kills it on unmount (useGSAP reverts everything the
// build created). With ?t= in the address the timeline stops at that time and still runs callbacks and onUpdate up to
// there, so counters show their values in still images.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";
import { type RefObject, useRef } from "react";
import { EASE_NAMES, EASES } from "./ease.ts";
import { seekFromQuery } from "./seek.ts";

let registered = false;

export function registerMotion(): void {
  if (registered) return;
  gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin, SplitText);
  for (const name of EASE_NAMES) CustomEase.create(name, EASES[name]);
  registered = true;
}

export function useTimeline(
  build: (timeline: gsap.core.Timeline) => void,
  deps: readonly unknown[],
  scope?: RefObject<Element | null>,
): RefObject<gsap.core.Timeline | null> {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  useGSAP(() => {
    registerMotion();
    const created = gsap.timeline();
    build(created);
    const at = seekFromQuery(location.search);
    if (at !== null) {
      // Large jumps of the clock would otherwise be smoothed away and the still image would lag behind
      gsap.ticker.lagSmoothing(0);
      created.pause();
      created.seek(at, false);
    }
    timeline.current = created;
    return () => {
      created.kill();
      timeline.current = null;
    };
  }, { dependencies: [...deps], scope, revertOnUpdate: true });
  return timeline;
}
