// The wall of the Chaos theme behind a full-screen scene: violet-black ground with blotches, the scribbles (chalk and
// marker lines, glowing neon ones on their own layer so their flicker costs no repaint), the brush strokes of the scene's
// composition with bristles, splatter and drips, a dark haze behind the content, then grain and spray dust over all.
// Every layer is its own SVG on the 1920x1080 stage (cut to fill the source); colors and strengths come from the
// settings as CSS variables (theme.css). The seed (scene name) makes each scene's chaos its own and the same each time.
import { useId, useMemo, type CSSProperties } from "react";
import { seedOf } from "../../core/hash.ts";
import { STAGE } from "../../core/screens/screens.ts";
import { chance } from "./chance.ts";
import { layoutScribbles, type Scribble } from "./scribbles.ts";
import { brushStroke, gestureLayout, type GestureKind } from "./strokes.ts";
import { useChaos } from "./useChaos.ts";
import { blotches, dust } from "./wall.ts";

type Props = { seed: string; gesture: GestureKind; mainColor: string };

const VIEW_BOX = `0 0 ${STAGE.width} ${STAGE.height}`;
// The content in the middle stays free of scribbles (shares of the stage)
const FREE = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const BLOTCHES = 6;
const DUST = 2600;
// Seeds of the layers below the scene's own seed
const LAYER = { scribbles: 1, gestures: 2, blotches: 3, dust: 4 };

export default function Backdrop({ seed, gesture, mainColor }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const base = seedOf(seed);
  const marks = useMemo(() => layoutScribbles(base + LAYER.scribbles, values.scribbleCount, FREE, values.scribbleWhite), [base, values.scribbleCount, values.scribbleWhite]);
  const strokes = useMemo(() => {
    const random = chance(base + LAYER.gestures);
    return gestureLayout(gesture, base + LAYER.gestures).map(part => ({ ...part, brush: brushStroke(part.from, part.to, part.width, random) }));
  }, [base, gesture]);
  const stains = useMemo(() => blotches(base + LAYER.blotches, BLOTCHES), [base]);
  const dots = useMemo(() => dust(base + LAYER.dust, DUST), [base]);
  const url = (name: string) => `url(#${id}-${name})`;
  let order = 0;
  const marksOf = (line: Scribble["line"]) => marks.filter(mark => mark.line === line).map(mark => <Mark key={order} mark={mark} index={order++} />);

  return (
    <div className="ch-backdrop" aria-hidden="true">
      <svg className="ch-layer ch-defs" viewBox={VIEW_BOX}>
        <Filters id={id} />
      </svg>
      <svg className="ch-layer ch-wall" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`${id}-light`} cx="50%" cy="48%" r="70%">
            <stop className="ch-stop-wall" offset="0" />
            <stop className="ch-stop-mid" offset="0.6" />
            <stop className="ch-stop-ground" offset="1" />
          </radialGradient>
        </defs>
        <rect width={STAGE.width} height={STAGE.height} fill={url("light")} />
        <rect className="ch-mottle" width={STAGE.width} height={STAGE.height} filter={url("mottle")} />
        <g filter={url("blotch")}>
          {stains.map(stain => <ellipse key={`${stain.x}`} className={stain.deep ? "ch-blotch-deep" : "ch-blotch"} cx={stain.x} cy={stain.y} rx={stain.radiusX} ry={stain.radiusY} opacity={stain.opacity} />)}
        </g>
      </svg>
      <svg className="ch-layer ch-scribbles" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        <g filter={url("chalk")}>{marksOf("chalk")}</g>
        <g filter={url("marker")}>{marksOf("marker")}</g>
      </svg>
      <svg className="ch-layer ch-scribbles ch-neon" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        <g filter={url("neon")}>{marksOf("neon")}</g>
      </svg>
      <svg className="ch-layer ch-gestures" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        {strokes.map(({ brush, color }, index) => (
          <g key={index} className={`ch-gesture ch-ink-${color === "main" ? mainColor : color}`} filter={url("glow")}>
            <path className="ch-brush-body" d={brush.body} filter={url("edge")} />
            {brush.bristles.map((bristle, line) => <path key={line} className={bristle.light ? "ch-bristle-light" : "ch-bristle-dark"} d={bristle.d} strokeWidth={bristle.width} opacity={bristle.opacity} />)}
            {brush.tail.map((bristle, line) => <path key={`tail${line}`} className="ch-brush-tail" d={bristle.d} strokeWidth={bristle.width} opacity={bristle.opacity} />)}
            {brush.drops.map((drop, dot) => <ellipse key={dot} className="ch-brush-drop" cx={drop.x} cy={drop.y} rx={drop.radiusX} ry={drop.radiusY} opacity={drop.opacity} />)}
            {values.drips && brush.drips.map(drip => <path key={drip} className="ch-brush-drop" d={drip} />)}
          </g>
        ))}
        <ellipse className="ch-haze" cx={STAGE.width / 2} cy={STAGE.height * 0.56} rx={STAGE.width * 0.32} ry={STAGE.height * 0.23} filter={url("haze")} />
      </svg>
      <svg className="ch-layer ch-grain" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        <rect width={STAGE.width} height={STAGE.height} filter={url("grain")} />
        {dots.map((dot, index) => <circle key={index} className={`ch-dust-${dot.color}`} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} />)}
      </svg>
    </div>
  );
}

// One scribble: its lines scaled from the unit box, stroke width relative to its size, index for the drawing delay
function Mark({ mark, index }: { mark: Scribble; index: number }) {
  return (
    <g className={`ch-mark ch-mark-${mark.color}`} transform={`translate(${mark.x} ${mark.y}) rotate(${mark.rotate}) scale(${mark.size})`} style={{ "--w": mark.width / mark.size, "--i": index } as CSSProperties}>
      {mark.paths.map(path => <path key={path} d={path} pathLength={1} />)}
    </g>
  );
}

// The filters of the wall; their strengths follow the settings (jitter, glow), the colors come from theme.css
function Filters({ id }: { id: string }) {
  const values = useChaos();
  const jitter = values.jitter;
  const glow = values.glow;
  return (
    <defs>
      <filter id={`${id}-mottle`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={4} seed={3} result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.75" result="mask" />
        <feFlood className="ch-flood-violet" />
        <feComposite in2="mask" operator="in" />
      </filter>
      <filter id={`${id}-blotch`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={55} /></filter>
      <filter id={`${id}-chalk`} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={1} seed={1} result="grit" />
        <feColorMatrix in="grit" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.55" result="mask" />
        <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves={2} seed={2} result="wave" />
        <feDisplacementMap in="SourceGraphic" in2="wave" scale={6 * jitter} result="shaky" />
        <feComposite in="shaky" in2="mask" operator="in" />
      </filter>
      <filter id={`${id}-marker`} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves={2} seed={4} result="wave" />
        <feDisplacementMap in="SourceGraphic" in2="wave" scale={8 * jitter} />
      </filter>
      <filter id={`${id}-neon`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={12 * glow} result="wide" />
        <feGaussianBlur in="SourceGraphic" stdDeviation={2.7 * glow} result="near" />
        <feMerge><feMergeNode in="wide" /><feMergeNode in="wide" /><feMergeNode in="near" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id={`${id}-edge`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.25" numOctaves={3} seed={6} result="streak" />
        <feDisplacementMap in="SourceGraphic" in2="streak" scale={52 * jitter} />
      </filter>
      <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={15 * glow} result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id={`${id}-haze`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={70} /></filter>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 -0.42" />
      </filter>
    </defs>
  );
}
