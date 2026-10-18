// Battlefield backdrop of the full-screen scenes (1920 x 1080, scaled with the stage): sky per time of day, sun or moon,
// mountain ridge, columns of smoke on the horizon, the hill in the middle with radio mast and flag, sandbags and
// camouflage nets on the slopes, dust in the air and the channel name on a sign. Every layer can be switched off.
import type { CSSProperties } from "react";
import { hash } from "../../core/hash.ts";
import { FLAG, HILL, NET, ridgePath, SANDBAGS, SMOKE, TOWER } from "./hill.ts";
import ShapeIcon from "./ShapeIcon.tsx";
import { useKoth } from "./useKoth.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// fixed: stage size, the peaks of the mountain ridge, spots of smoke, sandbags and nets (percent of the width)
const STAGE = { width: 1920, height: 1080 };
const PEAKS = [[0.06, 0.3], [0.14, 0.55], [0.22, 0.38], [0.33, 0.62], [0.45, 0.4], [0.58, 0.7], [0.7, 0.45], [0.8, 0.6], [0.92, 0.35]] as const;
const SMOKES = [12, 78, 88];
const SANDBAG_SPOTS = [{ x: 30, y: 26 }, { x: 62, y: 28 }, { x: 44, y: 46 }];
const NET_SPOTS = [{ x: 14, y: 12 }, { x: 74, y: 10 }];

export default function Hill({ time }: { time: TimeOfDay }) {
  const values = useKoth();
  return (
    <div className={`kh-field time-${time}`} aria-hidden="true">
      <div className="kh-sky" />
      <div className="kh-sun" />
      {values.mountains && (
        <svg className="kh-mountains" viewBox={`0 0 ${STAGE.width} 400`} preserveAspectRatio="none">
          <path d={ridgePath(STAGE.width, 400, PEAKS)} />
        </svg>
      )}
      {values.smoke && SMOKES.map((x, index) => (
        <div key={x} className="kh-smoke" style={{ "--x": x, "--i": index } as CSSProperties}><ShapeIcon shape={SMOKE} /></div>
      ))}
      <div className="kh-hill">
        <ShapeIcon shape={HILL} />
        {values.tower && <div className="kh-tower"><ShapeIcon shape={TOWER} /><span className="kh-blink" /></div>}
        <div className="kh-flag"><ShapeIcon shape={FLAG} /></div>
        {values.nets && NET_SPOTS.map((spot, index) => (
          <div key={index} className="kh-net" style={{ "--x": spot.x, "--y": spot.y } as CSSProperties}><ShapeIcon shape={NET} /></div>
        ))}
        {values.sandbags && SANDBAG_SPOTS.map((spot, index) => (
          <div key={index} className="kh-sandbags" style={{ "--x": spot.x, "--y": spot.y } as CSSProperties}><ShapeIcon shape={SANDBAGS} /></div>
        ))}
        {values.hillName && <span className="kh-hill-name">{values.channelName}</span>}
      </div>
      {values.dust && Array.from({ length: values.dustCount }, (_, index) => (
        <i key={index} className="kh-dust" style={{ "--x": hash(index * 5 + 1), "--y": hash(index * 5 + 2), "--i": index } as CSSProperties} />
      ))}
    </div>
  );
}
