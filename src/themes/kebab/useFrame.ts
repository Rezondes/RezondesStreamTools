// Hook of the Kebab scenes: calls draw with the scene time every animation frame (rule 21, cleaned up on unmount);
// with ?t=<seconds> it draws that still once. The time is the clock of the scene (seconds since mount).
import { useEffect, useRef } from "react";
import { seekFromQuery } from "../../core/motion/seek.ts";

export const SEEK = seekFromQuery(location.search);
const SECOND_MS = 1000;

// The clock of a scene: seconds since the first call, or the still of ?t=
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
