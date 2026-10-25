// Camp fire before the tents of the KOTH camp at night: crossed logs, a flickering flame with its light and sparks that
// rise and fade, all from the clock.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, type Mesh, type PointLight } from "three";
import { hash } from "../../../core/hash.ts";
import type { Point3 } from "../../../core/three/beam.ts";
import type { KothClock } from "../build.ts";
import { useKoth } from "../useKoth.ts";

type Props = { clock: KothClock; at: Point3; flame: string; wood: string; sparks: number };

// Size of the fire in m, its flicker and the rise of the sparks (settings)
export default function Campfire({ clock, at, flame, wood, sparks }: Props) {
  const values = useKoth();
  const FIRE = { height: values.fireHeight, radius: values.fireRadius, flicker: values.fireFlicker, light: values.fireLight, reach: values.fireReach, opacity: values.fireOpacity };
  const SPARK = { rise: values.sparkRise, speed: values.sparkSpeed, sway: values.sparkSway, size: values.sparkSize, opacity: values.sparkOpacity };
  const fire = useRef<Mesh>(null);
  const glow = useRef<PointLight>(null);
  const geometry = useMemo(() => new BufferGeometry().setAttribute("position", new Float32BufferAttribute(new Float32Array(sparks * 3), 3)), [sparks]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const time = clock.time;
    const flicker = 0.85 + 0.15 * Math.sin(time * FIRE.flicker) * Math.sin(time * FIRE.flicker * 1.7);
    fire.current?.scale.set(1, flicker, 1);
    if (glow.current) glow.current.intensity = FIRE.light * flicker;
    const position = geometry.attributes.position;
    for (let spark = 0; spark < sparks; spark++) {
      const age = (time * SPARK.speed + hash(spark * 13)) % 1;
      position.setXYZ(spark, Math.sin(time * 2 + spark) * SPARK.sway * age, FIRE.height * 0.5 + age * SPARK.rise, Math.cos(time * 1.7 + spark) * SPARK.sway * age);
    }
    position.needsUpdate = true;
  });
  return (
    <group position={at}>
      {[0, Math.PI / 2].map(turn => (
        <mesh key={turn} position={[0, 0.08, 0]} rotation={[0, turn, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
          <meshStandardMaterial color={wood} flatShading roughness={1} />
        </mesh>
      ))}
      <mesh ref={fire} position={[0, FIRE.height / 2, 0]}>
        <coneGeometry args={[FIRE.radius, FIRE.height, 7]} />
        <meshBasicMaterial color={flame} transparent opacity={FIRE.opacity} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={glow} position={[0, FIRE.height, 0]} color={flame} intensity={FIRE.light} distance={FIRE.reach} decay={1.5} />
      <points geometry={geometry}><pointsMaterial color={flame} size={SPARK.size} transparent opacity={SPARK.opacity} blending={AdditiveBlending} depthWrite={false} /></points>
    </group>
  );
}
