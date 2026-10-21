// 3D stage of a full-screen scene (plans/PLAN-GRAFIK.md, package 3): a react-three-fiber canvas on the 1920x1080 stage of
// useStage (scaled with the source like the 2D scenes), with background or transparent, fog, bloom and a performance
// level, and a filmic exposure for physical skies. Everything visible comes from props the theme fills from its settings.
// R3F frees the WebGL context on unmount.
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { type ReactNode, useEffect } from "react";
import { useStage } from "../screens/useStage.ts";
import { clampBloom, quality } from "./quality.ts";

export type StageBloom = { strength: number; radius: number; threshold: number };
export type StageFog = { color: string; near: number; far: number };

// fixed: distance of the orthographic camera in front of the stage plane
const ORTHO_DISTANCE = 1000;

type Props = {
  background: string | null; // null = transparent (alerts, minimes); bloom is then off, it would break transparency
  fog?: StageFog | null;
  bloom?: StageBloom | null;
  level: string; // performance level, see quality.ts
  fov: number;
  far?: number; // far plane of the camera in world units
  orthographic?: boolean; // overlays: one world unit is one stage pixel, the middle of the stage at 0, 0
  shadows?: boolean; // soft shadows of lights with castShadow; off at the low level
  paused?: boolean;
  exposure?: number; // with it filmic tone mapping (ACES) at this exposure, for physical skies and water; without it flat
  className?: string;
  children: ReactNode;
};

// The exposure of the filmic tone mapping, kept in step with the setting
function Exposure({ value }: { value: number }) {
  const gl = useThree(state => state.gl);
  useEffect(() => { gl.toneMappingExposure = value; }, [gl, value]);
  return null;
}

export default function Stage3D({ background, fog = null, bloom = null, level, fov, far = 200, orthographic = false, shadows = false, paused = false, exposure, className = "", children }: Props) {
  const stage = useStage();
  const settings = quality(level);
  const glow = bloom && settings.bloom && background !== null ? bloom : null;
  return (
    <div className={`stage-box ${className}`} ref={stage}>
      <Canvas
        // offsetSize: measure the unscaled 1920x1080 box, the stage scales the canvas with CSS like the 2D scenes
        resize={{ offsetSize: true }}
        // flat: no tone mapping, so the colors of the settings appear as chosen (ACES would wash them out); with an exposure
        // the filmic tone mapping of R3F stays on
        flat={exposure === undefined}
        dpr={settings.pixelRatio}
        shadows={shadows && settings.shadows ? "soft" : false}
        frameloop={paused ? "never" : "always"}
        gl={{ antialias: settings.antialias, alpha: background === null }}
        orthographic={orthographic}
        camera={orthographic ? { zoom: 1, position: [0, 0, ORTHO_DISTANCE], near: 0.1, far } : { fov, near: 0.1, far }}
      >
        {exposure !== undefined && <Exposure value={exposure} />}
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
