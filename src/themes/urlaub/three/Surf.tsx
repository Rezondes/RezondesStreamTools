// The surf of the realistic Urlaub beach: bands of foam run up the beach, widen, thin out and fade (shore.ts), each
// placed from the clock only; the front of a band wobbles more the further it ran.
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshBasicMaterial, PlaneGeometry } from "three";
import { shoreHeight, surfBand } from "../shore.ts";
import type { BeachClock } from "./Sky.tsx";
import { canvasTexture, sequence } from "./textures.ts";

type Props = { clock: BeachClock; bands: number; seconds: number; foam: string; seed: number };

// fixed: the foam strip (width, depth, segments), the foam texture (px, bubbles, repeats), how high over the sand, how
// strong, how far the front wobbles
const STRIP = { width: 260, depth: 4, segments: 120, half: 1.2 };
const TEXTURE = { width: 1024, height: 64, bubbles: 2600, repeat: [6, 1] as [number, number] };
const LIFT = 0.03;
const STRENGTH = 0.9;
const WOBBLE = 1.4;

export default function Surf({ clock, bands, seconds, foam, seed }: Props) {
  const strips = useMemo(() => {
    const random = sequence(seed + 2);
    const map = canvasTexture(TEXTURE.width, TEXTURE.height, (context, width, height) => {
      context.fillStyle = foam;
      for (let bubble = 0; bubble < TEXTURE.bubbles; bubble++) {
        const x = random() * width;
        const y = height * 0.5 + (random() - 0.5) * height * (0.3 + 0.7 * Math.sin(x * 0.02) ** 2);
        context.globalAlpha = 0.3 + random() * 0.6;
        context.beginPath();
        context.arc(x, y, 1 + random() * 3, 0, Math.PI * 2);
        context.fill();
      }
    }, TEXTURE.repeat);
    return Array.from({ length: bands }, (_, index) => {
      const geometry = new PlaneGeometry(STRIP.width, STRIP.depth, STRIP.segments, 1);
      geometry.rotateX(-Math.PI / 2);
      const material = new MeshBasicMaterial({ map: map.clone(), transparent: true, depthWrite: false });
      material.map!.offset.x = (index / bands) * TEXTURE.repeat[0] * 0.5;
      return { geometry, material, offset: index / bands };
    });
  }, [bands, foam, seed]);
  useFrame(() => {
    strips.forEach((strip, index) => {
      const band = surfBand(index, bands, clock.time, seconds);
      strip.material.opacity = band.opacity * STRENGTH;
      const position = strip.geometry.attributes.position;
      for (let point = 0; point < position.count; point++) {
        const x = position.getX(point);
        const side = point < position.count / 2 ? -STRIP.half : STRIP.half;
        position.setZ(point, band.z + side * band.stretch + Math.sin(x * 0.12 + strip.offset * 9) * WOBBLE * band.share);
        position.setY(point, Math.max(LIFT, shoreHeight(x, band.z) + LIFT));
      }
      position.needsUpdate = true;
    });
  });
  return <>{strips.map((strip, index) => <mesh key={index} geometry={strip.geometry} material={strip.material} />)}</>;
}
