// Searchlight on the KOTH bunker at night: a spot light with a faint visible beam that swings over the slope between
// the two angles of the settings (searchlightAngle in searchlight.ts). The beam is a cone with its tip at the lamp.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, type Group, type Object3D, type SpotLight } from "three";
import type { Point3 } from "../../../core/three/beam.ts";
import type { KothClock } from "../build.ts";
import { searchlightAngle } from "../searchlight.ts";

type Props = { clock: KothClock; at: Point3; color: string; from: number; to: number; speed: number };

// fixed: the lamp on the bunker roof, its light and the visible beam (length and spread in m)
const LAMP = { lift: 1.2, strength: 150, reach: 60, cone: 0.28, softness: 0.5, decay: 1 };
const BEAM = { length: 22, radius: 3.5, opacity: 0.16, tilt: 0.18 };

export default function Searchlight({ clock, at, color, from, to, speed }: Props) {
  const swing = useRef<Group>(null);
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  useFrame(() => swing.current?.rotation.set(0, searchlightAngle(clock.time, from, to, speed), 0));
  return (
    <group ref={swing} position={[at[0], at[1] + LAMP.lift, at[2]]}>
      <spotLight ref={light} color={color} intensity={LAMP.strength} distance={LAMP.reach} decay={LAMP.decay} angle={LAMP.cone} penumbra={LAMP.softness} castShadow />
      <object3D ref={target} position={[0, -BEAM.length * BEAM.tilt, BEAM.length]} />
      <mesh position={[0, (-BEAM.length * BEAM.tilt) / 2, BEAM.length / 2]} rotation={[BEAM.tilt - Math.PI / 2, 0, 0]}>
        <coneGeometry args={[BEAM.radius, BEAM.length, 24, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={BEAM.opacity} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
