// A sprayed title of the Chaos theme: the text in the title font with neon glow and a ragged spray edge, a glitch copy in
// magenta and cyan now and then (theme.css), and around it spray speckles and drips running down from the letters. The
// speckles and drips are measured to the text box after the fonts are loaded and come from the seed, so the title looks
// the same every time. Drips only when switched on in the settings.
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { seedOf } from "../../core/hash.ts";
import { dripPath, speckles, titleDrips } from "./strokes.ts";
import { useChaos } from "./useChaos.ts";

type Props = { text: string; seed: string; className?: string };

// Speckles per square pixel of the title box, drips per title, where drips start (share of the height)
const SPECKLE_DENSITY = 1 / 250;
const DRIPS = 9;
const DRIP_START = 0.72;

export default function SprayTitle({ text, seed, className = "" }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const title = useRef<HTMLHeadingElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = title.current;
    if (!element) return undefined;
    const measure = () => setBox({ width: element.offsetWidth, height: element.offsetHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, []);
  const base = seedOf(`${seed}:${text}`);
  const dots = useMemo(() => speckles(base, box.width, box.height, Math.round(box.width * box.height * SPECKLE_DENSITY)), [base, box]);
  const drips = useMemo(() => titleDrips(base, DRIPS), [base]);

  return (
    <div className={`ch-title-wrap ${className}`}>
      <svg className="ch-defs" aria-hidden="true">
        <filter id={`${id}-spray`} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={5} result="grit" />
          <feDisplacementMap in="SourceGraphic" in2="grit" scale={8 * values.jitter} />
        </filter>
      </svg>
      <svg className="ch-title-spray" width={box.width} height={box.height} aria-hidden="true">
        {dots.map((dot, index) => <circle key={index} className={dot.hot ? "ch-speckle-hot" : "ch-speckle"} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} />)}
        {values.drips && box.width > 0 && drips.map(drip => (
          <path key={drip.at} className="ch-title-drip" d={dripPath(drip.at * box.width, box.height * DRIP_START, drip.length, drip.thickness)} />
        ))}
      </svg>
      <h1 ref={title} className="ch-title" data-text={text} style={{ filter: `url(#${id}-spray)` }}>{text}</h1>
    </div>
  );
}
