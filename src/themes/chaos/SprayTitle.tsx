// A sprayed title of the Chaos theme: the text in the title font with neon glow and a ragged spray edge, a glitch copy in
// magenta and cyan now and then (theme.css), and around it spray speckles and drips running down from the letters. The
// speckles and drips are measured to the text box after the fonts are loaded and come from the seed, so the title looks
// the same every time. Drips only when switched on in the settings.
import { type CSSProperties, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { seedOf } from "../../core/hash.ts";
import { dripAnchor, dripPath, speckles, sprayPassAt, titleDrips } from "./strokes.ts";
import { useChaos } from "./useChaos.ts";

type Props = { text: string; seed: string; className?: string; extraDrips?: number };

// Speckles per square pixel of the title box, drips per title, where drips start (share of the height)
const SPECKLE_DENSITY = 1 / 250;
const DRIPS = 9;
const DRIP_START = 0.72;
// Drip lengths are made for a title this high (pixels); smaller titles get shorter drips, so they stay off the text below
const DRIP_HEIGHT = 160;
// fixed: titleDripMs is the time a drip takes for this many pixels
const DRIP_RUN_PX = 100;

// How far above the lowest ink of the letters a drip may still hang (share of the title height)
const DRIP_REACH = 0.12;

// The lowest painted pixel of the title per pixel column of its box (null where no letter is): the text drawn with its
// computed font on a canvas at the place of its line. Null for a title over more than one line (the drips then keep
// their places under the text) and while nothing is laid out.
function inkBottoms(element: HTMLElement): (number | null)[] | null {
  const range = document.createRange();
  range.selectNodeContents(element);
  const lines = range.getClientRects();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (lines.length !== 1 || width === 0 || height === 0) return null;
  // Client rects are scaled with the stage, the canvas works in the pixels of the element
  const own = element.getBoundingClientRect();
  const zoom = own.width / width;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const style = getComputedStyle(element);
  context.font = style.font;
  context.letterSpacing = style.letterSpacing;
  const label = (element.textContent ?? "").toUpperCase();
  // The rect of the text runs from the ascent of the font above the baseline
  const top = (lines[0].top - own.top) / zoom;
  context.fillText(label, (lines[0].left - own.left) / zoom, top + context.measureText(label).fontBoundingBoxAscent);
  const pixels = context.getImageData(0, 0, width, height).data;
  return Array.from({ length: width }, (_, column) => {
    for (let row = height - 1; row >= 0; row--) if (pixels[(row * width + column) * 4 + 3] > INK_ALPHA) return row;
    return null;
  });
}
// fixed: a canvas pixel counts as ink from this alpha on (of 255)
const INK_ALPHA = 128;

// Where the spray of the title reaches a place (share of its width), as a share of the spray time for theme.css: on the
// painted screens speckles show and drips start running only once the sprayed letters get there
const sprayed = (share: number) => ({ "--spray-at": sprayPassAt(share) }) as CSSProperties;

export default function SprayTitle({ text, seed, className = "", extraDrips = 0 }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const title = useRef<HTMLHeadingElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [ink, setInk] = useState<(number | null)[] | null>(null);
  useLayoutEffect(() => {
    const element = title.current;
    if (!element) return undefined;
    const measure = () => {
      setBox({ width: element.offsetWidth, height: element.offsetHeight });
      setInk(inkBottoms(element));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [text]);
  const base = seedOf(`${seed}:${text}`);
  const dots = useMemo(() => speckles(base, box.width, box.height, Math.round(box.width * box.height * SPECKLE_DENSITY)), [base, box]);
  const drips = useMemo(() => titleDrips(base, DRIPS + extraDrips), [base, extraDrips]);

  return (
    <div className={`ch-title-wrap ${className}`}>
      <svg className="ch-defs" aria-hidden="true">
        <filter id={`${id}-spray`} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={5} result="grit" />
          <feDisplacementMap in="SourceGraphic" in2="grit" scale={8 * values.jitter} />
        </filter>
      </svg>
      <svg className="ch-title-spray" width={box.width} height={box.height} aria-hidden="true">
        {dots.map((dot, index) => <circle key={index} className={dot.hot ? "ch-speckle-hot" : "ch-speckle"} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} style={sprayed(dot.x / box.width)} />)}
        {values.drips && box.width > 0 && drips.map(drip => {
          const scale = Math.min(1, box.height / DRIP_HEIGHT);
          const length = drip.length * scale ** 2;
          const thickness = drip.thickness * scale;
          // Hanging from the letters once their ink is measured, else at the old place under the text
          const anchor = ink ? dripAnchor(drip.at, thickness, ink, box.height * DRIP_REACH) : { x: drip.at * box.width, y: box.height * DRIP_START };
          if (!anchor) return null;
          return <path key={drip.at} className="ch-title-drip" d={dripPath(anchor.x, anchor.y, length, thickness)} style={{ ...sprayed(anchor.x / box.width), "--run": `${(values.titleDripMs * length) / DRIP_RUN_PX}ms` } as CSSProperties} />;
        })}
      </svg>
      <h1 ref={title} className="ch-title" data-text={text} style={{ filter: `url(#${id}-spray)` }}>{text}</h1>
    </div>
  );
}
