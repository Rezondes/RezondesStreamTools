// Stinger of the KOTH theme in 3D (PLAN-KOTH.md package 5): a smoke grenade rolls in and pops, low-poly smoke grows
// until a smoke wall covers the picture at the transition point (cut); in the smoke the flag changes from one faction
// to the next with the text, then the smoke clears. Before and after transparent. A Vanilla-Three.js scene for glClip,
// every part a pure function of the time (smokeStinger.ts, flag.ts). Check: stinger.check.ts.
import {
  AmbientLight, CanvasTexture, Color, CylinderGeometry, DirectionalLight, DoubleSide, Group, IcosahedronGeometry, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace,
} from "three";
import { disposeAll } from "../../core/three/clipParts.ts";
import type { GlSetup } from "../../core/three/glClip.ts";
import { flagOffset } from "./flag.ts";
import { flagSide, grenadeAt, smokeCover, smokePuffs } from "./smokeStinger.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type KothStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  flag: boolean; // the flag change in the smoke
  smoke: string;
  flags: readonly [string, string]; // flag color before and after the transition point
  pole: string;
  grenade: string;
  puffs: number;
  seed: number;
};
// The text in the smoke, drawn by the caller on a canvas (none in checks)
export type TextPicture = HTMLCanvasElement | OffscreenCanvas;

// fixed: camera, light and the parts in m (the camera stands 9 m before the grenade, the wall and the flag close to it)
const CAMERA = { fov: 40, position: [0, 1.6, 9] as const, target: [0, 1.4, 0] as const };
const LIGHT = { ambient: 0.7, sun: 1.2, white: 0xffffff };
const WALL = { z: 6, width: 6, height: 4 };
const POLE = { x: -0.45, z: 6.6, bottom: 0.8, height: 1.5, radius: 0.012 };
const CLOTH = { width: 0.9, height: 0.56, segments: [16, 8] as const, wind: 0.6 };
const TEXT = { y: 0.95, width: 1.4, height: 0.25 };
const GRENADE = { radius: 0.12, length: 0.3 };
const SHOWN = 0.6;

// How much flag and text show: fully at the cut, fading before and after
const shownAt = (time: number, options: KothStingerOptions) =>
  Math.max(0, 1 - Math.abs(time - options.cut) / (Math.min(options.cut, options.duration - options.cut) * SHOWN));

function flagParts(options: KothStingerOptions) {
  const group = new Group();
  const pole = new Mesh(new CylinderGeometry(POLE.radius, POLE.radius, POLE.height, 6), new MeshBasicMaterial({ color: options.pole, transparent: true }));
  pole.position.set(POLE.x, POLE.bottom + POLE.height / 2, POLE.z);
  const geometry = new PlaneGeometry(CLOTH.width, CLOTH.height, ...CLOTH.segments);
  geometry.translate(CLOTH.width / 2, -CLOTH.height / 2, 0);
  const cloth = new Mesh(geometry, new MeshLambertMaterial({ color: options.flags[0], side: DoubleSide, transparent: true }));
  cloth.name = "cloth";
  cloth.position.set(POLE.x + POLE.radius, POLE.bottom + POLE.height, POLE.z);
  group.add(pole, cloth);
  group.visible = options.flag;
  return { group, pole, cloth, rest: Float32Array.from(geometry.attributes.position.array) };
}

export function stingerSetup(options: KothStingerOptions, text: TextPicture | null = null): GlSetup {
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, WIDTH / HEIGHT, 0.1, 100);
  camera.position.set(...CAMERA.position);
  camera.lookAt(...CAMERA.target);
  const sun = new DirectionalLight(LIGHT.white, LIGHT.sun);
  sun.position.set(-3, 5, 6);
  scene.add(new AmbientLight(LIGHT.white, LIGHT.ambient), sun);

  const grenade = new Mesh(new CylinderGeometry(GRENADE.radius, GRENADE.radius, GRENADE.length, 10), new MeshLambertMaterial({ color: options.grenade, flatShading: true }));
  grenade.name = "grenade";
  grenade.rotation.x = Math.PI / 2;
  const puffShape = new IcosahedronGeometry(1, 1);
  const puffs = Array.from({ length: options.puffs }, () => new Mesh(puffShape, new MeshLambertMaterial({ color: options.smoke, flatShading: true, transparent: true, depthWrite: false })));
  const wall = new Mesh(new PlaneGeometry(WALL.width, WALL.height), new MeshBasicMaterial({ color: options.smoke, transparent: true }));
  wall.name = "cover";
  wall.position.set(CAMERA.position[0], CAMERA.position[1], WALL.z);
  const flag = flagParts(options);
  const print = text ? new CanvasTexture(text) : null;
  if (print) print.colorSpace = SRGBColorSpace;
  const label = new Mesh(new PlaneGeometry(TEXT.width, TEXT.height), new MeshBasicMaterial({ map: print, transparent: true, visible: print !== null }));
  label.name = "text";
  label.position.set(0, TEXT.y, POLE.z);
  scene.add(grenade, ...puffs, wall, flag.group, label);
  const [first, second] = options.flags.map(color => new Color(color));

  return {
    scene,
    camera,
    update: time => {
      const timing = { duration: options.duration, cut: options.cut };
      const roll = grenadeAt(time, timing);
      grenade.visible = roll.visible;
      grenade.position.set(roll.x, GRENADE.radius, 0);
      grenade.rotation.z = -roll.spin;
      smokePuffs(options.seed, options.puffs, time, timing).forEach((puff, index) => {
        puffs[index].position.set(puff.x, puff.y + GRENADE.radius, puff.z);
        puffs[index].scale.setScalar(puff.scale);
        puffs[index].material.opacity = puff.opacity;
      });
      const cover = smokeCover(time, timing);
      wall.material.opacity = cover;
      const shown = shownAt(time, options) * cover;
      const position = flag.cloth.geometry.attributes.position;
      for (let index = 0; index < position.count; index++) {
        const along = flag.rest[index * 3];
        const across = flag.rest[index * 3 + 1];
        const offset = flagOffset(along, across, time, CLOTH.width, CLOTH.wind);
        position.setXYZ(index, along, across + offset.sag * CLOTH.height, offset.depth * CLOTH.height);
      }
      position.needsUpdate = true;
      const clothLook = flag.cloth.material;
      clothLook.color.copy(flagSide(time, options.cut) === 0 ? first : second);
      clothLook.opacity = shown;
      flag.pole.material.opacity = shown;
      label.material.opacity = shown;
    },
    dispose: () => { print?.dispose(); disposeAll(scene); },
  };
}
