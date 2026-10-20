// A scribble monster of the Chaos theme (monsters.ts) as shaky lines in the color of the chatter (--minime): body, horns
// or antenna, arms, legs, eyes and the zigzag mouth, while grinning the wide grin. The lines tremble a little like the
// scribbles on the wall (jitter of the settings). Look in minimes.css.
import { useId, useMemo } from "react";
import { seedOf } from "../../core/hash.ts";
import { monsterOf } from "./monsters.ts";

// Box of a figure in monsters.ts: x from -0.6 to 0.6, y from -0.75 to the ground at 0.5
const VIEW_BOX = "-0.6 -0.75 1.2 1.25";

export default function Monster({ login, grin, jitter }: { login: string; grin: boolean; jitter: number }) {
  const monster = useMemo(() => monsterOf(login), [login]);
  const id = useId();
  return (
    <svg className="ch-monster" viewBox={VIEW_BOX}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={9} numOctaves={2} seed={Math.abs(seedOf(login)) % 1000} result="wave" />
          <feDisplacementMap in="SourceGraphic" in2="wave" scale={0.04 * jitter} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <path className="ch-monster-body" d={monster.body} />
        {monster.extras.map(path => <path key={path} d={path} />)}
        {monster.arms.map(path => <path key={path} className="ch-monster-arm" d={path} />)}
        {monster.legs.map(path => <path key={path} d={path} />)}
        {monster.eyes.map(path => <path key={path} d={path} />)}
        {monster.pupils.map(path => <path key={path} className="ch-monster-pupil" d={path} />)}
        <path className="ch-monster-mouth" d={grin ? monster.grin : monster.mouth} />
      </g>
    </svg>
  );
}
