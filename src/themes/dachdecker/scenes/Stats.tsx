// Stream numbers of the dachdecker theme as an overlay of their own (the acceptance protocol with its stamp, taken out
// of the Ending, so the streamer places it wherever they want): the sheet slides in, the lines count up, the stamp hits
// with its thump, on the timing of the Ending (buildSchedule) moved forward. Online only: the numbers come from the
// server, in ?demo the demo values. ?t=<s> shows a still.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { parseStatLines } from "../../../core/stats/stats.ts";
import Protocol from "../plan/Protocol.tsx";
import Stamp from "../plan/Stamp.tsx";
import { useRevealTime } from "../plan/useRevealTime.ts";
import { LOCALE, protocolRows } from "../protocol.ts";
import { type BuildClock, type BuildStep, buildSchedule, reached, shakeAt } from "../schedule.ts";
import { playStamp } from "../tones.ts";
import { useDachdecker } from "../useDachdecker.ts";

export default function Stats() {
  const values = useDachdecker();
  const now = useNow();
  const stats = useStreamStats();
  const [clock] = useState<BuildClock>(() => ({ time: 0 }));
  // The Ending timing, moved forward: the sheet comes at once instead of after the title, rows and stamp keep their gaps
  const schedule = useMemo(() => {
    const ending = buildSchedule({ buildSpeed: values.buildSpeed, scrambleMs: values.scrambleMs, countUpMs: values.countUpMs, windowStep: values.windowStep, stampAt: values.stampAt }, "ending");
    const earlier = ending.card.start - values.statsCardAt;
    const moved = (step: BuildStep): BuildStep => ({ ...step, start: Math.max(0, step.start - earlier) });
    return { ...ending, card: moved(ending.card), rows: moved(ending.rows), stamp: moved(ending.stamp) };
  }, [values.buildSpeed, values.scrambleMs, values.countUpMs, values.windowStep, values.stampAt, values.statsCardAt]);
  const time = useRevealTime(clock, schedule);
  const lines = useMemo(() => parseStatLines(values.protocolLines.join("\n")), [values.protocolLines]);
  const rows = protocolRows(stats, lines, LOCALE, now, lines.map((_, index) => reached({ ...schedule.rows, start: schedule.rows.start + index * schedule.rows.stagger }, time)));
  const stamped = reached(schedule.stamp, time);
  // The stamp sounds once when it hits
  const thumped = useRef(false);
  useEffect(() => {
    if (!values.stampOn || !values.stampSound || stamped < 1 || thumped.current) return;
    thumped.current = true;
    playStamp();
  }, [stamped, values.stampOn, values.stampSound]);
  if (!values.protocolOn) return null;
  return (
    <div className="dd-stats">
      <Protocol title={values.protocolTitle} rows={rows} shown={reached(schedule.card, time)} shake={values.stampOn ? shakeAt(schedule.stamp, time) : 0} />
      {values.stampOn && <Stamp text={values.stampText} share={stamped} look={{ fromScale: values.stampFromScale, fromTurn: values.stampFromTurn, rest: values.stampRest }} />}
    </div>
  );
}
