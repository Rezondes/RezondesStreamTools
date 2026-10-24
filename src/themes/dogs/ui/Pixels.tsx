// A pixel image of the kit as SVG rects, one per run of equal color in a row (rowRuns): for the dashboard skin and the
// small dogs next to the signs, where no PixiJS stage is needed. Without a size the scene sizes it in CSS; with
// pixelScale it is that many screen pixels per image pixel.
import { useMemo } from "react";
import { rowRuns, type PixelImage } from "../pixels.ts";

type Props = { image: PixelImage; className: string; aspect?: string; pixelScale?: number };

export default function Pixels({ image, className, aspect = "xMidYMax meet", pixelScale }: Props) {
  const runs = useMemo(() => rowRuns(image), [image]);
  const size = pixelScale ? { width: image.width * pixelScale, height: image.height * pixelScale } : {};
  return (
    <svg className={className} viewBox={`0 0 ${image.width} ${image.height}`} shapeRendering="crispEdges" preserveAspectRatio={aspect} {...size} aria-hidden="true">
      {runs.map(run => <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={run.color} />)}
    </svg>
  );
}
