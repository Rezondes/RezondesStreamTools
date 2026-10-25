// Stream numbers of the standard stats overlay (endingStats, "key|Text" per line) as small cards side by side; from start on
// each one counts up over countUpMs, a little after the one before. Real numbers from the server, in ?demo the demo
// values, without stats dashes (countedStats of the core).
import { useMemo } from "react";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { useClockValue } from "../../../core/motion/useClockValue.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import type { StandardValues } from "../settings.ts";

type Props = { values: StandardValues; clock: () => number; start: number; now: number };

// fixed: seconds in ms
const SECOND_MS = 1000;

export default function StatCards({ values, clock, start, now }: Props) {
  const stats = useStreamStats();
  const lines = useMemo(() => parseStatLines(values.endingStats.join("\n")), [values.endingStats]);
  const sceneClock = useMemo(() => ({ get time() { return clock(); } }), [clock]);
  const count = Math.max(values.countUpMs / SECOND_MS, Number.EPSILON);
  const shares = useClockValue(sceneClock, time => lines.map((_, index) => Math.min(1, Math.max(0, (time - start - index * values.statsCountStagger) / count))).join(","));
  const rows = countedStats(stats, lines, values.locale, now, shares.split(",").map(Number));
  if (rows.length === 0) return null;
  return (
    <div className="standard-st-stats">
      {rows.map(row => (
        <div key={row.label} className="standard-st-stat standard-st-rise">
          <b>{row.value}</b>
          <span>{row.label}</span>
        </div>
      ))}
    </div>
  );
}
