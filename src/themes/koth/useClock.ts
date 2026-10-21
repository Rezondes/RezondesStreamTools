// Clock of a KOTH screen (PLAN-KOTH.md package 2): the GSAP timeline runs one shared clock for a day (a still image with
// ?t included); the 3D parts read it every frame, the 2D layer reads a value of it on the GSAP ticker and renders only
// when that value changes.
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useTimeline } from "../../core/motion/useTimeline.ts";
import { CLOCK_SECONDS, type KothClock } from "./build.ts";

export function useRunClock(clock: KothClock): void {
  useTimeline(timeline => {
    clock.time = 0;
    timeline.to(clock, { time: CLOCK_SECONDS, duration: CLOCK_SECONDS, ease: "none" });
  }, [clock]);
}

// A value of the clock (a number or a text): React skips the render while it stays the same
export function useClockValue<T extends string | number>(clock: KothClock, read: (time: number) => T): T {
  const reader = useRef(read);
  reader.current = read;
  const [value, setValue] = useState(() => read(clock.time));
  useEffect(() => {
    const tick = () => setValue(reader.current(clock.time));
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [clock]);
  return value;
}
