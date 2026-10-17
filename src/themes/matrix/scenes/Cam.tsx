// Webcam frame, transparent inside. Create the source exactly as large as the camera, e.g. 640x360.
// Label, REC indicator, clock and corners come from the settings.
import { fillTemplate } from "../../../core/template.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { placeholders, useMatrix } from "../useMatrix.ts";

export default function Cam() {
  const values = useMatrix();
  const label = useMatrixDecode(fillTemplate(values.camLabel, placeholders(values)), "camLabel");
  const now = useNow();
  return (
    <div className="cam">
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div className="cam-label">{label}</div>
      {(values.camRec || values.camClock) && (
        <div className="cam-rec">
          {values.camRec && <><span className="blink">{values.camRecDot}</span> {values.camRecText} </>}
          {values.camClock && new Date(now).toLocaleTimeString(values.locale)}
        </div>
      )}
      <div className="cam-scan" aria-hidden="true" />
    </div>
  );
}
