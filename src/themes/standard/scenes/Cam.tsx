// Webcam-Rahmen des Standard-Themes, innen transparent: abgerundeter Rahmen im Farbverlauf, Namensschild unten links,
// optional Live-Anzeige oben rechts. Quelle so gross wie die Kamera anlegen.
import { fillTemplate } from "../../../core/template.ts";
import { standardNames, useStandard } from "../useStandard.ts";

export default function Cam() {
  const values = useStandard();
  return (
    <div className="standard-cam">
      <span className="standard-pill standard-name">{fillTemplate(values.camName, standardNames(values))}</span>
      {values.camLive && <span className="standard-pill standard-live"><i aria-hidden="true" />{values.camLiveText}</span>}
    </div>
  );
}
