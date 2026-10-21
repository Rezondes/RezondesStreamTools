// Clock of a KOTH screen (PLAN-KOTH.md package 2): the GSAP timeline runs one shared clock for a day (a still image with
// ?t included); the 3D parts read it every frame, the 2D layer reads a value of it on the GSAP ticker and renders only
// when that value changes.
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { CLOCK_SECONDS, type KothClock } from "./build.ts";

export function useRunClock(clock: KothClock): void {
  useTimeline(timeline => {
    clock.time = 0;
    timeline.to(clock, { time: CLOCK_SECONDS, duration: CLOCK_SECONDS, ease: "none" });
  }, [clock]);
}

export { useClockValue } from "../../core/motion/useClockValue.ts";
