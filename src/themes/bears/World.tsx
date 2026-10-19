// Backdrop of the Bärenbande theme as one SVG in watercolor: sky per time of day with sun or moon, drifting clouds, far
// hills, city and suspension bridge in aerial perspective (mixed with the sky), the forest edge with a cave in a hill on
// the left, broad-leaved trees, the meadow with a path, tufts and flowers. No black outline in the world: thin sketch
// lines in a darker tone of each surface, soft edges from a displacement filter and a paper grain over everything
// (strengths from the settings). Shapes from world.ts, colors from the settings (theme.css).
import { useId, type CSSProperties } from "react";
import { useBears } from "./useBears.ts";
import {
  blocksPath, CITY, CITY_BASE, FIR_BASE, FIRS, firPath, firShadePath, FLOWERS, flowerPath, SHAPES, TREES, TUFTS, tuftPath, windowsPath, WORLD,
} from "./world.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// Where sun or moon stand per time of day
const LIGHT: Record<TimeOfDay, readonly [number, number]> = { morgen: [360, 300], mittag: [980, 150], abend: [1500, 420], nacht: [1320, 180] };
// fixed: shapes built once (pure functions of the layout in world.ts)
const FIR_SHAPES = FIRS.map(([x, height, width]) => ({ body: firPath(x, FIR_BASE, height, width), shade: firShadePath(x, FIR_BASE, height, width) }));
const CITY_SHAPE = { blocks: blocksPath(CITY, CITY_BASE), windows: windowsPath(CITY, CITY_BASE) };
const TUFT_SHAPE = TUFTS.map(([x, y, size]) => tuftPath(x, y, size)).join(" ");
const FLOWER_SHAPE = FLOWERS.map(([x, y, size]) => flowerPath(x, y, size)).join(" ");
const MAX_CLOUDS = 8;

export default function World({ time }: { time: TimeOfDay }) {
  const values = useBears();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  return (
    <div className={`bb-world time-${time}`} aria-hidden="true">
      <svg className="bb-world-svg" viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop className="bb-stop-sky-top" offset="0" />
            <stop className="bb-stop-sky-bottom" offset="0.7" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop className="bb-stop-light" offset="0" stopOpacity="0.6" />
            <stop className="bb-stop-light" offset="1" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-wash`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={values.paperGrain * 14} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="3" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <Sky id={id} time={time} clouds={Math.min(values.cloudCount, MAX_CLOUDS)} />
        <g filter={`url(#${id}-wash)`}>
          <Far city={values.showCity} bridge={values.showBridge} />
          <Land cave={values.showCave} flowers={values.flowers} />
        </g>
        <rect className="bb-dusk" width={WORLD.width} height={WORLD.height} />
        <rect className="bb-grain" width={WORLD.width} height={WORLD.height} filter={`url(#${id}-grain)`} />
      </svg>
    </div>
  );
}

// Sky gradient, sun or moon with its glow, drifting clouds
function Sky({ id, time, clouds }: { id: string; time: TimeOfDay; clouds: number }) {
  const [lightX, lightY] = LIGHT[time];
  return (
    <>
      <rect className="bb-sky" width={WORLD.width} height={WORLD.height} fill={`url(#${id}-sky)`} />
      <g className="bb-light" transform={`translate(${lightX} ${lightY})`}>
        <circle r="220" fill={`url(#${id}-glow)`} />
        <path className={time === "nacht" ? "bb-moon" : "bb-sun"} d={time === "nacht" ? SHAPES.moon : SHAPES.sun} />
      </g>
      <g className="bb-clouds">
        {Array.from({ length: clouds }, (_, index) => (
          <g key={index} className="bb-cloud" style={{ "--i": index, "--n": clouds } as CSSProperties}>
            <path d={SHAPES.cloud} transform={`translate(0 ${60 + ((index * 83) % 240)}) scale(${1.4 + (index % 3) * 0.5})`} />
          </g>
        ))}
      </g>
    </>
  );
}

// Far hills, city, water and bridge (mixed with the sky in theme.css)
function Far({ city, bridge }: { city: boolean; bridge: boolean }) {
  return (
    <>
      <path className="bb-hills" d={SHAPES.hills} />
      {city && (
        <g className="bb-city">
          <path className="bb-city-blocks" d={CITY_SHAPE.blocks} />
          <path className="bb-city-windows" d={CITY_SHAPE.windows} />
        </g>
      )}
      <path className="bb-water" d={SHAPES.water} />
      {bridge && (
        <g className="bb-bridge">
          <path className="bb-bridge-cables" d={SHAPES.bridgeCables} />
          <path className="bb-bridge-solid" d={SHAPES.bridgeTowers} />
          <path className="bb-bridge-solid" d={SHAPES.bridgeDeck} />
        </g>
      )}
    </>
  );
}

// Meadow with path, broad-leaved trees, the cave hill, the row of firs, tufts and flowers
function Land({ cave, flowers }: { cave: boolean; flowers: boolean }) {
  return (
    <>
      <path className="bb-meadow" d={SHAPES.meadow} />
      <path className="bb-meadow-patch" d={SHAPES.meadowPatches} />
      <path className="bb-road" d={SHAPES.path} />
      {TREES.map(([x, base, scale]) => (
        <g key={x} className="bb-tree" transform={`translate(${x} ${base}) scale(${scale})`}>
          <path className="bb-trunk" d={SHAPES.trunk} />
          <path className="bb-crown" d={SHAPES.crown} />
          <path className="bb-crown-shade" d={SHAPES.crownShade} />
        </g>
      ))}
      {cave && (
        <g className="bb-cave">
          <path className="bb-mound" d={SHAPES.mound} />
          <path className="bb-cave-mouth" d={SHAPES.cave} />
          <path className="bb-cave-rim" d={SHAPES.caveRim} />
        </g>
      )}
      {FIR_SHAPES.map(fir => (
        <g key={fir.body} className="bb-fir">
          <path className="bb-fir-body" d={fir.body} />
          <path className="bb-fir-shade" d={fir.shade} />
        </g>
      ))}
      {flowers && <path className="bb-tufts" d={TUFT_SHAPE} />}
      {flowers && <path className="bb-flowers" d={FLOWER_SHAPE} />}
    </>
  );
}
