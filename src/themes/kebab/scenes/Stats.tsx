// Stream numbers of the Kebab theme as an overlay of their own (DESIGN-KEBAB.md "Ending", the closing bon taken out of
// the Ending so the streamer places it wherever they want): the printer drops, the bon "Tagesabschluss" is printed, its
// rows count up one after another, then the stamp hits the paper and the bon shakes. Transparent. Online only: the
// numbers come from the server, in ?demo the demo values. ?t=<s> shows a still.
import { useMemo, useRef, useState } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import { fillTemplate } from "../../../core/template.ts";
import { LOCALE, rowShares } from "../closing.ts";
import Stamp from "../screen/Stamp.tsx";
import { sceneClock, useFrame } from "../useFrame.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

export default function Stats() {
  const values = useKebab();
  const now = useNow();
  const stats = useStreamStats();
  const [clock] = useState(sceneClock);
  const [time, setTime] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => parseStatLines(values.closingLines.join("\n")), [values.closingLines]);
  useFrame(clock, setTime);
  useTimeline(timeline => {
    timeline.from(".kb-printer", { y: values.closingDropFrom, duration: values.closingDropTime, ease: "back.out(1.7)" }, values.closingPrinterAt);
    timeline.from(".kb-bon", { clipPath: "inset(0% 0% 100% 0%)", duration: values.closingFeedTime, ease: `steps(${values.closingSteps})` }, values.closingBonAt);
    timeline.set(".kb-bon", { clipPath: "none" }, values.closingPrintedAt);
    if (!values.stampOn) return;
    timeline.from(".kb-stamp", { scale: values.closingHitScale, opacity: 0, duration: values.closingHitTime, ease: "power4.in" }, values.stampAt);
    timeline.to(".kb-bon", { x: values.closingShake, duration: values.closingShakeTime, yoyo: true, repeat: values.closingShakes }, values.stampAt + values.closingHitTime);
  }, [values], box);
  const names = kebabNames(values);
  const rows = countedStats(stats, lines, LOCALE, now, rowShares(time, lines.length, values.countUpMs, values.closingPrintedAt, values.closingRowGap));
  return (
    <div className="kb-stats" ref={box}>
      <div className="kb-bon-box">
        <div className="kb-printer" />
        <div className="kb-bon">
          <div className="kb-bon-shop">{names.shop}</div>
          <div className="kb-bon-title">{fillTemplate(values.closingTitle, names)}</div>
          <hr />
          {rows.map((row, index) => <div key={index} className="kb-bon-item"><span>{row.label}</span><b>{row.value}</b></div>)}
          <hr />
          {values.stampOn && <Stamp text={values.stampText} />}
          <div className="kb-zigzag" />
        </div>
      </div>
    </div>
  );
}
