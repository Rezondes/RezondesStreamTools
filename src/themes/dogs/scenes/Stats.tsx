// Stream numbers of the Dogs theme as an overlay of their own (the card of the Ending taken out, DESIGN-DOGS.md
// "Ending"): a red pill with the caption over a column of pixel boxes, one per line, whose numbers count up after the
// start. Transparent. Online only: the numbers come from the server, in ?demo the demo values. ?t=<s> shows a still.
import { useMemo, useState } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import { countShare, ENDING_INTRO } from "../ending.ts";
import Pill from "../ui/Pill.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { useDogs } from "../useDogs.ts";
import { sceneClock, useFrame } from "../useFrame.ts";

// fixed: numbers in German; counting starts 0.3 s after the scene
const LOCALE = "de-DE";
const COUNT_AFTER = 0.3;

export default function Stats() {
  const values = useDogs();
  const now = useNow();
  const stats = useStreamStats();
  const [clock] = useState(sceneClock);
  const [share, setShare] = useState(0);
  const lines = useMemo(() => parseStatLines(values.endingStats.join("\n")), [values.endingStats]);
  useFrame(clock, time => setShare(countShare(time - COUNT_AFTER + ENDING_INTRO.count.from)));
  const rows = countedStats(stats, lines, LOCALE, now, lines.map(() => share));
  return (
    <div className="dg-stats">
      <Pill className="dg-stats-caption" text={values.endingCardLabel} />
      {rows.map((row, index) => (
        <PixelBox key={index} className="dg-stats-row">
          <b className="dg-stats-number">{row.value}</b>
          <span className="dg-stats-label">{row.label}</span>
        </PixelBox>
      ))}
    </div>
  );
}
