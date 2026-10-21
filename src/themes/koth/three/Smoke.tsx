// Smoke columns at the foot of the KOTH hill: soft puffs per column placed from the clock (smokeAt in smoke.ts), faded in
// with the smoke step of the build.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type Sprite, SpriteMaterial } from "three";
import { softTexture } from "../../../core/three/softTexture.ts";
import { type KothClock, type Step, stepShare } from "../build.ts";
import { SMOKE_SPOTS, smokeAt } from "../smoke.ts";

type Props = { clock: KothClock; step: Step; columns: number; amount: number; color: string; seed: number; ground: (x: number, depth: number) => number };

// fixed: shades of the columns (lighter, darker, lightest) so they do not look the same
const SHADES = [1, 0.82, 1.1];

export default function Smoke({ clock, step, columns, amount, color, seed, ground }: Props) {
  const texture = useMemo(() => softTexture(), []);
  const spots = useMemo(() => SMOKE_SPOTS.slice(0, columns), [columns]);
  const looks = useMemo(() => spots.flatMap(([, , shade]) => Array.from({ length: amount }, () =>
    new SpriteMaterial({ map: texture, color: new Color(color).multiplyScalar(SHADES[shade]), transparent: true, opacity: 0, depthWrite: false }))), [spots, amount, texture, color]);
  useEffect(() => () => { texture.dispose(); looks.forEach(look => look.dispose()); }, [texture, looks]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useFrame(() => {
    const on = stepShare(step, clock.time);
    looks.forEach((look, index) => {
      const column = Math.floor(index / amount);
      const [x, depth] = spots[column];
      const puff = smokeAt(seed + column, index % amount, amount, clock.time);
      look.opacity = puff.opacity * on;
      sprites.current[index]?.position.set(x + puff.x, ground(x, depth) + puff.y, depth + puff.z);
      sprites.current[index]?.scale.set(puff.scale, puff.scale, 1);
    });
  });

  return <>{looks.map((look, index) => <sprite key={index} ref={sprite => { sprites.current[index] = sprite; }} material={look} />)}</>;
}
