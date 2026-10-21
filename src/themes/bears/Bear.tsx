// One bear of the Bärenbande theme in a pose, drawn from the rig (rig.ts): one SVG group per bone in drawing order (far
// limbs, tail and ears behind the body, the body in the fur color with its one shade tone and the black patches of the
// panda clipped to it, the near limbs, the head with face and worn props, held props and paws in front). Each group
// carries its bone as class (bone-<name>) and its pivot as transform origin, so CSS can turn a bone. The colors come from
// the settings via the classes (theme.css), the proportions of the bear via a scale around the bottom center. Eyes blink
// and the body breathes (CSS), or bearDriver sets the frames of boneMotion.ts on the bones. BearFigure is the bare SVG
// group (for the tower), Bear the figure in its own SVG inside a rig group that turns and scales around the feet.
import { useId } from "react";
import { BEARS, type BearId } from "./bears.ts";
import { BONE_GROUPS, type BoneFrame } from "./boneMotion.ts";
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
      <g className="bb-rig"><BearFigure bear={bear} pose={pose} sign={sign} turn={turn} drops={drops} /></g>
    </svg>
  );
}


// Sets frames of boneMotion.ts on a bear drawn by Bear: the rig turns and scales around the feet and bobs, the arm (lifted
// with what it holds) and the head turn around the pivots of the rig, the eyes close; the elements are looked up once
export function bearDriver(svg: SVGSVGElement, bear: BearId, pose: PoseName): (frame: BoneFrame) => void {
  const shape = poseOf(bear, pose);
  const pivotOf = (bone: string) => shape.layers.find(layer => layer.bone === bone)?.pivot ?? [0, 0];
  const turner = (bones: readonly string[], pivot: readonly [number, number]) => {
    const groups = bones.flatMap(bone => [...svg.querySelectorAll<SVGGElement>(`.bone-${bone}`)]);
    for (const group of groups) group.style.transformOrigin = `${pivot[0]}px ${pivot[1]}px`;
    return (degrees: number, lift = 0) => { for (const group of groups) group.style.transform = `translateY(${lift}px) rotate(${degrees}deg)`; };
  };
  const [arm, farArm, head] = [BONE_GROUPS.arm, BONE_GROUPS.farArm, BONE_GROUPS.head].map(bones => turner(bones, pivotOf(bones[0])));
  const rig = svg.querySelector<SVGGElement>(".bb-rig");
  const eyes = [...svg.querySelectorAll<SVGPathElement>(".part-eye")];
  const { width, height } = POSES[pose];
  if (rig) rig.style.transformOrigin = `${width / 2}px ${height}px`;
  return frame => {
    if (rig) rig.style.transform = `translateY(${frame.body.y}px) rotate(${frame.body.rotate}deg) scale(${frame.body.scaleX}, ${frame.body.scaleY})`;
    arm(frame.arm, frame.lift);
    farArm(frame.farArm);
    head(frame.head);
    for (const eye of eyes) eye.style.transform = frame.eyes === 1 ? "" : `scaleY(${frame.eyes})`;
  };
}
