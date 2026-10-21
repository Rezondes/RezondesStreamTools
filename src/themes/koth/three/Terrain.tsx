// Ground of the KOTH world: the low-poly hill with flat shading, sand at the foot turning olive towards the top with
// darker patches. It rises out of the plain in the ground step of the build and carries everything that stands on it
// (children), so nothing floats while it grows.
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { type KothClock, outCubic, type Step, stepShare } from "../build.ts";
import { type GroundColors, groundGeometry } from "../terrainMesh.ts";

export type { GroundColors };

type Props = { clock: KothClock; step: Step; height: number; seed: number; colors: GroundColors; children: ReactNode };

// fixed: a flat scale instead of 0, so the lights still see a ground
const FLAT = 1e-4;

export default function Terrain({ clock, step, height, seed, colors, children }: Props) {
  const geometry = useMemo(() => groundGeometry(height, seed, colors), [height, seed, colors]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rise = useRef<Group>(null);
  useFrame(() => rise.current?.scale.set(1, Math.max(FLAT, outCubic(stepShare(step, clock.time))), 1));
  return (
    <group ref={rise}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>
      {children}
    </group>
  );
}
