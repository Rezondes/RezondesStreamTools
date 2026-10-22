// Webcam frame of the KOTH theme, transparent inside: helmet camera (steel frame with corner marks, battery and REC),
// rifle scope (round view with mil dots) or plain; optional crosshair, name tag with callsign. Create the source as large
// as the camera. On fade-in the crosshair pulls together and the battery bars fill one by one (GSAP, PLAN-KOTH.md
// package 4).
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { fillTemplate } from "../../../core/template.ts";
import { kothNames, useKoth } from "../useKoth.ts";

const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
// fixed: the crosshair starts this large and turned (deg) and pulls together in (s); the battery bars fill one by one
const CROSS = { scale: 1.8, turn: 45, length: 0.9, ease: "back.out(1.6)" };
const BARS = { length: 0.15, step: 0.18, after: 0.5 };

export default function Cam() {
  const values = useKoth();
  const cam = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const cross = cam.current?.querySelector(".kh-cam-cross");
    if (cross) timeline.fromTo(cross, { opacity: 0, scale: CROSS.scale, rotate: CROSS.turn }, { opacity: 1, scale: 1, rotate: 0, duration: CROSS.length, ease: CROSS.ease }, 0);
    const bars = cam.current?.querySelectorAll(".kh-cam-battery i");
    if (bars?.length) timeline.from(bars, { opacity: 0, duration: BARS.length, stagger: BARS.step }, BARS.after);
  }, [values.camCross, values.camBattery], cam);
  return (
    <div ref={cam} className={`kh-cam kh-cam-${values.camStyle}`}>
      <div className="kh-cam-frame" />
      {values.camMarks && CORNERS.map(corner => <i key={corner} className={`kh-cam-mark ${corner}`} />)}
      {values.camCross && <div className="kh-cam-cross" />}
      <span className="kh-cam-label">{fillTemplate(values.camLabel, kothNames(values))}</span>
      {values.camLive && <span className="kh-cam-live"><i />{values.camLiveText}</span>}
      {values.camBattery && <span className="kh-cam-battery"><i /><i /><i /></span>}
    </div>
  );
}
