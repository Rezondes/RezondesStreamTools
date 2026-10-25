// A beach umbrella and a deck chair on the sand of the realistic Urlaub BRB (PLAN-URLAUB.md package 6): the canopy in its
// color with light gores, swaying a little in the wind with the clock; the chair of wood with fabric in the same color.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, Color, ConeGeometry, type Group } from "three";
import { mixHex } from "../../../core/color.ts";
import { shoreHeight } from "../shore.ts";
import { useUrlaub } from "../useUrlaub.ts";
import type { BeachClock } from "./Sky.tsx";

type Props = { clock: BeachClock; color: string; wood: string; light: string };

// fixed: where umbrella and chair stand (x, z), the pole, the canopy (radius, height, gores), how it sways, the chair
const SPOT = { x: -7, z: 21 };
const POLE = { height: 3.2, radius: 0.05 };
const CANOPY = { radius: 2.2, height: 0.7, gores: 8 };
const CHAIR = { x: -4.6, z: 22.5, turn: -0.5, seat: [1.2, 0.08, 1.8] as [number, number, number], back: [1.2, 0.08, 1.1] as [number, number, number] };

export default function Umbrella({ clock, color, wood, light }: Props) {
  const values = useUrlaub();
  // how the canopy sways (settings)
  const SWAY = { angle: values.umbrellaSway, speed: values.umbrellaSwaySpeed };
  const top = useRef<Group>(null);
  const canopy = useMemo(() => {
    const geometry = new ConeGeometry(CANOPY.radius, CANOPY.height, CANOPY.gores * 2, 1, true);
    // Every other gore light, the others in the color
    const [main, pale] = [new Color(color), new Color(mixHex(color, light, 0.85))];
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    for (let index = 0; index < position.count; index++) {
      const angle = Math.atan2(position.getZ(index), position.getX(index)) + Math.PI;
      (Math.floor((angle / (Math.PI * 2)) * CANOPY.gores * 2) % 2 ? pale : main).toArray(colors, index * 3);
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return geometry;
  }, [color, light]);
  const ground = shoreHeight(SPOT.x, SPOT.z);
  useFrame(() => {
    if (top.current) top.current.rotation.z = Math.sin(clock.time * SWAY.speed) * SWAY.angle;
  });
  const chairGround = shoreHeight(CHAIR.x, CHAIR.z);
  return (
    <>
      <group ref={top} position={[SPOT.x, ground, SPOT.z]}>
        <mesh position={[0, POLE.height / 2, 0]} castShadow>
          <cylinderGeometry args={[POLE.radius, POLE.radius, POLE.height, 8]} />
          <meshStandardMaterial color={wood} roughness={0.8} />
        </mesh>
        <mesh geometry={canopy} position={[0, POLE.height, 0]} castShadow>
          <meshStandardMaterial vertexColors side={2} roughness={0.7} />
        </mesh>
      </group>
      <group position={[CHAIR.x, chairGround + 0.35, CHAIR.z]} rotation={[0, CHAIR.turn, 0]}>
        <mesh castShadow>
          <boxGeometry args={CHAIR.seat} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, -1.1]} rotation={[-0.9, 0, 0]} castShadow>
          <boxGeometry args={CHAIR.back} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {[-0.55, 0.55].map(side => (
          <mesh key={side} position={[side, -0.17, 0]}>
            <boxGeometry args={[0.06, 0.34, 1.8]} />
            <meshStandardMaterial color={wood} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </>
  );
}
