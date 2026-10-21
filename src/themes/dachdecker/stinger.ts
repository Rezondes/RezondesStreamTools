// Stinger of the Dachdecker theme (DESIGN-DACHDECKER.md "Stinger"): a blueprint rolls out from left to right, covers the
// picture at the transition point, holds briefly and is rolled up again from left to right. Everything on it (title,
// drawing, title block, stamp) is printed on the paper (sheet.ts, given as a picture), so it rolls in and out with the
// sheet. The roll is a shaded paper cylinder that turns as it travels and gets thinner while it unrolls (thicker while
// it rolls up); the sheet behind it is cut at the roll with a clipping plane. A Vanilla-Three.js scene for glClip, every
// part a pure function of the time. Check: stinger.check.ts.
import {
  AmbientLight, CanvasTexture, Color, CylinderGeometry, DirectionalLight, DoubleSide, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh,
  MeshBasicMaterial, MeshLambertMaterial, OrthographicCamera, Plane, PlaneGeometry, Scene, SRGBColorSpace, Vector3,
} from "three";
import type { GlSetup } from "../../core/three/glClip.ts";
import { disposeAll } from "../../core/three/clipParts.ts";
import { rollAt, type RollTiming, STINGER_SIZE } from "./roll.ts";

const WIDTH = STINGER_SIZE.width;
const HEIGHT = STINGER_SIZE.height;

export type StingerOptions = RollTiming & { fps: number; blueprint: string; line: string; copper: string; shadow: string };
// The printed sheet: a canvas of the stinger size (sheet.ts); without one (checks) the sheet is plain blueprint
export type SheetPicture = HTMLCanvasElement | OffscreenCanvas;

// The paper of the roll overlaps the picture top and bottom
const OVERHANG = 1.06;
const SEGMENTS = 28;
const LOOK = { seams: 0.3, shadow: 0.35 };
// Paper of the roll lighter than the sheet; light mostly from the left, so the roll reads as round
const PAPER_LIGHT = 0.35;
const LIGHT = { ambient: 0.35, sun: 2.2 };

export function stingerSetup(options: StingerOptions, picture: SheetPicture | null = null): GlSetup {
  const scene = new Scene();
  const camera = new OrthographicCamera(0, WIDTH, HEIGHT, 0, -HEIGHT, HEIGHT);
  const cut = new Plane(new Vector3(-1, 0, 0), 0);
  const print = picture ? new CanvasTexture(picture) : null;
  if (print) print.colorSpace = SRGBColorSpace;
  const sheet = new Mesh(new PlaneGeometry(WIDTH, HEIGHT), new MeshBasicMaterial({ color: print ? new Color(1, 1, 1) : options.blueprint, map: print, clippingPlanes: [cut] }));
  sheet.position.set(WIDTH / 2, HEIGHT / 2, 0);
  scene.add(sheet);

  // The roll: a paper cylinder of unit radius, scaled per frame, with its seams as lines so the turning shows
  const paper = new Color(options.blueprint).lerp(new Color(options.line), PAPER_LIGHT);
  const cylinder = new CylinderGeometry(1, 1, HEIGHT * OVERHANG, SEGMENTS, 1, true);
  const roll = new Mesh(cylinder, new MeshLambertMaterial({ color: paper, side: DoubleSide }));
  roll.add(new LineSegments(new EdgesGeometry(cylinder, 1), new LineBasicMaterial({ color: options.copper, transparent: true, opacity: LOOK.seams })));
  const shadow = new Mesh(new PlaneGeometry(1, HEIGHT), new MeshBasicMaterial({ color: options.shadow, transparent: true, opacity: LOOK.shadow, depthWrite: false }));
  shadow.position.set(0, HEIGHT / 2, 2);
  const sun = new DirectionalLight(options.line, LIGHT.sun);
  sun.position.set(-1, 0.3, 0.6);
  scene.add(roll, shadow, new AmbientLight(options.line, LIGHT.ambient), sun);

  return {
    scene,
    camera,
    update: time => {
      const state = rollAt(time, options);
      const out = state.phase === "out";
      cut.normal.set(out ? -1 : 1, 0, 0);
      cut.constant = out ? state.x : -state.x;
      roll.scale.set(state.radius, 1, state.radius);
      roll.position.set(state.x, HEIGHT / 2, state.radius + 3);
      // Rolling without slipping: the angle follows the way travelled
      roll.rotation.y = -state.x / Math.max(1, state.radius);
      roll.visible = state.x > -state.radius && state.x < WIDTH + state.radius;
      shadow.scale.x = state.radius * 0.6;
      shadow.position.x = state.x + (out ? -1 : 1) * state.radius * 1.3;
      shadow.visible = roll.visible;
    },
    dispose: () => { print?.dispose(); disposeAll(scene); },
  };
}
