// The sea of the realistic Urlaub beach: the Water shader of three.js with a tileable normal map made in code
// (waterNormals.ts), mirroring the sky and the sun; its waves move with the clock. A smaller mirror at the low level.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { type Color, DataTexture, PlaneGeometry, RepeatWrapping, RGBAFormat, type Vector3 } from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { waterNormals } from "../waterNormals.ts";
import type { BeachClock } from "./Sky.tsx";

type Props = { clock: BeachClock; color: string; distortion: number; seed: number; low: boolean; direction: Vector3 };

// fixed: the normal tile (px), the size of the sea, the mirror (px) at full and low level, the wave scale, the wave
// speed and the color of the sun in the water
const NORMALS = 256;
const SEA = 10000;
const MIRROR = { full: 1024, low: 256 };
const WAVES = { size: 6, speed: 0.55 };
const SUN_COLOR = "#fff0d8"; // fixed: the warm white of the sun in the water

export default function Ocean({ clock, color, distortion, seed, low, direction }: Props) {
  const normals = useMemo(() => {
    const texture = new DataTexture(new Uint8Array(waterNormals(NORMALS, seed).buffer), NORMALS, NORMALS, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }, [seed]);
  const water = useMemo(() => {
    const mirror = low ? MIRROR.low : MIRROR.full;
    const sea = new Water(new PlaneGeometry(SEA, SEA), { textureWidth: mirror, textureHeight: mirror, waterNormals: normals, sunColor: SUN_COLOR, fog: false });
    sea.rotation.x = -Math.PI / 2;
    sea.material.uniforms.size.value = WAVES.size;
    return sea;
  }, [normals, low]);
  useEffect(() => {
    (water.material.uniforms.waterColor.value as Color).set(color);
    water.material.uniforms.distortionScale.value = distortion;
  }, [water, color, distortion]);
  useEffect(() => () => {
    water.geometry.dispose();
    water.material.dispose();
    normals.dispose();
  }, [water, normals]);
  useFrame(() => {
    water.material.uniforms.time.value = clock.time * WAVES.speed;
    (water.material.uniforms.sunDirection.value as Vector3).copy(direction).normalize();
  });
  return <primitive object={water} />;
}
