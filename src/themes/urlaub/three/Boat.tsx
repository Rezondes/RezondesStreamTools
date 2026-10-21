// A sailboat far out on the realistic Urlaub sea: white hull and sail, drifting and rocking with the clock.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group, Shape, ShapeGeometry } from "three";
import type { BeachClock } from "./Sky.tsx";

// fixed: where the boat drifts (x, how far it drifts, z), how it rocks and bobs, hull and sail sizes and colors
const PLACE = { x: 60, drift: 8, z: -300 };
const ROCK = { roll: 0.04, bob: 0.2 };
const HULL = { size: [6, 1, 1.8] as [number, number, number], color: "#f2f2ee" }; // fixed: a white hull
const SAIL = { height: 7, width: 3.4, color: "#fffaf0" }; // fixed: a white sail

export default function Boat({ clock }: { clock: BeachClock }) {
  const boat = useRef<Group>(null);
  const sail = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, SAIL.height);
    shape.lineTo(SAIL.width, 0);
    shape.lineTo(0, 0);
    return new ShapeGeometry(shape);
  }, []);
  useFrame(() => {
    if (!boat.current) return;
    const time = clock.time;
    boat.current.position.set(PLACE.x + Math.sin(time * 0.05) * PLACE.drift, Math.sin(time * 1.1) * ROCK.bob, PLACE.z);
    boat.current.rotation.z = Math.sin(time * 0.9) * ROCK.roll;
  });
  return (
    <group ref={boat}>
      <mesh position={[0, HULL.size[1] / 2, 0]}>
        <boxGeometry args={HULL.size} />
        <meshStandardMaterial color={HULL.color} roughness={0.5} />
      </mesh>
      <mesh geometry={sail} position={[-0.5, HULL.size[1], 0]}>
        <meshStandardMaterial color={SAIL.color} side={DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
}
