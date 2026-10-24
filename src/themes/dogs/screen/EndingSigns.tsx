// The sign layer of the Ending of the Dogs theme (DESIGN-DOGS.md "Ending"): the title with its outline, the subtitle in
// the light color of the wall, the red pill and the card "HEUTE IM RUDEL" with the real numbers of the stream
// (useStreamStats, in ?demo the demo values) counting up after the card came. Entrances on a GSAP timeline.
import { useMemo, useState } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import { fillTemplate } from "../../../core/template.ts";
import { countShare, ENDING_INTRO } from "../ending.ts";
import type { DogsValues } from "../settings.ts";
import Pill from "../ui/Pill.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { dogsNames } from "../useDogs.ts";
import { useFrame } from "../useFrame.ts";

// fixed: numbers in German
const LOCALE = "de-DE";

export default function EndingSigns({ values, clock }: { values: DogsValues; clock: () => number }) {
  const stage = useStage();
  const now = useNow();
  const stats = useStreamStats();
  const [share, setShare] = useState(0);
  const lines = useMemo(() => parseStatLines(values.endingStats.join("\n")), [values.endingStats]);
  useFrame(clock, time => setShare(countShare(time)));
  useTimeline(timeline => {
    const { title, subtitle, bye, card } = ENDING_INTRO;
    const snap = { y: values.pixelScale };
    timeline.from(".dg-end-title", { y: title.y, duration: title.duration, ease: title.ease, snap }, title.at);
    timeline.from(".dg-end-title", { opacity: 0, duration: title.fade }, title.at);
    timeline.from(".dg-end-sub", { opacity: 0, duration: subtitle.duration }, subtitle.at);
    timeline.from(".dg-end-bye", { scale: 0, duration: bye.duration, ease: bye.ease }, bye.at);
    timeline.from(".dg-end-card", { y: card.y, duration: card.duration, ease: card.ease, snap }, card.at);
  }, [values.pixelScale], stage);
  const names = dogsNames(values);
  const rows = countedStats(stats, lines, LOCALE, now, lines.map(() => share));
  return (
    <div className="dg-stage stage-box" ref={stage}>
      <div className="dg-title dg-end-title">{fillTemplate(values.endingTitle, names)}</div>
      <div className="dg-subtitle dg-end-sub">{fillTemplate(values.endingSubtitle, names)}</div>
      <div className="dg-end-bye"><Pill text={fillTemplate(values.endingBye, names)} /></div>
      <PixelBox className="dg-end-card">
        <div className="dg-caption">{values.endingCardLabel}</div>
        <div className="dg-end-rows">
          {rows.map((row, index) => <div key={index}><div className="dg-end-number">{row.value}</div><div className="dg-end-label">{row.label}</div></div>)}
        </div>
      </PixelBox>
    </div>
  );
}
