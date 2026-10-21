// Stinger of the Dachdecker theme (DESIGN-DACHDECKER.md "Stinger"): slate and copper tiles flip into the picture row by
// row from the bottom up, at the transition point they cover it completely, a shine runs across, then they flip away
// from the top down. A Vanilla-Three.js scene for glClip; the angle of every tile is a pure function of the time. Check:
// stinger.check.ts.
import { AdditiveBlending, Color, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene } from "three";
import type { GlSetup } from "../../core/three/glClip.ts";
import { chance } from "../../core/three/chance.ts";
import { disposeAll } from "./clipParts.ts";

import { STINGER_SIZE } from "./render.ts";

const WIDTH = STINGER_SIZE.width;
const HEIGHT = STINGER_SIZE.height;

// Of its half (in or out) a row waits up to 60 % and then flips in the remaining 40 %
const WAIT = 0.6;
const FLIP = 0.4;
const QUARTER = Math.PI / 2;
const outCubic = (part: number) => 1 - (1 - part) ** 3;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Angle of the tiles of a row (0 = bottom row): a quarter turn before they flip in, 0 when flat, then the other way out.
// Lower rows flip in earlier and out later.
export function tileAngle(row: number, rows: number, time: number, duration: number, cut: number): number {
  const share = rows > 1 ? row / (rows - 1) : 0;
  if (time <= cut) {
    const start = share * WAIT * cut;
    return QUARTER * (1 - outCubic(clamp01((time - start) / (FLIP * cut))));
  }
  const rest = duration - cut;
  const start = cut + (1 - share) * WAIT * rest;
  return -QUARTER * outCubic(clamp01((time - start) / (FLIP * rest)));
}

export type StingerOptions = {
  duration: number; cut: number; rows: number; shine: boolean; copperShare: number; seed: number;
  slate: string; copper: string; brick: string; line: string;
};

// The shine is a bright band that crosses the picture around the transition point
const SHINE = { width: 0.25, opacity: 0.18, before: 0.35, after: 0.25 };
const EDGE_OPACITY = 0.5;
const OVERLAP = 1.02;

export function stingerSetup(options: StingerOptions): GlSetup {
  const scene = new Scene();
  const camera = new OrthographicCamera(0, WIDTH, HEIGHT, 0, -HEIGHT, HEIGHT);
  const size = HEIGHT / options.rows;
  // One more column, so the offset rows reach the right edge too
  const columns = Math.ceil(WIDTH / size) + 1;
  const random = chance(options.seed);
  const metal = new Color(options.copper).lerp(new Color(options.brick), 0.5);
  const looks = { slate: new MeshBasicMaterial({ color: options.slate }), copper: new MeshBasicMaterial({ color: metal }) };
  const edge = new LineBasicMaterial({ color: options.line, transparent: true, opacity: EDGE_OPACITY });
  const plane = new PlaneGeometry(size, size * OVERLAP);
  plane.translate(0, (size * OVERLAP) / 2, 0);
  const rows = Array.from({ length: options.rows }, (_, row) => {
    const group = new Group();
    for (let column = 0; column < columns; column++) {
      const tile = new Group();
      tile.add(new Mesh(plane, random.next() < options.copperShare ? looks.copper : looks.slate), new LineSegments(new EdgesGeometry(plane), edge));
      tile.position.set(column * size + size / 2 - (row % 2) * (size / 2), row * size, 0);
      group.add(tile);
    }
    scene.add(group);
    return group;
  });
  const band = new Mesh(new PlaneGeometry(WIDTH * SHINE.width, HEIGHT * 2), new MeshBasicMaterial({ color: options.line, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
  band.rotation.z = -0.4;
  band.position.y = HEIGHT / 2;
  band.position.z = 1;
  scene.add(band);
  return {
    scene,
    camera,
    update: time => {
      rows.forEach((group, row) => group.children.forEach(tile => { tile.rotation.x = tileAngle(row, options.rows, time, options.duration, options.cut); }));
      const from = options.cut * (1 - SHINE.before);
      const part = (time - from) / (options.cut * SHINE.before + (options.duration - options.cut) * SHINE.after);
      band.visible = options.shine && part >= 0 && part <= 1;
      band.position.x = -WIDTH * SHINE.width + part * WIDTH * (1 + 2 * SHINE.width);
      band.material.opacity = SHINE.opacity;
    },
    dispose: () => disposeAll(scene),
  };
}
