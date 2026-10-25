// Webcam frame, transparent inside. Create the source exactly as large as the camera, e.g. 640x360.
// Label, REC indicator, clock and corners come from the settings. The frame switches on like the tube (crtMotion.ts),
// fine rain runs along the left and right edge (pixi/EdgeRain.tsx).
import { useRef } from "react";
import { fillTemplate } from "../../../core/template.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { powerOn, tubeLookOf } from "../crtMotion.ts";
import EdgeRain from "../pixi/EdgeRain.tsx";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { placeholders, useMatrix } from "../useMatrix.ts";

const SECOND_MS = 1000; // fixed: seconds in ms

export default function Cam() {
  const values = useMatrix();
  const label = useMatrixDecode(fillTemplate(values.camLabel, placeholders(values)), "camLabel");
  const now = useNow();
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const tube = scope.current;
    if (tube && values.camOnMs > 0) powerOn(timeline, tube, 0, values.camOnMs / SECOND_MS, tubeLookOf(values), tube.querySelector(".cam-flash"));
  }, [values], scope);
  return (
    <div ref={scope} className="cam">
      {values.camRain && <EdgeRain area={{ width: innerWidth, height: innerHeight }} />}
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div className="cam-label">{label}</div>
      {(values.camRec || values.camClock) && (
        <div className="cam-rec">
          {values.camRec && <><span className="blink">{values.camRecDot}</span> {values.camRecText} </>}
          {values.camClock && new Date(now).toLocaleTimeString(values.locale)}
        </div>
      )}
      <div className="cam-scan" aria-hidden="true" />
      <i className="cam-flash" aria-hidden="true" />
    </div>
  );
}
