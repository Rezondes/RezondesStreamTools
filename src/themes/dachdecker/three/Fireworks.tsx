// Fireworks of the Dachdecker Ending (DESIGN-DACHDECKER.md "Abend"): glowing sparks in terracotta, copper, white and brick
// that burst over the roof again and again after the stamp. A small pool of point clouds shows the bursts alive at the
// time of the clock (bursts in fireworks.ts).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from "three";
import { BURST_LIFE, bursts } from "../fireworks.ts";
import type { BuildClock } from "../schedule.ts";
import { softTexture } from "./softTexture.ts";

type Props = { clock: BuildClock; seed: number; start: number; every: number; sparks: number; colors: readonly string[] };

const SPARK_SIZE = 0.13;

export default function Fireworks({ clock, seed, start, every, sparks, colors }: Props) {
  const texture = useMemo(() => softTexture(), []);
  // As many clouds as bursts can be alive at once
  const pool = useMemo(() => Array.from({ length: Math.ceil(BURST_LIFE / every) + 2 }, () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(sparks * 3), 3));
    const material = new PointsMaterial({ size: SPARK_SIZE, transparent: true, opacity: 0, map: texture, depthWrite: false, blending: AdditiveBlending });
    return Object.assign(new Points(geometry, material), { frustumCulled: false });
  }), [every, sparks, texture]);
  useEffect(() => () => { texture.dispose(); pool.forEach(cloud => { cloud.geometry.dispose(); cloud.material.dispose(); }); }, [texture, pool]);

  useFrame(() => {
    const alive = bursts(seed, clock.time, start, every, sparks);
    pool.forEach((cloud, index) => {
      const burst = alive[index];
      cloud.visible = Boolean(burst);
      if (!burst) return;
      (cloud.geometry.getAttribute("position").array as Float32Array).set(burst.points);
      cloud.geometry.getAttribute("position").needsUpdate = true;
      cloud.material.opacity = burst.life;
      cloud.material.color.set(colors[burst.tone % colors.length]);
    });
  });

  return <>{pool.map((cloud, index) => <primitive key={index} object={cloud} />)}</>;
}
