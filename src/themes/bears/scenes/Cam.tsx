// Webcam frame of the Bärenbande theme, transparent inside: frame of paper with the outline, wood or a polaroid; the chosen
// bear (or the tower) leans at a lower corner or peeks over the top edge; paper name tag and live pill. Create the source
// as large as the camera.
import { fillTemplate } from "../../../core/template.ts";
import type { BearId, PoseName } from "../bears.ts";
import Hero from "../Hero.tsx";
import IconShape from "../IconShape.tsx";
import { bearsNames, useBears } from "../useBears.ts";

// Leaning at a corner the bears wave, over the edge they look on
const POSES: Record<BearId, PoseName> = { eisbaer: "wave", grizzly: "wave", panda: "wave" };
const PEEK: Record<BearId, PoseName> = { eisbaer: "stand", grizzly: "stand", panda: "stand" };

export default function Cam() {
  const values = useBears();
  const peek = values.camBearSpot === "oben";
  return (
    <div className={`bb-cam bb-cam-${values.camStyle} bb-cam-spot-${values.camBearSpot} bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""}`}>
      <div className="bb-cam-frame" />
      <div className="bb-cam-bear"><Hero choice={values.bearCam} poses={peek ? PEEK : POSES} className="bb-hero" /></div>
      <span className="bb-cam-label bb-pill">{fillTemplate(values.camLabel, bearsNames(values))}</span>
      {values.camLive && <span className="bb-cam-live bb-pill"><IconShape name="pfote" />{values.camLiveText}</span>}
    </div>
  );
}
