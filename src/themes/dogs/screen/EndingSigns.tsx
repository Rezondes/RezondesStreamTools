// The sign layer of the Ending of the Dogs theme (DESIGN-DOGS.md "Ending"): the title with its outline, the subtitle in
// the light color of the wall and the red pill; the stream numbers are an overlay of their own (scenes/Stats.tsx).
// Entrances on a GSAP timeline.
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate } from "../../../core/template.ts";
import { ENDING_INTRO } from "../ending.ts";
import type { DogsValues } from "../settings.ts";
import Pill from "../ui/Pill.tsx";
import { dogsNames } from "../useDogs.ts";

export default function EndingSigns({ values }: { values: DogsValues }) {
  const stage = useStage();
  useTimeline(timeline => {
    const { title, subtitle, bye } = ENDING_INTRO;
    const snap = { y: values.pixelScale };
    timeline.from(".dg-end-title", { y: title.y, duration: title.duration, ease: title.ease, snap }, title.at);
    timeline.from(".dg-end-title", { opacity: 0, duration: title.fade }, title.at);
    timeline.from(".dg-end-sub", { opacity: 0, duration: subtitle.duration }, subtitle.at);
    timeline.from(".dg-end-bye", { scale: 0, duration: bye.duration, ease: bye.ease }, bye.at);
  }, [values.pixelScale], stage);
  const names = dogsNames(values);
  return (
    <div className="dg-stage stage-box" ref={stage}>
      <div className="dg-title dg-end-title">{fillTemplate(values.endingTitle, names)}</div>
      <div className="dg-subtitle dg-end-sub">{fillTemplate(values.endingSubtitle, names)}</div>
      <div className="dg-end-bye"><Pill text={fillTemplate(values.endingBye, names)} /></div>
    </div>
  );
}
