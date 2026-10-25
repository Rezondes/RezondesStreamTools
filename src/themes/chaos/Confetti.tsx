// Confetti of the Chaos alert (confetti.ts): small Rough.js scribbles in the scribble colors thrown out of the note,
// tumbling down and fading; each piece is placed every frame from the time since the throw (DOM transforms, no React
// repaint). Origin in px of the overlay.
import { type CSSProperties, useEffect, useMemo, useRef } from "react";
import { seekFromQuery } from "../../core/motion/seek.ts";
import { confettiAt } from "./confetti.ts";
import { roughScribble } from "./roughScribbles.ts";

// piece: size and line of a piece in px (settings)
type Props = { count: number; seed: number; origin: { x: number; y: number }; start: number; piece: { size: number; line: number } };

const SEEK = seekFromQuery(location.search);

export default function Confetti({ count, seed, origin, start, piece: size }: Props) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, index) => {
    const first = confettiAt(seed, index, 0, origin);
    return { color: first.color, parts: roughScribble(first.kind, size.size, seed * 41 + index, size.line, true) };
  }), [count, seed, origin, size.size, size.line]);
  const nodes = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const seconds = SEEK ?? (performance.now() - start) / 1000;
      nodes.current.forEach((node, index) => {
        const piece = confettiAt(seed, index, seconds, origin);
        node?.setAttribute("transform", `translate(${piece.x.toFixed(1)} ${piece.y.toFixed(1)}) rotate(${piece.rotation.toFixed(1)})`);
        node?.setAttribute("opacity", piece.alpha.toFixed(2));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seed, origin, start]);
  return (
    <svg className="ch-confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <g key={index} ref={node => { nodes.current[index] = node; }} opacity={0} className={`ch-mark ch-mark-${piece.color}`} style={{ "--w": size.line } as CSSProperties}>
          {piece.parts.map((part, line) => <path key={line} d={part.d} />)}
        </g>
      ))}
    </svg>
  );
}
