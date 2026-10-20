// One bear of the Bärenbande theme in a pose, drawn from the rig (rig.ts): one SVG group per bone in drawing order (far
// limbs, tail and ears behind the body, the body in the fur color with its one shade tone and the black patches of the
// panda clipped to it, the near limbs, the head with face and worn props, held props and paws in front). Each group
// carries its bone as class (bone-<name>) and its pivot as transform origin, so CSS can turn a bone. The colors come from
// the settings via the classes (theme.css), the proportions of the bear via a scale around the bottom center. Eyes blink
// and the body breathes (CSS). BearFigure is the bare SVG group (for the tower), Bear the figure in its own SVG.
import { useId } from "react";
import { BEARS, type BearId } from "./bears.ts";
import { poseOf, POSES, type Drops, type PoseName, type RigLayer } from "./rig.ts";

// turn: radians around the upright axis (0 = three-quarter view, positive toward the camera); drops: how far legs reach
// down (e.g. onto the back below in a tower)
type FigureProps = { bear: BearId; pose: PoseName; sign?: string; turn?: number; drops?: Drops };

// Ids from useId contain characters a url(#...) reference does not like
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9-]/g, "");

function BodyBlob({ layer, id, patched }: { layer: RigLayer; id: string; patched: boolean }) {
  const body = layer.body;
  if (!body) return null;
  return (
    <>
      <defs>
        <clipPath id={`${id}-body`}><path d={body.silhouette} /></clipPath>
        {patched && <clipPath id={`${id}-patch`}>{body.patches.map(path => <path key={path} d={path} />)}</clipPath>}
      </defs>
      <path className="part-fur" d={body.silhouette} />
      <g clipPath={`url(#${id}-body)`}>
        {body.shade.map(path => <path key={path} className="part-shade" d={path} />)}
        {patched && body.patches.map(path => <path key={path} className="part-patch" d={path} />)}
        {patched && <g clipPath={`url(#${id}-patch)`}>{body.shade.map(path => <path key={path} className="part-patch-shade" d={path} />)}</g>}
      </g>
      <path className="part-outline" d={body.silhouette} />
    </>
  );
}

export function BearFigure({ bear, pose, sign, turn = 0, drops }: FigureProps) {
  const id = safeId(useId());
  const shape = poseOf(bear, pose, turn, drops);
  const { scaleX, scaleY, patched } = BEARS[bear];
  const { width, height } = shape;
  const scale = `translate(${width / 2} ${height}) scale(${scaleX} ${scaleY}) translate(${-width / 2} ${-height})`;
  return (
    <g className={`bb-figure bb-${bear} bb-pose-${pose}`} transform={scale}>
      <g className="bb-body">
        {shape.layers.map(layer => (
          <g key={layer.bone} className={`bb-bone bone-${layer.bone}`} style={{ transformOrigin: `${layer.pivot[0]}px ${layer.pivot[1]}px` }}>
            {layer.body
              ? <BodyBlob layer={layer} id={id} patched={patched} />
              : layer.parts.filter(part => part.kind !== "patch" || patched).map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
          </g>
        ))}
        {sign && pose === "sign" && <text className="part-sign-text" x={shape.anchors.signText[0]} y={shape.anchors.signText[1]} textAnchor="middle">{sign}</text>}
      </g>
    </g>
  );
}

export default function Bear({ bear, pose, sign, turn, drops, className = "" }: FigureProps & { className?: string }) {
  const { width, height } = POSES[pose];
  return (
    <svg className={`bb-bear ${className}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <BearFigure bear={bear} pose={pose} sign={sign} turn={turn} drops={drops} />
    </svg>
  );
}
