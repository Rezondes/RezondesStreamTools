// Webcam-Rahmen des Südfrucht-Themes, innen transparent: Rahmen aus Bambus, Holz oder Seil, Palmblätter in den
// Ecken, Hibiskusblüte, Namensschild aus Holz und Live-Anzeige mit Seestern. Quelle so gross wie die Kamera anlegen.
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
