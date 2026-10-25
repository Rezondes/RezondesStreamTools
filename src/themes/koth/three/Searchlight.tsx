// Searchlight on the KOTH bunker at night: a spot light with a faint visible beam that swings over the slope between
// the two angles of the settings (searchlightAngle in searchlight.ts). The beam is a cone with its tip at the lamp.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, type Group, type Object3D, type SpotLight } from "three";
import type { Point3 } from "../../../core/three/beam.ts";
import type { KothClock } from "../build.ts";
import { searchlightAngle } from "../searchlight.ts";
import { useKoth } from "../useKoth.ts";

type Props = { clock: KothClock; at: Point3; color: string; from: number; to: number; speed: number };

// fixed: the lamp sits this far above the bunker roof, its light fades like this; light and beam come from the settings
const LAMP = { lift: 1.2, decay: 1 };

export default function Searchlight({ clock, at, color, from, to, speed }: Props) {
  const values = useKoth();
  const BEAM = { length: values.beamLength, radius: values.beamRadius, opacity: values.beamOpacity, tilt: values.beamTilt };
  const swing = useRef<Group>(null);
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  useFrame(() => swing.current?.rotation.set(0, searchlightAngle(clock.time, from, to, speed), 0));
  return (
    <group ref={swing} position={[at[0], at[1] + LAMP.lift, at[2]]}>
      <spotLight ref={light} color={color} intensity={values.searchlightStrength} distance={values.searchlightReach} decay={LAMP.decay} angle={values.searchlightCone} penumbra={values.searchlightSoftness} castShadow />
      <object3D ref={target} position={[0, -BEAM.length * BEAM.tilt, BEAM.length]} />
      <mesh position={[0, (-BEAM.length * BEAM.tilt) / 2, BEAM.length / 2]} rotation={[BEAM.tilt - Math.PI / 2, 0, 0]}>
        <coneGeometry args={[BEAM.radius, BEAM.length, 24, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={BEAM.opacity} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
