// Webcam frame of the Kebab theme (DESIGN-KEBAB.md "Kamera"), transparent inside: the window of the shop with a red
// frame, an awning with stripes and scallops above it (awning.ts) and the counter below it with the name sign; or only
// the frame. Create the source as large as the camera.
import { fillTemplate } from "../../../core/template.ts";
import { awning, AWNING_BOX } from "../awning.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

export default function Cam() {
  const values = useKebab();
  const label = fillTemplate(values.camLabel, kebabNames(values));
  if (values.camStyle === "aus") return null;
  const shape = awning(values.camAwningStripes);
  const shop = values.camStyle === "fenster";
  return (
    <div className={`kb-cam kb-cam-${values.camStyle}`}>
      <i className="kb-cam-frame" />
      {shop && values.camAwning && (
        <svg className="kb-cam-awning" viewBox={`0 0 ${AWNING_BOX.width} ${AWNING_BOX.height}`} preserveAspectRatio="none" aria-hidden="true">
          <clipPath id="kb-awning"><path d={shape.edge} /></clipPath>
          <g clipPath="url(#kb-awning)">
            {shape.stripes.map(stripe => <rect key={stripe.x} className={stripe.red ? "kb-awning-red" : "kb-awning-paper"} x={stripe.x} y={0} width={stripe.width} height={AWNING_BOX.height} />)}
          </g>
          <path className="kb-awning-edge" d={shape.edge} />
        </svg>
      )}
      {shop && values.camCounter && <i className="kb-cam-counter" />}
      {label && <span className="kb-cam-name">{label}</span>}
    </div>
  );
}
