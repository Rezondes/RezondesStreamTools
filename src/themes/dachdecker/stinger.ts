// Stinger of the Dachdecker theme (DESIGN-DACHDECKER.md "Stinger"): a blueprint rolls out from left to right, covers the
// picture at the transition point, holds briefly and is rolled up again from left to right. The roll is a shaded paper
// cylinder that turns as it travels and gets thinner while it unrolls (thicker while it rolls up); the sheet behind it
// is cut at the roll with a clipping plane. A Vanilla-Three.js scene for glClip, every part a pure function of the time.
// Check: stinger.check.ts.
import {
  AmbientLight, BufferGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, OrthographicCamera, Plane, PlaneGeometry, Scene, Vector3,
} from "three";
import type { GlSetup } from "../../core/three/glClip.ts";
import { disposeAll } from "./clipParts.ts";
import { rollAt, type RollTiming, STINGER_SIZE } from "./roll.ts";

const WIDTH = STINGER_SIZE.width;
const HEIGHT = STINGER_SIZE.height;

export type StingerOptions = RollTiming & { grid: number; blueprint: string; line: string; accent: string; copper: string; shadow: string };

// The paper of the roll overlaps the picture top and bottom
const OVERHANG = 1.06;
const SEGMENTS = 28;
const MAJOR = 5;
const LINES = { minor: 0.1, major: 0.22, drawing: 0.85, roll: 0.3, shadow: 0.35 };
// Paper of the roll lighter than the sheet; light mostly from the left, so the roll reads as round
const PAPER_LIGHT = 0.35;
const LIGHT = { ambient: 0.35, sun: 2.2 };

const lines = (points: number[], color: string, opacity: number, clip: Plane[]) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color, transparent: opacity < 1, opacity, clippingPlanes: clip }));
};
const segment = (points: number[], from: readonly [number, number], to: readonly [number, number]) => points.push(from[0], from[1], 1, to[0], to[1], 1);
const rect = (points: number[], x: number, y: number, wide: number, high: number) => {
  segment(points, [x, y], [x + wide, y]);
  segment(points, [x + wide, y], [x + wide, y + high]);
  segment(points, [x + wide, y + high], [x, y + high]);
  segment(points, [x, y + high], [x, y]);
};

// The drawing on the sheet: grid, border with title block, house elevation with roof truss and a dimension line
function sheetLines(options: StingerOptions, clip: Plane[]) {
  const minor: number[] = [];
  const major: number[] = [];
  for (let index = 0; index * options.grid <= WIDTH; index++) segment(index % MAJOR ? minor : major, [index * options.grid, 0], [index * options.grid, HEIGHT]);
  for (let index = 0; index * options.grid <= HEIGHT; index++) segment(index % MAJOR ? minor : major, [0, index * options.grid], [WIDTH, index * options.grid]);
  const plan: number[] = [];
  const margin = HEIGHT * 0.05;
  rect(plan, margin, margin, WIDTH - 2 * margin, HEIGHT - 2 * margin);
  const block = { w: WIDTH * 0.22, h: HEIGHT * 0.12 };
  rect(plan, WIDTH - margin - block.w, margin, block.w, block.h);
  segment(plan, [WIDTH - margin - block.w, margin + block.h / 2], [WIDTH - margin, margin + block.h / 2]);
  segment(plan, [WIDTH - margin - block.w / 2, margin], [WIDTH - margin - block.w / 2, margin + block.h / 2]);
  // House: walls, roof truss with king post, collar tie and struts, dimension line under it
  const house = { x: WIDTH / 2, base: HEIGHT * 0.2, span: WIDTH * 0.36, wall: HEIGHT * 0.2, rise: HEIGHT * 0.2 };
  const [left, right] = [house.x - house.span / 2, house.x + house.span / 2];
  const eave = house.base + house.wall;
  const top = eave + house.rise;
  rect(plan, left, house.base, house.span, house.wall);
  segment(plan, [house.x, eave], [house.x, top]);
  segment(plan, [house.x - house.span / 4, eave + house.rise / 2], [house.x + house.span / 4, eave + house.rise / 2]);
  segment(plan, [house.x - house.span / 4, eave], [house.x, eave + house.rise / 2]);
  segment(plan, [house.x + house.span / 4, eave], [house.x, eave + house.rise / 2]);
  const dim = house.base - HEIGHT * 0.05;
  const tick = HEIGHT * 0.015;
  segment(plan, [left, dim], [right, dim]);
  for (const end of [left, right]) {
    segment(plan, [end, dim - tick], [end, dim + tick]);
    segment(plan, [end - tick, dim - tick], [end + tick, dim + tick]);
  }
  const roof: number[] = [];
  const over = house.span * 0.06;
  const drop = over * (house.rise / (house.span / 2));
  segment(roof, [left - over, eave - drop], [house.x, top]);
  segment(roof, [house.x, top], [right + over, eave - drop]);
  segment(roof, [left, eave], [right, eave]);
  return [
    lines(minor, options.line, LINES.minor, clip), lines(major, options.line, LINES.major, clip),
    lines(plan, options.line, LINES.drawing, clip), lines(roof, options.accent, 1, clip),
  ];
}

export function stingerSetup(options: StingerOptions): GlSetup {
  const scene = new Scene();
  const camera = new OrthographicCamera(0, WIDTH, HEIGHT, 0, -HEIGHT, HEIGHT);
  const cut = new Plane(new Vector3(-1, 0, 0), 0);
  const clip = [cut];
  const sheet = new Mesh(new PlaneGeometry(WIDTH, HEIGHT), new MeshBasicMaterial({ color: options.blueprint, clippingPlanes: clip }));
  sheet.position.set(WIDTH / 2, HEIGHT / 2, 0);
  scene.add(sheet, ...sheetLines(options, clip));

  // The roll: a paper cylinder of unit radius, scaled per frame, with its seams as lines so the turning shows
  const paper = new Color(options.blueprint).lerp(new Color(options.line), PAPER_LIGHT);
  const cylinder = new CylinderGeometry(1, 1, HEIGHT * OVERHANG, SEGMENTS, 1, true);
  const roll = new Mesh(cylinder, new MeshLambertMaterial({ color: paper, side: DoubleSide }));
  roll.add(new LineSegments(new EdgesGeometry(cylinder, 1), new LineBasicMaterial({ color: options.copper, transparent: true, opacity: LINES.roll })));
  const shadow = new Mesh(new PlaneGeometry(1, HEIGHT), new MeshBasicMaterial({ color: options.shadow, transparent: true, opacity: LINES.shadow, depthWrite: false }));
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
    dispose: () => disposeAll(scene),
  };
}
