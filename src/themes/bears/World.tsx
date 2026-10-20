// Backdrop of the Bärenbande theme in watercolor: sky per time of day with sun or moon, drifting clouds, far
// hills, the far shore with the city on it, the bay and the suspension bridge from the meadow to the far shore in aerial
// perspective (mixed with the sky), the cave hill and the forest edge on the left, broad-leaved trees, the meadow with a
// path, tufts and flowers; every thing stands on the ground line of its plane (world.ts SCENE). No black outline in the world: thin sketch
// lines in a darker tone of each surface, soft edges from a displacement filter and a paper grain over everything
// (strengths from the settings). Shapes from world.ts, colors from the settings (theme.css).
// Layers on one viewBox: the live sky with the drifting clouds, then the filtered land and the paper grain as pictures.
// Land and grain are baked once per look (Baked): without hardware acceleration the browser would otherwise rerun the
// full-screen turbulence filters while compositing every frame of the clouds.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useBears } from "./useBears.ts";
import { SCENE, SHAPES, WORLD } from "./world.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// Where sun or moon stand per time of day
const LIGHT: Record<TimeOfDay, readonly [number, number]> = { morgen: [360, 300], mittag: [980, 150], abend: [1500, 420], nacht: [1320, 180] };
const MAX_CLOUDS = 8;
const VIEW_BOX = `0 0 ${WORLD.width} ${WORLD.height}`;
// The paint the theme sets on the shapes of the world in theme.css, written into the baked picture
const PAINT = ["fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "opacity"];

export default function World({ time }: { time: TimeOfDay }) {
  const values = useBears();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const look = `${time} ${JSON.stringify(values)}`;
  return (
    <div className={`bb-world time-${time}`} aria-hidden="true">
      <svg className="bb-world-svg" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop className="bb-stop-sky-top" offset="0" />
            <stop className="bb-stop-sky-bottom" offset="0.7" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop className="bb-stop-light" offset="0" stopOpacity="0.6" />
            <stop className="bb-stop-light" offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Sky id={id} time={time} clouds={Math.min(values.cloudCount, MAX_CLOUDS)} />
      </svg>
      <Baked look={look}>
        <defs>
          <filter id={`${id}-wash`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={values.paperGrain * 14} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${id}-wash)`}>
          <Far city={values.showCity} bridge={values.showBridge} />
          <Land cave={values.showCave} flowers={values.flowers} />
        </g>
      </Baked>
      <div className="bb-dusk" />
      <Baked look={look} className="bb-grain">
        <defs>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="3" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={WORLD.width} height={WORLD.height} filter={`url(#${id}-grain)`} />
      </Baked>
    </div>
  );
}

// A still layer of the world: drawn as a hidden SVG with the theme's CSS, then shown as a picture of it with the computed
// paint written in, made again whenever the look changes
function Baked({ look, className = "", children }: { look: string; className?: string; children: ReactNode }) {
  const source = useRef<SVGSVGElement>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!source.current) return;
    const next = pictureOf(source.current);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [look]);
  return (
    <>
      <svg ref={source} className="bb-world-svg bb-bake-source" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">{children}</svg>
      {url && <img className={`bb-world-svg bb-baked ${className}`} src={url} alt="" />}
    </>
  );
}

// An object URL of the SVG as a standalone picture (sharp at the device pixel ratio)
function pictureOf(svg: SVGSVGElement): string {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const live = svg.querySelectorAll("*");
  copy.querySelectorAll("*").forEach((element, index) => {
    const style = getComputedStyle(live[index]);
    element.removeAttribute("class");
    element.setAttribute("style", PAINT.map(name => `${name}:${style.getPropertyValue(name)}`).join(";"));
  });
  const scale = Math.max(1, window.devicePixelRatio);
  copy.removeAttribute("class");
  copy.setAttribute("width", String(WORLD.width * scale));
  copy.setAttribute("height", String(WORLD.height * scale));
  return URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
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

// Far hills, the city on the far shore (the shore over the feet of its blocks), the water of the bay and the bridge
// (mixed with the sky in theme.css)
function Far({ city, bridge }: { city: boolean; bridge: boolean }) {
  return (
    <>
      <path className="bb-hills" d={SHAPES.hills} />
      {city && (
        <g className="bb-city">
          <path className="bb-city-blocks" d={SCENE.cityBlocks} />
          <path className="bb-city-windows" d={SCENE.cityWindows} />
        </g>
      )}
      <path className="bb-far-shore" d={SCENE.farShore} />
      <path className="bb-water" d={SCENE.water} />
      {bridge && (
        <g className="bb-bridge">
          <path className="bb-bridge-cables" d={SCENE.bridgeCables} />
          <path className="bb-bridge-solid" d={SCENE.bridgeSolid} />
        </g>
      )}
    </>
  );
}

// Meadow with path, broad-leaved trees, the cave hill, the row of firs, tufts and flowers
function Land({ cave, flowers }: { cave: boolean; flowers: boolean }) {
  return (
    <>
      <path className="bb-meadow" d={SCENE.meadow} />
      <path className="bb-meadow-patch" d={SHAPES.meadowPatches} />
      <path className="bb-road" d={SCENE.road} />
      {SCENE.trees.map(({ x, base, scale }) => (
        <g key={x} className="bb-tree" transform={`translate(${x} ${base}) scale(${scale})`}>
          <path className="bb-trunk" d={SHAPES.trunk} />
          <path className="bb-crown" d={SHAPES.crown} />
          <path className="bb-crown-shade" d={SHAPES.crownShade} />
        </g>
      ))}
      {cave && (
        <g className="bb-cave">
          <path className="bb-mound" d={SCENE.mound} />
          <path className="bb-cave-mouth" d={SCENE.cave} />
          <path className="bb-cave-rim" d={SCENE.caveRim} />
        </g>
      )}
      {SCENE.firs.map(fir => (
        <g key={fir.body} className="bb-fir">
          <path className="bb-fir-body" d={fir.body} />
          <path className="bb-fir-shade" d={fir.shade} />
        </g>
      ))}
      {flowers && <path className="bb-tufts" d={SCENE.tufts} />}
      {flowers && <path className="bb-flowers" d={SCENE.flowers} />}
    </>
  );
}
