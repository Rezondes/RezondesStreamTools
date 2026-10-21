// Webcam frame of the Dachdecker theme (DESIGN-DACHDECKER.md "Kamera"), transparent inside: a frame of plan lines (or
// only the corners), terracotta corner marks, dimension chains along the top and the right edge, the name as a title
// block and a live mark. Create the source as large as the camera.
import { fillTemplate } from "../../../core/template.ts";
import DimensionLine from "../plan/DimensionLine.tsx";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";

export default function Cam() {
  const values = useDachdecker();
  const label = fillTemplate(values.camLabel, dachdeckerNames(values, Date.now()));
  return (
    <div className={`dd-cam dd-cam-${values.camStyle}`}>
      {values.camStyle === "plan" && <i className="dd-cam-frame" />}
      {values.camStyle !== "aus" && values.camCorners && (
        <>
          <i className="dd-cam-corner dd-cam-corner-start" />
          <i className="dd-cam-corner dd-cam-corner-end" />
        </>
      )}
      {values.camDimsOn && (
        <>
          <DimensionLine text={values.camDims} className="dd-cam-dim dd-cam-dim-top" />
          <DimensionLine text={values.camDims} className="dd-cam-dim dd-cam-dim-side" />
        </>
      )}
      {label && <span className="dd-cam-name">{label}</span>}
      {values.camLive && <span className="dd-cam-live">{values.camLiveText}</span>}
    </div>
  );
}
