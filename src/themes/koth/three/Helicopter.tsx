// Helicopter circling far off behind the KOTH hill: body, tail boom and a spinning rotor, placed from the clock.
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { KothClock } from "../build.ts";
import { useKoth } from "../useKoth.ts";

// The flight far behind the hill and above the fog (settings)
export default function Helicopter({ clock, color }: { clock: KothClock; color: string }) {
  const values = useKoth();
  const FLIGHT = {
    turn: values.helicopterTurn, width: values.helicopterWidth, depth: values.helicopterDepth, x: values.helicopterX, z: values.helicopterZ,
    height: values.helicopterHeight, bob: values.helicopterBob, bobSpeed: values.helicopterBobSpeed, tilt: values.helicopterTilt, rotor: values.helicopterRotor,
  };
  const body = useRef<Group>(null);
  const rotor = useRef<Mesh>(null);
  useFrame(() => {
    const time = clock.time;
    const angle = time * FLIGHT.turn;
    body.current?.position.set(Math.cos(angle) * FLIGHT.width + FLIGHT.x, FLIGHT.height + Math.sin(time * FLIGHT.bobSpeed) * FLIGHT.bob, Math.sin(angle) * FLIGHT.depth + FLIGHT.z);
    body.current?.rotation.set(0, -angle - Math.PI / 2, FLIGHT.tilt);
    rotor.current?.rotation.set(0, time * FLIGHT.rotor, 0);
  });
  return (
    <group ref={body}>
      <mesh scale={[1.6, 0.9, 0.9]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      <mesh position={[-2.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.25, 3.2, 6]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
      <mesh ref={rotor} position={[0, 1.05, 0]}>
        <boxGeometry args={[6, 0.04, 0.25]} />
        <meshBasicMaterial color={color} transparent opacity={values.helicopterRotorOpacity} />
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[6, 0.04, 0.25]} />
          <meshBasicMaterial color={color} transparent opacity={values.helicopterRotorOpacity} />
        </mesh>
      </mesh>
    </group>
  );
}
