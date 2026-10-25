// 3D background of the Urlaub banners (PLAN-URLAUB.md package 8): the realistic beach of the scenes as a still for
// glClip: the physical sky with the sun at the banner height, the mirroring sea, the sand with its rocks and the palms,
// seen from the camera of the scenes, lit by the sky as environment like the scenes. Vanilla Three.js from the same
// builders as the scenes (three/*.tsx).
import { AmbientLight, PerspectiveCamera, Scene, Vector3 } from "three";
import { disposeAll } from "../../core/three/clipParts.ts";
import type { GlRenderer, GlSetup } from "../../core/three/glClip.ts";
import { buildBeach } from "./three/Beach.tsx";
import { BACK, TARGET } from "./three/BeachCamera.tsx";
import { FAR, FOV } from "./three/BeachWorld.tsx";
import { buildOcean } from "./three/Ocean.tsx";
import { buildPalms } from "./three/Palms.tsx";
import { buildSky } from "./three/Sky.tsx";

export type BannerWorldOptions = {
  sunHeight: number; azimuth: number; turbidity: number; seed: number; cameraHeight: number;
  water: string; distortion: number; sand: string; rocks: number;
  palms: { left: number; right: number; sway: number; leaf: string; trunk: string };
  // A soft light from everywhere in place of the sky environment, for a renderer that cannot make one
  ambient: { color: string; strength: number };
};

export function bannerSetup(size: { width: number; height: number }, options: BannerWorldOptions, renderer?: GlRenderer): GlSetup {
  const scene = new Scene();
  const direction = new Vector3();
  const sky = buildSky(options.turbidity, false);
  sky.aim(options.sunHeight, options.azimuth, direction);
  const ocean = buildOcean({ color: options.water, distortion: options.distortion, seed: options.seed, low: false });
  ocean.set(0, direction);
  const palms = buildPalms({ ...options.palms, seed: options.seed });
  palms.sway(0);
  scene.add(sky.sky, sky.sun, sky.hemi, ocean.water, buildBeach({ sand: options.sand, rocks: options.rocks, seed: options.seed }), palms.group);
  const holder = new Scene();
  holder.add(sky.sky.clone());
  const environment = renderer?.environment?.(holder) ?? null;
  if (environment) scene.environment = environment;
  else scene.add(new AmbientLight(options.ambient.color, options.ambient.strength));
  const camera = new PerspectiveCamera(FOV, size.width / size.height, 0.1, FAR);
  camera.position.set(0, options.cameraHeight, BACK);
  camera.lookAt(...TARGET);
  return { scene, camera, update: () => {}, dispose: () => { environment?.dispose(); ocean.dispose(); disposeAll(scene); } };
}
