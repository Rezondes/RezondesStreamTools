// Clock and frame hook of the Dogs scenes: sceneClock gives the seconds since the scene started (or the still of ?t=),
// useFrame calls draw with that time every animation frame (rule 21, cleaned up on unmount); with ?t= it draws once.
import { useEffect, useRef } from "react";
import { seekFromQuery } from "../../core/motion/seek.ts";

export const SEEK = seekFromQuery(location.search);
const SECOND_MS = 1000;

export function sceneClock(): () => number {
  const started = performance.now();
  return () => SEEK ?? (performance.now() - started) / SECOND_MS;
}

export function useFrame(clock: () => number, draw: (time: number) => void) {
  const latest = useRef(draw);
  latest.current = draw;
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      latest.current(clock());
      if (SEEK === null) frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [clock]);
}
