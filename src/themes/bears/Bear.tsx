// One bear of the Bärenbande theme in a pose, drawn from the shapes in bears.ts: ears and tail behind the body, the body
// in the fur color with its one shade tone (and the black patches of the panda, both clipped to the body), the outline on
// top, then open inner lines, the face and props. The colors come from the settings via the classes (theme.css), the
// proportions of the bear via a scale around the bottom center. Eyes blink and the body breathes (CSS).
// BearFigure is the bare SVG group (for the tower), Bear the figure in its own SVG.
import { useId } from "react";
import { BEARS, partsFor, POSES, SIGN_TEXT, type BearId, type PoseName } from "./bears.ts";

type FigureProps = { bear: BearId; pose: PoseName; sign?: string };

// Ids from useId contain characters a url(#...) reference does not like
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9-]/g, "");

export function BearFigure({ bear, pose, sign }: FigureProps) {
  const id = safeId(useId());
  const shape = POSES[pose];
  const { scaleX, scaleY, patched } = BEARS[bear];
  const { width, height } = shape;
  const scale = `translate(${width / 2} ${height}) scale(${scaleX} ${scaleY}) translate(${-width / 2} ${-height})`;
  return (
    <g className={`bb-figure bb-${bear} bb-pose-${pose}`} transform={scale}>
      <defs>
        <clipPath id={`${id}-body`}><path d={shape.body} /></clipPath>
        {patched && <clipPath id={`${id}-patch`}>{shape.patches.map(path => <path key={path} d={path} />)}</clipPath>}
      </defs>
      {shape.back.map(part => <path key={part.d} className="part-back" d={part.d} />)}
      <g className="bb-body">
        <path className="part-fur" d={shape.body} />
        <g clipPath={`url(#${id}-body)`}>
          {shape.shade.map(path => <path key={path} className="part-shade" d={path} />)}
          {patched && shape.patches.map(path => <path key={path} className="part-patch" d={path} />)}
          {patched && (
            <g clipPath={`url(#${id}-patch)`}>
              {shape.shade.map(path => <path key={path} className="part-patch-shade" d={path} />)}
            </g>
          )}
        </g>
        <path className="part-outline" d={shape.body} />
        {partsFor(bear, pose).map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
        {sign && pose === "sign" && <text className="part-sign-text" x={SIGN_TEXT.x} y={SIGN_TEXT.y} textAnchor="middle">{sign}</text>}
      </g>
    </g>
  );
}

export default function Bear({ bear, pose, sign, className = "" }: FigureProps & { className?: string }) {
  const { width, height } = POSES[pose];
  return (
    <svg className={`bb-bear ${className}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <BearFigure bear={bear} pose={pose} sign={sign} />
    </svg>
  );
}
