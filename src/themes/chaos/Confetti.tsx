// Confetti of the Chaos theme: small scribbles (stars, X, bolts, hearts, plus) in the scribble colors that tumble down
// over the picture when an alert comes; kind, color, place, spin and delay from the seed. Motion in theme.css.
import { useMemo, type CSSProperties } from "react";
import { chance, weighted } from "./chance.ts";
import { scribbleShape, type ScribbleKind } from "./scribbles.ts";

const KINDS: readonly (readonly [ScribbleKind, number])[] = [["star", 3], ["x", 3], ["bolt", 2], ["heart", 1], ["plus", 2], ["zigzag", 1]];
const COLORS = ["color1", "color2", "color3", "color4", "white"] as const;

export default function Confetti({ count, seed }: { count: number; seed: number }) {
  const pieces = useMemo(() => {
    const random = chance(seed);
    return Array.from({ length: count }, () => ({
      paths: scribbleShape(weighted(random, KINDS), random),
      color: COLORS[Math.floor(random() * COLORS.length)],
      style: { "--x": random(), "--spin": random(), "--delay": random(), "--size": random() } as CSSProperties,
    }));
  }, [count, seed]);
  return (
    <div className="ch-confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <svg key={index} className={`ch-piece ch-mark ch-mark-${piece.color}`} viewBox="-0.6 -0.6 1.2 1.2" style={{ ...piece.style, "--w": 0.12 } as CSSProperties}>
          {piece.paths.map(path => <path key={path} d={path} />)}
        </svg>
      ))}
    </div>
  );
}
