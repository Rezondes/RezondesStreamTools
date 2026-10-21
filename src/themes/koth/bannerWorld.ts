// 3D background of the KOTH banners (PLAN-KOTH.md package 5): the hill of the scenes as a still for glClip: sky
// gradient, fog, mountains, the ground mesh, radio mast, flag, pines and rocks of the camp layout, seen from the camera
// circle. Vanilla Three.js, the same pure modules as the scenes. Check: bannerWorld.check.ts.
import {
  AmbientLight, BackSide, BufferGeometry, Color, ConeGeometry, DirectionalLight, DodecahedronGeometry, DoubleSide, Float32BufferAttribute, Fog,
  LineBasicMaterial, LineSegments, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial,
  SphereGeometry,
} from "three";
import { disposeAll } from "../../core/three/clipParts.ts";
import type { GlSetup } from "../../core/three/glClip.ts";
import { cameraPose } from "./build.ts";
import { campLayout, FLAG_POLE } from "./camp.ts";
import { mastSegments } from "./mast.ts";
import { mountainRing } from "./terrain.ts";
import { groundGeometry } from "./terrainMesh.ts";

export type BannerWorldOptions = {
  seed: number; hillHeight: number; mastHeight: number; trees: number; rocks: number; radius: number; height: number;
  sky: { top: string; horizon: string }; light: string;
  colors: { sand: string; hill: string; shade: string; mountain: string; steel: string; pine: string; rock: string; flag: string };
};

// fixed: lens, light and sky of the scenes, the angle on the camera circle, pole and flag sizes in m
const LENS = { fov: 34, far: 400, turn: 0.35 };
const LIGHT = { ambient: 0.9, sun: 2.2, position: [-30, 22, 18] as const };
const SKY = { radius: 300, fogNear: 50, fogFar: 210, fogMix: 0.8 };
const POLE = { height: 6.2, flag: [2.8, 1.75] as const };
const VERTEX = "varying vec3 point; void main() { point = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const FRAGMENT = "uniform vec3 top; uniform vec3 horizon; varying vec3 point; void main() { gl_FragColor = vec4(mix(horizon, top, clamp(point.y * 2.5, 0.0, 1.0)), 1.0); }";

const flat = (color: string) => new MeshLambertMaterial({ color, flatShading: true });

export function bannerSetup(size: { width: number; height: number }, options: BannerWorldOptions): GlSetup {
  const scene = new Scene();
  const { top, horizon } = options.sky;
  scene.fog = new Fog(new Color(top).lerp(new Color(horizon), SKY.fogMix), SKY.fogNear, SKY.fogFar);
  scene.add(new Mesh(new SphereGeometry(SKY.radius, 32, 16), new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    uniforms: { top: { value: new Color(top) }, horizon: { value: new Color(horizon) } },
  })));
  const sun = new DirectionalLight(options.light, LIGHT.sun);
  sun.position.set(...LIGHT.position);
  scene.add(new AmbientLight(options.light, LIGHT.ambient), sun);

  const { colors } = options;
  const ground = new Mesh(groundGeometry(options.hillHeight, options.seed, { sand: colors.sand, hill: colors.hill, shade: colors.shade }), new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  ground.name = "ground";
  scene.add(ground);
  for (const mountain of mountainRing(options.seed)) {
    const peak = new Mesh(new ConeGeometry(mountain.radius, mountain.height, mountain.sides), flat(colors.mountain));
    peak.position.set(mountain.x, mountain.height / 2 - 2, mountain.z);
    scene.add(peak);
  }
  const lattice = mastSegments(options.hillHeight, options.mastHeight).flatMap(segment => [...segment.from, ...segment.to]);
  const mast = new LineSegments(new BufferGeometry().setAttribute("position", new Float32BufferAttribute(lattice, 3)), new LineBasicMaterial({ color: colors.steel }));
  mast.name = "mast";
  scene.add(mast);

  const items = campLayout({ seed: options.seed, hillHeight: options.hillHeight, sandbags: false, bunker: false, tents: 0, crateStacks: 0, fence: false, trees: options.trees, rocks: options.rocks, jeep: false, markerFlags: false });
  for (const item of items) {
    if (item.kind === "pole") {
      const cloth = new Mesh(new PlaneGeometry(...POLE.flag), new MeshLambertMaterial({ color: colors.flag, side: DoubleSide }));
      cloth.name = "flag";
      cloth.position.set(FLAG_POLE.x + POLE.flag[0] / 2, item.y + POLE.height - POLE.flag[1] / 2, FLAG_POLE.z);
      scene.add(cloth);
    } else {
      const shape = item.kind === "tree" ? new ConeGeometry(item.size * 0.45, item.size, 6) : new DodecahedronGeometry(item.size, 0);
      const thing = new Mesh(shape, flat(item.kind === "tree" ? colors.pine : colors.rock));
      thing.position.set(item.x, item.y + (item.kind === "tree" ? item.size / 2 : 0), item.z);
      scene.add(thing);
    }
  }

  const camera = new PerspectiveCamera(LENS.fov, size.width / size.height, 0.1, LENS.far);
  const pose = cameraPose(0, { intro: false, radius: options.radius, height: options.height, speed: 0, top: options.hillHeight });
  const [x, y, depth] = pose.position;
  const distance = Math.hypot(x, depth);
  camera.position.set(Math.sin(LENS.turn) * distance, y, Math.cos(LENS.turn) * distance);
  camera.lookAt(...pose.target);
  return { scene, camera, update: () => {}, dispose: () => disposeAll(scene) };
}
