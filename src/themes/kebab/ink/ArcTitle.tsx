// The arc title of the logo (arc.ts) inside the logo SVG: every letter its own text in the title font, placed on the
// arc after its measured width once the fonts are loaded. Class kb-arc-letter for the GSAP timeline; ready tells the
// scene when the letters stand, so it builds the timeline after that.
import { useLayoutEffect, useRef, useState } from "react";
import { arcLayout, type ArcLetter } from "../arc.ts";

// fixed: the arc of the logo in the grid (center below the scene) and the gap between letters as a share of their size
const CENTER = { x: 300, y: 640 };
const RADIUS = 470;
const GAP = 0.06;
const SPACE = 0.35;

type Props = { text: string; size: number; span: number; stroke: number; onReady: () => void };

export default function ArcTitle({ text, size, span, stroke, onReady }: Props) {
  const letters = [...text];
  const refs = useRef<(SVGTextElement | null)[]>([]);
  const [layout, setLayout] = useState<ArcLetter[] | null>(null);
  const ready = useRef(onReady);
  ready.current = onReady;
  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const widths = [...text].map((char, index) => (char === " " ? size * SPACE : (refs.current[index]?.getComputedTextLength() ?? 0) + size * GAP));
      setLayout(arcLayout(widths, CENTER, RADIUS, span));
      ready.current();
    };
    void document.fonts.ready.then(measure);
    return () => { alive = false; };
  }, [text, size, span]);
  return (
    <g className="kb-arc" style={{ visibility: layout ? "visible" : "hidden" }}>
      {letters.map((char, index) => {
        const place = layout?.[index] ?? { x: 0, y: 0, angle: 0 };
        return (
          <g key={index} transform={`translate(${place.x} ${place.y}) rotate(${place.angle})`}>
            {char !== " " && <text ref={element => { refs.current[index] = element; }} className="kb-arc-letter" textAnchor="middle" fontSize={size} strokeWidth={stroke}>{char}</text>}
          </g>
        );
      })}
    </g>
  );
}
