// A value of a scene clock (a number or a text) that a GSAP timeline runs: read on the GSAP ticker, React renders only
// when the value changes (a still image with ?t= included, the timeline seeks the clock).
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

export type SceneClock = { time: number };

export function useClockValue<T extends string | number>(clock: SceneClock, read: (time: number) => T): T {
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
