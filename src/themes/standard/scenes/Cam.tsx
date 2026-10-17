// Webcam frame of the standard theme, transparent inside: rounded frame in a color gradient, name tag at the bottom left,
// optional live indicator at the top right. Create the source as large as the camera.
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
