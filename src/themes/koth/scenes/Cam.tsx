// Webcam frame of the KOTH theme, transparent inside: helmet camera (steel frame with corner marks, battery and REC),
// rifle scope (round view with mil dots) or plain; optional crosshair, name tag with callsign. Create the source as large
// as the camera.
import { fillTemplate } from "../../../core/template.ts";
import { kothNames, useKoth } from "../useKoth.ts";

const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

export default function Cam() {
  const values = useKoth();
  return (
    <div className={`kh-cam kh-cam-${values.camStyle}`}>
      <div className="kh-cam-frame" />
      {values.camMarks && CORNERS.map(corner => <i key={corner} className={`kh-cam-mark ${corner}`} />)}
      {values.camCross && <div className="kh-cam-cross" />}
      <span className="kh-cam-label">{fillTemplate(values.camLabel, kothNames(values))}</span>
      {values.camLive && <span className="kh-cam-live"><i />{values.camLiveText}</span>}
      {values.camBattery && <span className="kh-cam-battery"><i /><i /><i /></span>}
    </div>
  );
}
