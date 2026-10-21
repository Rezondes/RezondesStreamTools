// The roof frame of the Dachdecker theme as a flat line drawing (dashboard scenery of the skin, no WebGL): every beam of
// roofFrame in an oblique view, the front truss in terracotta. Pure decoration.
import { roofFrame, sketchLines, type FrameDims } from "./frame.ts";

// Margin around the drawing in metres
const MARGIN = 0.5;

export default function Sketch({ dims, className = "" }: { dims: FrameDims; className?: string }) {
  const lines = sketchLines(roofFrame(dims));
  const xs = lines.flatMap(line => [line.from[0], line.to[0]]);
  const ys = lines.flatMap(line => [line.from[1], line.to[1]]);
  const [left, top] = [Math.min(...xs) - MARGIN, Math.min(...ys) - MARGIN];
  const box = `${left} ${top} ${Math.max(...xs) + MARGIN - left} ${Math.max(...ys) + MARGIN - top}`;
  return (
    <svg className={`dd-sketch ${className}`} viewBox={box} aria-hidden="true">
      {lines.map((line, index) => (
        <line key={index} className={line.kind === "front" ? "dd-sketch-front" : "dd-sketch-line"} x1={line.from[0]} y1={line.from[1]} x2={line.to[0]} y2={line.to[1]} />
      ))}
    </svg>
  );
}
