// Energy swathes of the Chaos theme striking in from one side of the stage (alerts, stinger): flame tongues and jagged
// streaks with glow, light near the edge, saturated further in. Shapes from swathes.ts, colors from theme.css.
import { useId, useMemo } from "react";
import { STAGE } from "../../core/screens/screens.ts";
import { swathes, type SwathSide } from "./swathes.ts";
import { useChaos } from "./useChaos.ts";

type Props = { side: SwathSide; seed: number; className?: string };

export default function EnergySwathes({ side, seed, className = "" }: Props) {
  const values = useChaos();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const swath = useMemo(() => swathes(side, seed, values.swathDensity), [side, seed, values.swathDensity]);
  return (
    <svg className={`ch-swathes ch-swathes-${side} ${className}`} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={18 * values.glow} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-tear`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.12" numOctaves={3} seed={seed % 97} result="streak" />
          <feDisplacementMap in="SourceGraphic" in2="streak" scale={60 * values.jitter} />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <g filter={`url(#${id}-tear)`}>
          {swath.tongues.map((tongue, index) => <path key={index} className={`ch-swath-${tongue.tone}`} d={tongue.d} opacity={tongue.opacity} />)}
        </g>
        {swath.streaks.map((streak, index) => <path key={index} className={`ch-streak ch-streak-${streak.tone}`} d={streak.d} strokeWidth={streak.width} opacity={streak.opacity} />)}
      </g>
    </svg>
  );
}
