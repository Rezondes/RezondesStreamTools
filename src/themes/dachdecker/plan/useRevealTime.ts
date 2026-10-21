// Hook: the clock of a Dachdecker screen. The GSAP timeline runs the shared clock for a day (still image with ?t
// included), the 3D parts read it every frame; the returned time follows it only until the texts are revealed, so the
// plan layer renders often at the start and then only for the countdown.
import { useState } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { type BuildClock, CLOCK_SECONDS, type Schedule, textsEnd } from "../schedule.ts";

export function useRevealTime(clock: BuildClock, schedule: Schedule): number {
  const [time, setTime] = useState(0);
  useTimeline(timeline => {
    const end = textsEnd(schedule);
    let last = -1;
    clock.time = 0;
    timeline.to(clock, {
      time: CLOCK_SECONDS, duration: CLOCK_SECONDS, ease: "none",
      onUpdate: () => {
        const shown = Math.min(clock.time, end);
        if (shown !== last) setTime((last = shown));
      },
    });
  }, [schedule, clock]);
  return time;
}
