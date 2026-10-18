// Webcam frame of the Plantage theme, transparent inside: frame as a mango crate, plain wood or rope, mango leaves in
// the corners, a mango in the corner, wooden name tag and live indicator with a small mango. Create the source as large
// as the camera.
import { fillTemplate } from "../../../core/template.ts";
import { ICONS, LEAF } from "../field.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { plantageNames, usePlantage } from "../usePlantage.ts";

const CORNERS = ["top-left", "bottom-right", "top-right", "bottom-left"] as const;

export default function Cam() {
  const values = usePlantage();
  return (
    <div className={`pl-cam pl-cam-${values.camStyle}${values.camLeafSway ? " sway" : ""}`}>
      <div className="pl-cam-frame" />
      {CORNERS.slice(0, values.camLeaves).map(corner => (
        <div key={corner} className={`pl-cam-leaf ${corner}`}><ShapeIcon shape={LEAF} /></div>
      ))}
      {values.camMango && <div className="pl-cam-mango"><ShapeIcon shape={ICONS.mango} /></div>}
      <span className="pl-cam-label pl-wood">{fillTemplate(values.camLabel, plantageNames(values))}</span>
      {values.camLive && <span className="pl-cam-live"><ShapeIcon shape={ICONS.mango} />{values.camLiveText}</span>}
    </div>
  );
}
