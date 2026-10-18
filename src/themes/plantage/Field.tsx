// Plantation backdrop of the full-screen scenes (1920 x 1080, scaled with the stage): sky per time of day, sun or moon,
// drifting clouds, rolling hills, rows of swaying mango trees with hanging mangos on furrowed soil, crates at the field
// edge with the channel name and a flock of birds. Every layer can be switched off in the settings.
import type { CSSProperties } from "react";
import { hash } from "../../core/hash.ts";
import { BIRD, CLOUD, CRATE, hillPath, MANGO_TREE } from "./field.ts";
import ShapeIcon from "./ShapeIcon.tsx";
import { usePlantage } from "./usePlantage.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// fixed: stage width, the two hill layers (top edge, amplitude, wavelength), the spots of the mangos in a tree crown
const STAGE = { width: 1920, height: 1080 };
const HILLS = [
  { name: "far", top: 520, amplitude: 26, wavelength: 900 },
  { name: "near", top: 590, amplitude: 18, wavelength: 640 },
];
const TREE_MANGOS = [[70, 120], [150, 96], [110, 150], [180, 140], [56, 160], [130, 70]];
const CRATES = [{ x: 4, name: true }, { x: 13, name: false }, { x: 84, name: false }];

export default function Field({ time }: { time: TimeOfDay }) {
  const values = usePlantage();
  const rows = Array.from({ length: values.treeRows }, (_, row) => row);
  return (
    <div className={`pl-field time-${time}`} aria-hidden="true">
      <div className="pl-sky" />
      <div className="pl-sun" />
      {values.clouds && Array.from({ length: values.cloudCount }, (_, index) => (
        <div key={index} className="pl-cloud" style={{ "--i": index, "--y": hash(index * 7 + 1), "--size": hash(index * 7 + 2) } as CSSProperties}>
          <ShapeIcon shape={CLOUD} />
        </div>
      ))}
      {values.hills && (
        <svg className="pl-hills" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="none">
          {HILLS.map(hill => <path key={hill.name} className={`pl-hill pl-hill-${hill.name}`} d={hillPath(STAGE.width, hill.amplitude, hill.wavelength, hill.top, STAGE.height)} />)}
        </svg>
      )}
      <div className="pl-soil" />
      {rows.map(row => (
        <div key={row} className="pl-trees" style={{ "--row": row, "--rows": values.treeRows } as CSSProperties}>
          {Array.from({ length: values.treesPerRow }, (_, index) => (
            <div key={index} className="pl-tree" style={{ "--i": index + row * values.treesPerRow, "--lean": hash(row * 31 + index) } as CSSProperties}>
              <Tree mangos={values.mangosOnTrees} />
            </div>
          ))}
        </div>
      ))}
      {values.crates && CRATES.map((crate, index) => (
        <div key={index} className="pl-crate" style={{ "--x": crate.x, "--i": index } as CSSProperties}>
          <ShapeIcon shape={CRATE} />
          {crate.name && values.crateName && <span className="pl-crate-name">{values.channelName}</span>}
        </div>
      ))}
      {values.birds && <div className="pl-birds"><ShapeIcon shape={BIRD} /><ShapeIcon shape={BIRD} /><ShapeIcon shape={BIRD} /></div>}
    </div>
  );
}

// A mango tree: trunk, crown with leaf veins and optionally ripe mangos hanging in the crown
function Tree({ mangos }: { mangos: boolean }) {
  return (
    <svg className="pl-shape" viewBox={MANGO_TREE.viewBox}>
      {MANGO_TREE.parts.map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
      {mangos && TREE_MANGOS.map(([x, y], index) => (
        <g key={index} className="pl-tree-mango" transform={`translate(${x} ${y}) rotate(${index * 23 - 40})`}>
          <ellipse rx="11" ry="15" />
          <ellipse className="pl-tree-mango-blush" cx="4" cy="-4" rx="5" ry="7" />
        </g>
      ))}
    </svg>
  );
}
