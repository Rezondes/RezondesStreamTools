// Stream numbers of the matrix theme as an overlay of their own (the logout lines, taken out of the Ending, so the
// streamer places them wherever they want): each line counts up after the one before when the source opens. Online
// only: the numbers come from the server, in ?demo the demo values. ?t=<s> shows a still.
import { useMemo, useRef } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { type SceneClock, useClockValue } from "../../../core/motion/useClockValue.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import { useMatrix } from "../useMatrix.ts";

// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: the first line starts after 0.3 s, the next 0.25 s later
const COUNT = { start: 0.3, stagger: 0.25 };
// fixed: the clock runs for an hour, longer than any count
const RUN_SECONDS = 3600;

export default function Stats() {
  const values = useMatrix();
  const now = useNow();
  const stats = useStreamStats();
  const scope = useRef<HTMLDivElement>(null);
  const clock = useRef<SceneClock>({ time: 0 }).current;
  useTimeline(timeline => { timeline.to(clock, { time: RUN_SECONDS, duration: RUN_SECONDS, ease: "none" }, 0); }, [clock], scope);
  const lines = useMemo(() => parseStatLines(values.logoutLines.join("\n")), [values.logoutLines]);
  const count = Math.max(values.countUpMs / SECOND_MS, Number.EPSILON);
  const shares = useClockValue(clock, time => lines.map((_, index) => Math.min(1, Math.max(0, (time - COUNT.start - index * COUNT.stagger) / count))).join(","));
  const rows = countedStats(stats, lines, values.locale, now, shares.split(",").map(Number));
  return (
    <div ref={scope} className="matrix-stats">
      <div className="logout">
        {rows.map(row => <div key={row.label} className="logout-row"><span className="muted">{row.label}</span><span className="glow">{row.value}</span></div>)}
      </div>
    </div>
  );
}
