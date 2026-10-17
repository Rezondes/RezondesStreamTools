// Webcam frame of the Südfrucht theme, transparent inside: frame of bamboo, wood or rope, palm leaves in the
// corners, hibiscus blossom, wooden name tag and live indicator with a starfish. Create the source as large as the camera.
import { fillTemplate } from "../../../core/template.ts";
import { ICONS, LEAF } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { suedfruchtNames, useSuedfrucht } from "../useSuedfrucht.ts";

const CORNERS = ["top-left", "bottom-right", "top-right", "bottom-left"] as const;

export default function Cam() {
  const values = useSuedfrucht();
  return (
    <div className={`sf-cam sf-cam-${values.camStyle}${values.camLeafSway ? " sway" : ""}`}>
      <div className="sf-cam-frame" />
      {CORNERS.slice(0, values.camLeaves).map(corner => (
        <div key={corner} className={`sf-cam-leaf ${corner}`}><ShapeIcon shape={LEAF} /></div>
      ))}
      {values.camFlower && <div className="sf-cam-flower"><ShapeIcon shape={ICONS.hibiskus} /></div>}
      <span className="sf-cam-label sf-wood">{fillTemplate(values.camLabel, suedfruchtNames(values))}</span>
      {values.camLive && <span className="sf-cam-live"><ShapeIcon shape={ICONS.seestern} />{values.camLiveText}</span>}
    </div>
  );
}
