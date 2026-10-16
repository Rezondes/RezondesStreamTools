// Strandkulisse der Vollbild-Szenen (1920 x 1080, skaliert mit der Bühne): Himmel je Tageszeit, Sonne oder Mond,
// ziehende Wolken, Segelboot, Meer mit bis zu drei Wellenschichten und Glitzern, Sand mit Muscheln, Palmen links und
// rechts, Möwen und der Kanal-Name im Sand. Jede Schicht ist in den Einstellungen abschaltbar.
import type { CSSProperties } from "react";
import { hash } from "../../core/hash.ts";
import { CLOUD, GULL, ICONS, PALM, wavePath } from "./beach.ts";
import ShapeIcon from "./ShapeIcon.tsx";
import { useSuedfrucht } from "./useSuedfrucht.ts";

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";

// fixed: Bühne, Wellen (doppelte Breite für nahtloses Verschieben), Höhen der Schichten und Glitzer-Anzahl
const STAGE = { width: 1920, height: 1080, waveWidth: 3840, wavelength: 480 };
const WAVES = [
  { name: "far", top: 650, amplitude: 8 },
  { name: "mid", top: 720, amplitude: 12 },
  { name: "near", top: 800, amplitude: 16 },
];
const SPARKLES = 18;
const SHELLS = [{ icon: ICONS.muschel, x: 18 }, { icon: ICONS.seestern, x: 63 }, { icon: ICONS.muschel, x: 82 }];

export default function Beach({ time }: { time: TimeOfDay }) {
  const values = useSuedfrucht();
  const waves = WAVES.slice(WAVES.length - values.waveLayers);
  const palms = [
    ...Array.from({ length: values.palmsLeft }, (_, index) => ({ side: "left", index })),
    ...Array.from({ length: values.palmsRight }, (_, index) => ({ side: "right", index })),
  ];
  return (
    <div className={`sf-beach time-${time}`} aria-hidden="true">
      <div className="sf-sky" />
      <div className="sf-sun" />
      {values.clouds && Array.from({ length: values.cloudCount }, (_, index) => (
        <div key={index} className="sf-cloud" style={{ "--i": index, "--y": hash(index * 7 + 1), "--size": hash(index * 7 + 2) } as CSSProperties}>
          <ShapeIcon shape={CLOUD} />
        </div>
      ))}
      {values.boat && <div className="sf-boat"><ShapeIcon shape={ICONS.boot} /></div>}
      <svg className="sf-sea" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="none">
        <rect className="sf-sea-deep" x="0" y={WAVES[0].top - WAVES[0].amplitude} width={STAGE.width} height={STAGE.height} />
        {waves.map(wave => (
          <path key={wave.name} className={`sf-wave sf-wave-${wave.name}`} d={wavePath(STAGE.waveWidth, wave.amplitude * values.waveHeight, STAGE.wavelength, wave.top, STAGE.height)} />
        ))}
        {values.sparkles && Array.from({ length: SPARKLES }, (_, index) => (
          <circle key={index} className="sf-sparkle" cx={hash(index * 13 + 5) * STAGE.width} cy={660 + hash(index * 13 + 6) * 200} r={2 + hash(index * 13 + 7) * 3} style={{ "--i": index } as CSSProperties} />
        ))}
      </svg>
      <div className="sf-sand">
        {values.shells && SHELLS.map((shell, index) => (
          <div key={index} className="sf-shell" style={{ "--x": shell.x, "--i": index } as CSSProperties}><ShapeIcon shape={shell.icon} /></div>
        ))}
        {values.sandName && <span className="sf-sand-name">{values.channelName}</span>}
      </div>
      {palms.map(palm => (
        <div key={`${palm.side}-${palm.index}`} className={`sf-palm sf-palm-${palm.side}`} style={{ "--i": palm.index } as CSSProperties}>
          <ShapeIcon shape={PALM} />
        </div>
      ))}
      {values.gulls && <div className="sf-gulls"><ShapeIcon shape={GULL} /><ShapeIcon shape={GULL} /></div>}
    </div>
  );
}
