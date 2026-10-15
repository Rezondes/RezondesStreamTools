// Webcam-Rahmen des Starter-Themes, innen transparent: abgerundeter Rahmen im Farbverlauf, Namensschild unten links,
// optional Live-Anzeige oben rechts. Quelle so gross wie die Kamera anlegen.
import { fillTemplate } from "../../../core/template.ts";
import { starterNames, useStarter } from "../useStarter.ts";

export default function Cam() {
  const values = useStarter();
  return (
    <div className="starter-cam">
      <span className="starter-pill starter-name">{fillTemplate(values.camName, starterNames(values))}</span>
      {values.camLive && <span className="starter-pill starter-live"><i aria-hidden="true" />{values.camLiveText}</span>}
    </div>
  );
}
