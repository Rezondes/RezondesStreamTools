// Transparent 3D layer of the Dachdecker minimes: one canvas over the whole scene with an orthographic camera in px, so
// every figure can follow its anchor element (Figure.tsx). Without bloom, which would break the transparency.
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { quality } from "../../../core/three/quality.ts";

// The camera stands far enough in front that the depth of large figures stays inside near and far; light from the
// front left above, so the round bodies get shading
const CAMERA = { position: [0, 0, 1000] as [number, number, number], near: 1, far: 2000 };
const SUN: [number, number, number] = [-0.6, 0.8, 1];
const LIGHT = { ambient: 0.9, sun: 1.6 };

export default function MinimeStage({ level, light, children }: { level: string; light: string; children: ReactNode }) {
  const settings = quality(level);
  return (
    <Canvas className="dd-minime-canvas" orthographic flat dpr={settings.pixelRatio} gl={{ antialias: settings.antialias, alpha: true }} camera={CAMERA}>
      <ambientLight color={light} intensity={LIGHT.ambient} />
      <directionalLight color={light} intensity={LIGHT.sun} position={SUN} />
      {children}
    </Canvas>
  );
}
