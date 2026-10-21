// Torches on the sand of the realistic Urlaub Ending (PLAN-URLAUB.md package 6): bamboo poles with a flame that lights
// the sand around it; flame and light flicker with the clock, each torch out of step with the others.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type PointLight, type Sprite, SpriteMaterial } from "three";
import { shoreHeight } from "../shore.ts";
import type { BeachClock } from "./Sky.tsx";
import { canvasTexture } from "./textures.ts";

type Props = { clock: BeachClock; count: number; flame: string; pole: string };

// fixed: the row of torches (first x, step, z, how far every other one stands back), pole height, flame size and light
const ROW = { from: -9, step: 6, z: 19, back: 2.5 };
const POLE = { height: 2.4, radius: 0.07 };
const FLAME = { size: 0.9, light: 6, reach: 9 };
// fixed: the flame drawn as a soft glow (px)
const GLOW = 64;

export default function Torches({ clock, count, flame, pole }: Props) {
  const material = useMemo(() => new SpriteMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    color: flame,
    map: canvasTexture(GLOW, GLOW, (context, width, height) => {
      const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      glow.addColorStop(0, "rgba(255, 255, 255, 1)"); // fixed: the white hot middle, tinted by the flame color
      glow.addColorStop(1, "rgba(255, 255, 255, 0)"); // fixed: fading out
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }),
  }), [flame]);
  const torches = useMemo(() => Array.from({ length: count }, (_, index) => {
    const [x, depth] = [ROW.from + index * ROW.step, ROW.z - (index % 2) * ROW.back];
    return { x, z: depth, ground: shoreHeight(x, depth) };
  }), [count]);
  const flames = useRef<(Sprite | null)[]>([]);
  const lights = useRef<(PointLight | null)[]>([]);
  useFrame(() => {
    torches.forEach((_, index) => {
      const flicker = 0.8 + 0.12 * Math.sin(clock.time * 13 + index * 2.1) + 0.08 * Math.sin(clock.time * 29 + index);
      flames.current[index]?.scale.set(FLAME.size * flicker, FLAME.size * 1.4 * flicker, 1);
      if (lights.current[index]) lights.current[index].intensity = FLAME.light * flicker;
    });
  });
  return (
    <>
      {torches.map((torch, index) => (
        <group key={index} position={[torch.x, torch.ground, torch.z]}>
          <mesh position={[0, POLE.height / 2, 0]} castShadow>
            <cylinderGeometry args={[POLE.radius, POLE.radius * 1.3, POLE.height, 8]} />
            <meshStandardMaterial color={pole} roughness={0.8} />
          </mesh>
          <sprite ref={sprite => { flames.current[index] = sprite; }} material={material} position={[0, POLE.height + 0.3, 0]} />
          <pointLight ref={light => { lights.current[index] = light; }} color={flame} distance={FLAME.reach} position={[0, POLE.height + 0.3, 0]} />
        </group>
      ))}
    </>
  );
}
