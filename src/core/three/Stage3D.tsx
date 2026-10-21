// 3D stage of a full-screen scene (plans/PLAN-GRAFIK.md, package 3): a react-three-fiber canvas on the 1920x1080 stage of
// useStage (scaled with the source like the 2D scenes), with background or transparent, fog, bloom and a performance
// level. Everything visible comes from props the theme fills from its settings. R3F frees the WebGL context on unmount.
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { ReactNode } from "react";
import { useStage } from "../screens/useStage.ts";
import { clampBloom, quality } from "./quality.ts";

export type StageBloom = { strength: number; radius: number; threshold: number };
export type StageFog = { color: string; near: number; far: number };

type Props = {
  background: string | null; // null = transparent (alerts, minimes); bloom is then off, it would break transparency
  fog?: StageFog | null;
  bloom?: StageBloom | null;
  level: string; // performance level, see quality.ts
  fov: number;
  paused?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Stage3D({ background, fog = null, bloom = null, level, fov, paused = false, className = "", children }: Props) {
  const stage = useStage();
  const settings = quality(level);
  const glow = bloom && settings.bloom && background !== null ? bloom : null;
  return (
    <div className={`stage-box ${className}`} ref={stage}>
      <Canvas
        // offsetSize: measure the unscaled 1920x1080 box, the stage scales the canvas with CSS like the 2D scenes
        resize={{ offsetSize: true }}
        dpr={settings.pixelRatio}
        frameloop={paused ? "never" : "always"}
        gl={{ antialias: settings.antialias, alpha: background === null }}
        camera={{ fov, near: 0.1, far: 200 }}
      >
        {background !== null && <color attach="background" args={[background]} />}
        {fog && <fog attach="fog" args={[fog.color, fog.near, fog.far]} />}
        {children}
        {glow && (
          <EffectComposer>
            <Bloom mipmapBlur intensity={clampBloom(glow.strength)} radius={glow.radius} luminanceThreshold={glow.threshold} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
