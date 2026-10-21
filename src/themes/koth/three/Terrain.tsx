// Ground of the KOTH world: the low-poly hill with flat shading, sand at the foot turning olive towards the top with
// darker patches. It rises out of the plain in the ground step of the build and carries everything that stands on it
// (children), so nothing floats while it grows.
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { Color, Float32BufferAttribute, type Group, PlaneGeometry } from "three";
import { hash } from "../../../core/hash.ts";
import { type KothClock, outCubic, type Step, stepShare } from "../build.ts";
import { hillHeight, WORLD_SEGMENTS, WORLD_SIZE } from "../terrain.ts";

export type GroundColors = { sand: string; hill: string; shade: string };
type Props = { clock: KothClock; step: Step; height: number; seed: number; colors: GroundColors; children: ReactNode };

// fixed: where sand turns olive (m above the plain) and how strong the dark patches are on the hill and the plain
const OLIVE_FROM = 0.4;
const OLIVE_SPAN = 2.4;
const PATCHES = { hill: 0.35, plain: 0.08, from: 1 };
// fixed: a flat scale instead of 0, so the lights still see a ground
const FLAT = 1e-4;

function groundGeometry(height: number, seed: number, colors: GroundColors) {
  const plane = new PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_SEGMENTS, WORLD_SEGMENTS);
  plane.rotateX(-Math.PI / 2);
  const position = plane.attributes.position;
  const [sand, hill, shade] = [colors.sand, colors.hill, colors.shade].map(color => new Color(color));
  const tints: number[] = [];
  for (let index = 0; index < position.count; index++) {
    const y = hillHeight(position.getX(index), position.getZ(index), height);
    position.setY(index, y);
    const olive = Math.min(1, Math.max(0, (y - OLIVE_FROM) / OLIVE_SPAN));
    const patch = hash(seed * 13 + index) * (y > PATCHES.from ? PATCHES.hill : PATCHES.plain);
    const tint = sand.clone().lerp(hill, olive).lerp(shade, patch);
    tints.push(tint.r, tint.g, tint.b);
  }
  plane.setAttribute("color", new Float32BufferAttribute(tints, 3));
  plane.computeVertexNormals();
  return plane;
}

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
