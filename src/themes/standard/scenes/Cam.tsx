// Webcam frame of the standard theme, transparent inside: rounded frame in a color gradient that slowly wanders around
// (camSpinOn, one round in camSpinSeconds), name tag at the bottom left, optional live indicator at the top right; the
// frame and the tags fade in with GSAP. Create the source as large as the camera.
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { fillTemplate } from "../../../core/template.ts";
import { standardNames, useStandard } from "../useStandard.ts";

// fixed: durations in s, how far the tags rise in px and the stagger between them
const ENTER = { frame: 0.6, tag: 0.5, rise: 8, stagger: 0.12, tagsAt: 0.3 };

export default function Cam() {
  const values = useStandard();
  const frame = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.from(frame.current, { opacity: 0, duration: ENTER.frame, ease: "power1.out" });
    timeline.from(".standard-pill", { opacity: 0, y: ENTER.rise, duration: ENTER.tag, ease: "power2.out", stagger: ENTER.stagger }, ENTER.tagsAt);
  }, [values.camLive], frame);
  return (
    <div ref={frame} className={`standard-cam${values.camSpinOn ? " spins" : ""}`}>
      <span className="standard-pill standard-name">{fillTemplate(values.camName, standardNames(values))}</span>
      {values.camLive && <span className="standard-pill standard-live"><i aria-hidden="true" />{values.camLiveText}</span>}
    </div>
  );
}
