// Transparent 3D layer of the Dachdecker minimes: one canvas over the whole scene with an orthographic camera in px, so
// every figure can follow its anchor element (Figure.tsx). Without bloom, which would break the transparency.
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { quality } from "../../../core/three/quality.ts";

// The camera stands far enough in front that the depth of large figures stays inside near and far
const CAMERA = { position: [0, 0, 1000] as [number, number, number], near: 1, far: 2000 };

export default function MinimeStage({ level, children }: { level: string; children: ReactNode }) {
  const settings = quality(level);
  return (
    <Canvas className="dd-minime-canvas" orthographic flat dpr={settings.pixelRatio} gl={{ antialias: settings.antialias, alpha: true }} camera={CAMERA}>
      {children}
    </Canvas>
  );
}
