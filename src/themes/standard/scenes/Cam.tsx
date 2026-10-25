// Webcam frame of the standard theme, transparent inside: rounded frame in a color gradient that slowly wanders around
// (camSpinOn, one round in camSpinSeconds), name tag at the bottom left, optional live indicator at the top right; the
// frame and the tags fade in with GSAP. Create the source as large as the camera.
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { fillTemplate } from "../../../core/template.ts";
import { standardNames, useStandard } from "../useStandard.ts";

export default function Cam() {
  const values = useStandard();
  const frame = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.from(frame.current, { opacity: 0, duration: values.camEnterFrame, ease: "power1.out" });
    timeline.from(".standard-pill", { opacity: 0, y: values.camEnterRise, duration: values.camEnterTag, ease: "power2.out", stagger: values.camEnterStagger }, values.camEnterTagsAt);
  }, [values], frame);
  return (
    <div ref={frame} className={`standard-cam${values.camSpinOn ? " spins" : ""}`}>
      <span className="standard-pill standard-name">{fillTemplate(values.camName, standardNames(values))}</span>
      {values.camLive && <span className="standard-pill standard-live"><i aria-hidden="true" />{values.camLiveText}</span>}
    </div>
  );
}
