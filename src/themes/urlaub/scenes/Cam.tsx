// Webcam frame of the Urlaub theme, transparent inside: frame of bamboo, wood or rope, palm leaves in the
// corners, hibiscus blossom, wooden name tag and live indicator with a starfish. Create the source as large as the camera.
import { fillTemplate } from "../../../core/template.ts";
import { ICONS, LEAF } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { urlaubNames, useUrlaub } from "../useUrlaub.ts";

const CORNERS = ["top-left", "bottom-right", "top-right", "bottom-left"] as const;

export default function Cam() {
  const values = useUrlaub();
  return (
    <div className={`ul-cam ul-cam-${values.camStyle}${values.camLeafSway ? " sway" : ""}`}>
      <div className="ul-cam-frame" />
      {CORNERS.slice(0, values.camLeaves).map(corner => (
        <div key={corner} className={`ul-cam-leaf ${corner}`}><ShapeIcon shape={LEAF} /></div>
      ))}
      {values.camFlower && <div className="ul-cam-flower"><ShapeIcon shape={ICONS.hibiskus} /></div>}
      <span className="ul-cam-label ul-wood">{fillTemplate(values.camLabel, urlaubNames(values))}</span>
      {values.camLive && <span className="ul-cam-live"><ShapeIcon shape={ICONS.seestern} />{values.camLiveText}</span>}
    </div>
  );
}
