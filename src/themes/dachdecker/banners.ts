// Banners of the Dachdecker theme (DESIGN-DACHDECKER.md "Banner"): the profile banner shows the finished house in the
// evening light, the offline banner the covered roof in the rain as a seamless loop. Vanilla-Three.js scenes for glClip
// from the same data as the scenes; every drop sits where its time puts it (a whole number of falls per loop), so the
// last frame meets the first. Check: banners.check.ts.
import { BufferAttribute, BufferGeometry, Color, Fog, Group, HemisphereLight, DirectionalLight, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene } from "three";
import { hash } from "../../core/hash.ts";
import type { GlSetup } from "../../core/three/glClip.ts";
import { type ClipColors, disposeAll, frameObject, houseObject, skyPlane, tilesObject } from "./clipParts.ts";
import type { FrameDims } from "./frame.ts";
import { house } from "./house.ts";
import { FACE_ROWS, ridgeOf, tileLayout } from "./tiles.ts";

import { OFFLINE_SIZE as OFFLINE, PROFILE_SIZE as PROFILE } from "./render.ts";

// Rain box of the offline banner, falls per loop between 2 and 4, streak length
const RAIN = { x: 13, zMin: -16, zMax: 7, top: 14, laps: [2, 3, 4], length: 0.38 };

// Height of drop index at time: it falls a whole number of times per loop, so time 0 and time loop are the same
export function dropHeight(index: number, time: number, loop: number, seed: number): number {
  const laps = RAIN.laps[Math.floor(hash(seed * 31 + index) * RAIN.laps.length)];
  const phase = hash(seed * 17 + index);
  const fallen = (phase + (laps * time) / loop) % 1;
  return RAIN.top * (1 - fallen);
}
const dropSpot = (index: number, seed: number) => [
  -RAIN.x + 2 * RAIN.x * hash(seed * 7 + index), RAIN.zMin + (RAIN.zMax - RAIN.zMin) * hash(seed * 13 + index),
] as const;

export type BannerOptions = {
  dims: FrameDims; wallHeight: number; seed: number; copperShare: number; lineOpacity: number; fillOpacity: number;
  loop: number; rain: boolean; drops: number; colors: ClipColors & { blueprint: string; page: string; dusk: string; rainColor: string };
};

const lights = (scene: Scene, colors: BannerOptions["colors"], sun: readonly [number, number, number], warm: boolean) => {
  scene.add(new HemisphereLight(colors.muted, warm ? new Color(colors.dusk).multiplyScalar(0.3) : new Color(colors.page), 1.1));
  const main = new DirectionalLight(warm ? new Color(colors.accent).lerp(new Color(colors.line), 0.45) : colors.muted, 1.5);
  main.position.set(...sun);
  scene.add(main);
};

// Camera on a slow swing that returns to its start at the end of the loop
const swing = (camera: PerspectiveCamera, time: number, loop: number, radius: number, height: number, target: readonly [number, number, number], base: number) => {
  const angle = base + Math.sin((time / loop) * Math.PI * 2) * 0.08;
  camera.position.set(Math.sin(angle) * radius, height, target[2] + Math.cos(angle) * radius);
  camera.lookAt(...target);
};

export function profileSetup(options: BannerOptions): GlSetup {
  const { dims, colors } = options;
  const scene = new Scene();
  scene.background = new Color(colors.blueprint);
  scene.add(skyPlane(new Color(colors.blueprint).lerp(new Color(colors.page), 0.5).getStyle(), colors.dusk, 200, 60));
  lights(scene, colors, [10, 4, -12], true);
  const home = house(dims, options.wallHeight);
  const roof = new Group();
  roof.add(frameObject(dims, colors, options.lineOpacity, options.fillOpacity), tilesObject(tileLayout(dims, FACE_ROWS, options.seed, options.copperShare, 2), colors, ridgeOf(dims)));
  roof.position.y = home.roofBase;
  scene.add(roof, houseObject(home, colors, options.lineOpacity));
  const camera = new PerspectiveCamera(30, PROFILE.width / PROFILE.height, 0.1, 300);
  const target = [0, home.roofBase * 0.8, home.wall.center[2]] as const;
  return { scene, camera, update: time => swing(camera, time, options.loop, 22, 7, target, 0.55), dispose: () => disposeAll(scene) };
}

export function offlineSetup(options: BannerOptions): GlSetup {
  const { dims, colors } = options;
  const scene = new Scene();
  const sky = new Color(colors.blueprint).lerp(new Color(colors.page), 0.5);
  scene.background = sky;
  scene.fog = new Fog(sky, 16, 40);
  lights(scene, colors, [-6, 10, 6], false);
  scene.add(frameObject(dims, colors, options.lineOpacity, options.fillOpacity), tilesObject(tileLayout(dims, FACE_ROWS, options.seed, options.copperShare, 2), colors, ridgeOf(dims)));
  const count = options.rain ? options.drops : 0;
  const streaks = new BufferGeometry();
  streaks.setAttribute("position", new BufferAttribute(new Float32Array(count * 6), 3));
  const rain = new LineSegments(streaks, new LineBasicMaterial({ color: colors.rainColor, transparent: true, opacity: 0.75 }));
  rain.frustumCulled = false;
  scene.add(rain);
  const camera = new PerspectiveCamera(38, OFFLINE.width / OFFLINE.height, 0.1, 200);
  const target = [0, -1.3, -3] as const;
  return {
    scene,
    camera,
    update: time => {
      const points = streaks.getAttribute("position").array as Float32Array;
      for (let index = 0; index < count; index++) {
        const [x, depth] = dropSpot(index, options.seed);
        const y = dropHeight(index, time, options.loop, options.seed);
        points.set([x, y, depth, x, y + RAIN.length, depth], index * 6);
      }
      streaks.getAttribute("position").needsUpdate = true;
      swing(camera, time, options.loop, 18.5, 6, target, 0.5);
    },
    dispose: () => disposeAll(scene),
  };
}
