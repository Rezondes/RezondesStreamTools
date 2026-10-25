// A sailboat far out on the realistic Urlaub sea: white hull and sail, drifting and rocking with the clock.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group, Shape, ShapeGeometry } from "three";
import { useUrlaub } from "../useUrlaub.ts";
import type { BeachClock } from "./Sky.tsx";

// fixed: the size of the hull; where the boat drifts, how it rocks and bobs, the sail and the colors come from the settings
const HULL = [6, 1, 1.8] as [number, number, number];

export default function Boat({ clock }: { clock: BeachClock }) {
  const values = useUrlaub();
  const PLACE = { x: values.boatX, drift: values.boatDrift, z: values.boatZ };
  const ROCK = { roll: values.boatRoll, bob: values.boatBob };
  const SAIL = { height: values.boatSailHeight, width: values.boatSailWidth };
  const boat = useRef<Group>(null);
  const sail = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, SAIL.height);
    shape.lineTo(SAIL.width, 0);
    shape.lineTo(0, 0);
    return new ShapeGeometry(shape);
  }, [SAIL.height, SAIL.width]);
  useFrame(() => {
    if (!boat.current) return;
    const time = clock.time;
    boat.current.position.set(PLACE.x + Math.sin(time * 0.05) * PLACE.drift, Math.sin(time * 1.1) * ROCK.bob, PLACE.z);
    boat.current.rotation.z = Math.sin(time * 0.9) * ROCK.roll;
  });
  return (
    <group ref={boat}>
      <mesh position={[0, HULL[1] / 2, 0]}>
        <boxGeometry args={HULL} />
        <meshStandardMaterial color={values.boatHullColor} roughness={0.5} />
      </mesh>
      <mesh geometry={sail} position={[-0.5, HULL[1], 0]}>
        <meshStandardMaterial color={values.boatSailColor} side={DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
}
