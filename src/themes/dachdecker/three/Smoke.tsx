// Smoke of the chimney in the Dachdecker Ending (DESIGN-DACHDECKER.md "Abend"): soft clouds that rise, drift, grow and
// fade one after the other, each placed from the clock of the scene (puff in house.ts).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Sprite, SpriteMaterial } from "three";
import type { Point3 } from "../../../core/three/beam.ts";
import { puff } from "../house.ts";
import type { BuildClock } from "../schedule.ts";
import { softTexture } from "./softTexture.ts";

type Props = { base: Point3; count: number; clock: BuildClock; seed: number; color: string };

export default function Smoke({ base, count, clock, seed, color }: Props) {
  const texture = useMemo(() => softTexture(), []);
  const looks = useMemo(() => Array.from({ length: count }, () => new SpriteMaterial({ map: texture, color, transparent: true, opacity: 0, depthWrite: false })), [count, texture, color]);
  useEffect(() => () => { texture.dispose(); looks.forEach(look => look.dispose()); }, [texture, looks]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useFrame(() => {
    looks.forEach((look, index) => {
      const sprite = sprites.current[index];
      const cloud = puff(index, count, clock.time, seed);
      look.opacity = cloud ? cloud.opacity : 0;
      if (!sprite || !cloud) return;
      sprite.position.set(base[0] + cloud.offset[0], base[1] + cloud.offset[1], base[2] + cloud.offset[2]);
      sprite.scale.set(cloud.scale, cloud.scale, 1);
    });
  });

  return <>{looks.map((look, index) => <sprite key={index} ref={sprite => { sprites.current[index] = sprite; }} material={look} />)}</>;
}
