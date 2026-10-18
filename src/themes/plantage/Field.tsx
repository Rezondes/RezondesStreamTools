// Plantation backdrop of the full-screen scenes as one layered SVG illustration (1920 x 1080, scaled with the stage):
// sky gradient per time of day, sun or moon with glow and slow rays, two-tone clouds drifting by, hills in haze, up to
// three rows of mango trees in depth (crowns of leaf bunches in shade, mid tone and light, ripe mangos with a gloss),
// furrowed soil in perspective, crates with wood grain and mango piles, grass in front and a flock of birds. Far
// layers fade into the sky (atmospheric depth). Every layer can be switched off in the settings, colors come from the
// settings via CSS classes.
import type { CSSProperties } from "react";
import { hash } from "../../core/hash.ts";
import { blobs, furrows, hillPath } from "./field.ts";
import { usePlantage } from "./usePlantage.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// fixed: stage, horizon, the position of sun or moon per time of day, the tree rows from far to near
const STAGE = { width: 1920, height: 1080, horizon: 610 };
const SUN: Record<TimeOfDay, { x: number; y: number }> = {
  morgen: { x: 360, y: 430 }, mittag: { x: 1380, y: 170 }, abend: { x: 1560, y: 450 }, nacht: { x: 1480, y: 160 },
};
const DEPTHS = [
  { name: "far", base: 640, scale: 0.5, spread: 1, extra: 3 },
  { name: "mid", base: 820, scale: 0.98, spread: 1, extra: 0 },
  { name: "near", base: 1110, scale: 1.25, spread: 0.24, extra: -2 },
];
// treeRows 1: mid, 2: far and mid, 3: all three
const ROWS: Record<number, readonly number[]> = { 1: [1], 2: [0, 1], 3: [0, 1, 2] };
const RAYS = 12;
const CRATES = [{ x: 150, y: 985, scale: 1.05, name: true }, { x: 330, y: 1010, scale: 0.9, name: false }, { x: 1700, y: 995, scale: 1, name: false }];
const TUFTS = [40, 260, 480, 1300, 1520, 1840];

export default function Field({ time }: { time: TimeOfDay }) {
  const values = usePlantage();
  const sun = SUN[time];
  const rows = ROWS[values.treeRows] ?? ROWS[2];
  return (
    <div className={`pl-field time-${time}`} aria-hidden="true">
      <svg className="pl-scene" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="xMidYMid slice">
        <Gradients />
        <rect className="pl-sky" width={STAGE.width} height={STAGE.height} fill="url(#pl-sky)" />
        <Sun x={sun.x} y={sun.y} />
        {values.clouds && Array.from({ length: values.cloudCount }, (_, index) => <Cloud key={index} index={index} />)}

        {values.hills && (
          <>
            <path className="pl-hill-far" d={hillPath(STAGE.width, 34, 960, 500, STAGE.height)} />
            <path className="pl-hill-near" d={hillPath(STAGE.width, 22, 700, 560, STAGE.height)} />
          </>
        )}
        <rect y={STAGE.horizon - 260} width={STAGE.width} height="300" fill="url(#pl-haze)" />

        {rows.includes(0) && <TreeRow depth={0} />}
        <path className="pl-ground" d={`M0 ${STAGE.horizon + 20} C640 ${STAGE.horizon} 1280 ${STAGE.horizon} 1920 ${STAGE.horizon + 24} L1920 1080 L0 1080 Z`} fill="url(#pl-ground)" />
        <path className="pl-grass-edge" d={`M0 ${STAGE.horizon + 20} C640 ${STAGE.horizon} 1280 ${STAGE.horizon} 1920 ${STAGE.horizon + 24} L1920 ${STAGE.horizon + 44} C1280 ${STAGE.horizon + 22} 640 ${STAGE.horizon + 22} 0 ${STAGE.horizon + 40} Z`} />
        <path className="pl-furrows" d={furrows(STAGE.width, STAGE.horizon + 30, STAGE.height, 18, STAGE.width / 2)} />
        {rows.includes(1) && <TreeRow depth={1} />}
        {rows.includes(2) && <TreeRow depth={2} />}

        {values.crates && CRATES.map((crate, index) => (
          <Crate key={index} x={crate.x} y={crate.y} scale={crate.scale} name={crate.name && values.crateName ? values.channelName : ""} seed={index} />
        ))}
        {TUFTS.map((x, index) => (
          <path key={x} className="pl-tuft" d={`M${x} 1080 q-14 -50 -34 -70 q24 18 34 44 q4 -40 -6 -76 q20 34 18 76 q10 -30 30 -48 q-14 30 -18 74 Z`} transform={`scale(${1 + hash(index + 40) * 0.5})`} style={{ transformOrigin: `${x}px 1080px` }} />
        ))}

        {values.birds && (
          <g className="pl-birds">
            {[0, 1, 2].map(index => <path key={index} d="M0 0 q12 -12 24 0 q12 -12 24 0" transform={`translate(${index * 60} ${index % 2 ? 18 : 0})`} />)}
          </g>
        )}
        <rect className="pl-night" width={STAGE.width} height={STAGE.height} />
        <rect width={STAGE.width} height={STAGE.height} fill="url(#pl-vignette)" />
      </svg>
    </div>
  );
}

// The gradients of the illustration; their colors come from CSS classes (settings), ids are unique on the page
function Gradients() {
  return (
    <defs>
      <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
        <stop className="pl-stop-sky-top" offset="0" />
        <stop className="pl-stop-sky-bottom" offset="0.62" />
      </linearGradient>
      <radialGradient id="pl-glow">
        <stop className="pl-stop-light" offset="0" stopOpacity="0.9" />
        <stop className="pl-stop-light" offset="1" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pl-haze" x1="0" y1="0" x2="0" y2="1">
        <stop className="pl-stop-sky-bottom" offset="0" stopOpacity="0" />
        <stop className="pl-stop-sky-bottom" offset="1" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="pl-ground" x1="0" y1="0" x2="0" y2="1">
        <stop className="pl-stop-soil" offset="0" />
        <stop className="pl-stop-soil-dark" offset="1" />
      </linearGradient>
      <radialGradient id="pl-mango" cx="0.35" cy="0.3" r="0.8">
        <stop className="pl-stop-gloss" offset="0" />
        <stop className="pl-stop-mango" offset="0.35" />
        <stop className="pl-stop-blush" offset="1" />
      </radialGradient>
      <radialGradient id="pl-vignette" cx="0.5" cy="0.45" r="0.75">
        <stop className="pl-stop-soil-dark" offset="0.6" stopOpacity="0" />
        <stop className="pl-stop-soil-dark" offset="1" stopOpacity="0.45" />
      </radialGradient>
    </defs>
  );
}

// Sun (or moon at night) with a soft glow and slowly turning rays, their strength from sunGlow
function Sun({ x, y }: { x: number; y: number }) {
  return (
    <g className="pl-sun" transform={`translate(${x} ${y})`}>
      <g className="pl-rays">
        {Array.from({ length: RAYS }, (_, index) => (
          <path key={index} d="M0 0 L1400 -60 L1400 60 Z" transform={`rotate(${(index * 360) / RAYS})`} />
        ))}
      </g>
      <circle className="pl-sun-glow" r="260" fill="url(#pl-glow)" />
      <circle className="pl-sun-disc" r="64" />
    </g>
  );
}

// A two-tone cloud drifting across the sky; height, size and start from hash, so every cloud is different
function Cloud({ index }: { index: number }) {
  const puffs = blobs(index + 11, 7, 0, 0, 150, 52);
  const style = { "--i": index, "--y": hash(index * 7 + 1), "--size": 0.6 + hash(index * 7 + 2) * 0.7 } as CSSProperties;
  return (
    <g className="pl-cloud" style={style}>
      <g className="pl-cloud-body">
        {puffs.map((puff, part) => <circle key={`shade-${part}`} className="pl-cloud-shade" cx={puff.x + 6} cy={puff.y + 10} r={puff.radius} />)}
        {puffs.map((puff, part) => <circle key={part} className="pl-cloud-puff" cx={puff.x} cy={puff.y} r={puff.radius} />)}
        <ellipse className="pl-cloud-shade" cx="0" cy="34" rx="150" ry="14" />
      </g>
    </g>
  );
}

// One row of mango trees at a depth: far rows small, many and hazy; the near row only at the edges, framing the picture
function TreeRow({ depth }: { depth: number }) {
  const values = usePlantage();
  const row = DEPTHS[depth];
  const count = Math.max(1, values.treesPerRow + row.extra);
  const xs = Array.from({ length: count }, (_, index) => {
    const share = (index + 0.5) / count;
    const spot = row.spread < 1 ? (share < 0.5 ? share * row.spread * 2 : 1 - (1 - share) * row.spread * 2) : share;
    return spot * STAGE.width + (hash(depth * 101 + index) - 0.5) * 80;
  });
  return (
    <g className={`pl-treerow pl-treerow-${row.name}`}>
      {xs.map((x, index) => (
        <Tree key={index} x={x} y={row.base + hash(depth * 53 + index) * 14} scale={row.scale * values.treeSize * (0.88 + hash(depth * 7 + index) * 0.24)} seed={depth * 97 + index} />
      ))}
    </g>
  );
}

// A mango tree with its trunk base at (x, y): curved trunk with two branches, a crown of leaf bunches in three tones (light
// from the upper left), and ripe mangos hanging under the crown
function Tree({ x, y, scale, seed }: { x: number; y: number; scale: number; seed: number }) {
  const values = usePlantage();
  const shade = blobs(seed, 10, 4, -178, 118, 84);
  const mid = blobs(seed + 1, 10, 0, -186, 108, 78);
  const light = blobs(seed + 2, 6, -26, -206, 70, 46);
  const fruits = blobs(seed + 3, 6, 4, -150, 92, 34);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
      <ellipse className="pl-tree-shadow" cx="10" cy="0" rx="110" ry="16" />
      <g className="pl-tree" style={{ "--i": seed } as CSSProperties}>
        <path className="pl-trunk" d="M-14 0 C-10 -40 -18 -92 -9 -132 L9 -132 C16 -92 10 -40 16 0 Z M-6 -104 C-30 -124 -54 -136 -72 -146 L-64 -156 C-46 -144 -26 -134 -1 -120 Z M6 -116 C30 -134 50 -146 70 -154 L64 -164 C46 -152 26 -142 2 -128 Z" />
        <path className="pl-bark" d="M-4 -10 C-2 -40 -8 -80 -2 -120 M6 -30 C8 -60 4 -90 6 -110" />
        {shade.map((blob, index) => <circle key={`s${index}`} className="pl-crown-shade" cx={blob.x} cy={blob.y} r={blob.radius} />)}
        {mid.map((blob, index) => <circle key={`m${index}`} className="pl-crown-mid" cx={blob.x} cy={blob.y} r={blob.radius} />)}
        {light.map((blob, index) => <circle key={`l${index}`} className="pl-crown-light" cx={blob.x} cy={blob.y} r={blob.radius} />)}
        {values.mangosOnTrees && fruits.map((fruit, index) => (
          <g key={`f${index}`} transform={`translate(${fruit.x} ${fruit.y + 14}) rotate(${(hash(seed + index) - 0.5) * 40})`}>
            <path className="pl-stem" d="M0 -16 L0 -10" />
            <ellipse className="pl-fruit" rx="10" ry="13" fill="url(#pl-mango)" />
            <ellipse className="pl-gloss" cx="-3" cy="-5" rx="2.5" ry="4" />
          </g>
        ))}
      </g>
    </g>
  );
}

// A crate in front with wood grain and a pile of mangos; the first one carries the channel name
function Crate({ x, y, scale, name, seed }: { x: number; y: number; scale: number; name: string; seed: number }) {
  const pile = blobs(seed + 70, 7, 0, -112, 78, 18);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse className="pl-tree-shadow" cx="8" cy="4" rx="112" ry="14" />
      {pile.map((fruit, index) => (
        <ellipse key={index} className="pl-fruit" cx={fruit.x} cy={fruit.y} rx="16" ry="13" fill="url(#pl-mango)" />
      ))}
      <rect className="pl-crate-body" x="-100" y="-104" width="200" height="104" rx="6" />
      <path className="pl-crate-slats" d="M-100 -70 L100 -70 M-100 -36 L100 -36 M-92 -104 L-92 0 M92 -104 L92 0" />
      <path className="pl-crate-grain" d="M-80 -88 q30 -4 60 0 t60 0 M-70 -54 q40 6 80 0 t50 2 M-84 -18 q36 -5 70 0 t74 -2" />
      {name && <text className="pl-crate-name" x="0" y="-46" textAnchor="middle">{name}</text>}
    </g>
  );
}
