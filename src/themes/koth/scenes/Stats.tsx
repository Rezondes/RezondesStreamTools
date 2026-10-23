// Stream numbers of the koth theme as an overlay of their own (the mission report, taken out of the Ending, so the
// streamer places it wherever they want): the card slides in, the lines count up, the stamp hits, on the timing of the
// Ending (screenSteps). Online only: the numbers come from the server, in ?demo the demo values. ?t=<s> shows a still.
import { useMemo, useState } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import Report from "../briefing/Report.tsx";
import { type KothClock, screenSteps, stepShare } from "../build.ts";
import { useClockValue, useRunClock } from "../useClock.ts";
import { useKoth } from "../useKoth.ts";

export default function Stats() {
  const values = useKoth();
  const now = useNow();
  const stats = useStreamStats();
  const [clock] = useState<KothClock>(() => ({ time: 0 }));
  useRunClock(clock);
  const steps = useMemo(
    () => screenSteps("ending", values.buildSpeed, { stampAt: values.stampAt, countUpMs: values.countUpMs }),
    [values.buildSpeed, values.stampAt, values.countUpMs],
  );
  const done = steps.stamp.start + steps.stamp.duration;
  const time = useClockValue(clock, at => Math.min(at, done));
  const lines = useMemo(() => parseStatLines(values.reportLines.join("\n")), [values.reportLines]);
  const rows = countedStats(stats, lines, values.locale, now, lines.map((_, index) => stepShare(steps.rows, time, index)));
  if (!values.reportOn) return null;
  return (
    <div className="kh-stats">
      <Report time={time} steps={steps} title={values.reportTitle} rows={rows} stamp={values.stampText} />
    </div>
  );
}
