// Stream numbers of the standard theme as an overlay of their own (taken out of the Ending, so the streamer places
// them wherever they want): the cards rise one after the other and count up when the source opens. Online only: the
// numbers come from the server, in ?demo the demo values. ?t=<s> shows a still.
import { useCallback, useRef } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import StatCards from "../screen/StatCards.tsx";
import { useStandard } from "../useStandard.ts";

// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: the cards rise from 24 px below, 0.5 s each, 0.12 s apart, then count up
const RISE = { from: 24, duration: 0.5, stagger: 0.12 };
const SEEK = seekFromQuery(location.search);

export default function Stats() {
  const values = useStandard();
  const now = useNow();
  const scope = useRef<HTMLDivElement>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  useTimeline(timeline => {
    timeline.from(".standard-st-rise", { opacity: 0, y: RISE.from, duration: RISE.duration, ease: "power2.out", stagger: RISE.stagger }, 0);
  }, [], scope);
  return (
    <div ref={scope} className="standard-stats">
      <StatCards values={values} clock={clock} start={RISE.duration} now={now} />
    </div>
  );
}
