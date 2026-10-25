// Gulls over the realistic Urlaub beach: small drawn sprites gliding in wide circles, rising and sinking, tilting a
// little, all from the clock.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type Sprite, SpriteMaterial } from "three";
import { useUrlaub } from "../useUrlaub.ts";
import type { BeachClock } from "./Sky.tsx";
import { canvasTexture } from "./textures.ts";

type Props = { clock: BeachClock; count: number; color: string };

// fixed: the sprite (px) and its size in the world; the circles, the height, how far they rise and sink and tilt come
// from the settings
const SPRITE = { width: 64, height: 32, scale: [2.4, 1.2, 1] as [number, number, number] };

export default function Gulls({ clock, count, color }: Props) {
  const values = useUrlaub();
  const CIRCLE = {
    radius: values.gullRadius, step: values.gullStep, height: values.gullHeight, rise: values.gullRise, center: values.gullCenter, depth: values.gullDepth,
    swing: values.gullSwing, tilt: values.gullTilt,
  };
  const material = useMemo(() => new SpriteMaterial({
    transparent: true,
    map: canvasTexture(SPRITE.width, SPRITE.height, context => {
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(4, 18);
      context.quadraticCurveTo(18, 6, 32, 18);
      context.quadraticCurveTo(46, 6, 60, 18);
      context.stroke();
    }),
  }), [color]);
  const gulls = useRef<(Sprite | null)[]>([]);
  useFrame(() => {
    gulls.current.forEach((gull, index) => {
      if (!gull) return;
      const phase = index * 1.3;
      const angle = clock.time * 0.15 + phase;
      const radius = CIRCLE.radius + (index % 8) * CIRCLE.step;
      gull.position.set(Math.cos(angle) * radius, CIRCLE.height + (index % 8) * CIRCLE.rise + Math.sin(clock.time * 0.8 + phase) * CIRCLE.swing, CIRCLE.center + Math.sin(angle) * CIRCLE.depth);
      gull.material.rotation = Math.sin(clock.time * 6 + phase) * CIRCLE.tilt;
    });
  });
  return <>{Array.from({ length: count }, (_, index) => <sprite key={index} ref={gull => { gulls.current[index] = gull; }} material={material.clone()} scale={SPRITE.scale} />)}</>;
}
