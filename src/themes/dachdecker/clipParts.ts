// Vanilla Three.js parts of the Dachdecker clips (stinger, banners): the roof frame, the covered roof with its ridge and
// the house walls as plain objects, from the same data as the scenes (frame.ts, tiles.ts, house.ts), plus a sky plane
// with a color fade. Clips render outside React, so they build these themselves. Check: clipParts.check.ts.
import {
  BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry, EdgesGeometry, Euler, Group, InstancedMesh, LineBasicMaterial,
  LineSegments, type Material, Matrix4, Mesh, MeshBasicMaterial, MeshPhongMaterial, type Object3D, Object3D as Pivot, PlaneGeometry, Quaternion, Vector3,
} from "three";
import { mergedEdges } from "../../core/three/edges.ts";
import { type FrameDims, roofFrame } from "./frame.ts";
import type { House } from "./house.ts";
import { type Ridge, TILE, type Tile } from "./tiles.ts";

export type ClipColors = { accent: string; line: string; muted: string; slate: string; copper: string; brick: string; card: string; slateDark: string };

const HEIGHT = 2.2;
const FRONT_FILL = 0.22;
const FAINT = 0.72;
const TILE_EDGE = 0.55;
const WALL_OPACITY = 0.55;
const POST = [0.14, 0.31] as const;
const RIDGE = { radius: 0.16, sides: 16 };
// Copper of the tiles warmed with brick and darkened (like the scenes)
const COPPER_WARM = 0.5;
const COPPER_DARK = 0.75;
const SHINE = { slate: 40, copper: 90 };

const boxed = (geometry: BufferGeometry, fill: MeshBasicMaterial | MeshPhongMaterial, edge: LineBasicMaterial) => {
  const group = new Group();
  group.add(new Mesh(geometry, fill), new LineSegments(new EdgesGeometry(geometry), edge));
  return group;
};

export function frameObject(dims: FrameDims, colors: ClipColors, lineOpacity: number, fillOpacity: number): Group {
  const front = { edge: new LineBasicMaterial({ color: colors.accent }), fill: new MeshBasicMaterial({ color: colors.accent, transparent: true, opacity: FRONT_FILL, depthWrite: false }) };
  const main = { edge: new LineBasicMaterial({ color: colors.line, transparent: true, opacity: lineOpacity }), fill: new MeshBasicMaterial({ color: colors.muted, transparent: true, opacity: fillOpacity, depthWrite: false }) };
  const faint = { edge: new LineBasicMaterial({ color: colors.line, transparent: true, opacity: lineOpacity * FAINT }), fill: main.fill };
  const frame = new Group();
  const pivot = new Pivot();
  for (const beam of roofFrame(dims)) {
    const length = Math.hypot(beam.to[0] - beam.from[0], beam.to[1] - beam.from[1], beam.to[2] - beam.from[2]);
    const box = new BoxGeometry(beam.size, beam.size * HEIGHT, length);
    box.translate(0, 0, length / 2);
    const look = beam.kind === "front" ? front : beam.kind === "plate" || beam.kind === "batten" ? faint : main;
    const part = boxed(box, look.fill, look.edge);
    pivot.position.set(...beam.from);
    pivot.lookAt(...beam.to);
    part.position.copy(pivot.position);
    part.quaternion.copy(pivot.quaternion);
    frame.add(part);
  }
  return frame;
}

export function tilesObject(tiles: readonly Tile[], colors: ClipColors, ridge: Ridge | null): Group {
  const metal = new Color(colors.copper).lerp(new Color(colors.brick), COPPER_WARM).multiplyScalar(COPPER_DARK);
  const looks = {
    slate: new MeshPhongMaterial({ color: colors.slate, shininess: SHINE.slate }),
    copper: new MeshPhongMaterial({ color: metal, shininess: SHINE.copper, specular: new Color(colors.copper) }),
  };
  const box = new BoxGeometry(TILE.width, TILE.height, TILE.depth);
  const matrices = tiles.map(tile => new Matrix4().compose(new Vector3(...tile.position), new Quaternion().setFromEuler(new Euler(...tile.rotation)), new Vector3(1, 1, 1)));
  const group = new Group();
  for (const kind of ["slate", "copper"] as const) {
    const chosen = matrices.filter((_, index) => (tiles[index].copper ? "copper" : "slate") === kind);
    const mesh = new InstancedMesh(box, looks[kind], chosen.length);
    chosen.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  const lines = new BufferGeometry();
  lines.setAttribute("position", new BufferAttribute(mergedEdges(matrices, box), 3));
  group.add(new LineSegments(lines, new LineBasicMaterial({ color: colors.muted, transparent: true, opacity: TILE_EDGE })));
  if (ridge) {
    const pipe = new Mesh(new CylinderGeometry(RIDGE.radius, RIDGE.radius, ridge.length, RIDGE.sides), looks.copper);
    pipe.position.set(...ridge.center);
    pipe.rotation.x = Math.PI / 2;
    group.add(pipe);
  }
  return group;
}

// Walls, posts, lit windows and door, chimney
export function houseObject(home: House, colors: ClipColors, lineOpacity: number): Group {
  const edge = new LineBasicMaterial({ color: colors.line, transparent: true, opacity: lineOpacity });
  const wall = new MeshPhongMaterial({ color: colors.card, transparent: true, opacity: WALL_OPACITY, depthWrite: false });
  const glow = new MeshBasicMaterial({ color: colors.accent });
  const group = new Group();
  const place = (part: Object3D, at: readonly [number, number, number]) => { part.position.set(...at); group.add(part); return part; };
  place(boxed(new BoxGeometry(...home.wall.size), wall, edge), home.wall.center);
  place(boxed(new BoxGeometry(...home.chimney.size), new MeshPhongMaterial({ color: colors.slateDark }), edge), home.chimney.center);
  for (const post of home.posts) place(boxed(new BoxGeometry(POST[0], post.to[1] - post.from[1], POST[1]), wall, edge), [post.from[0], (post.from[1] + post.to[1]) / 2, post.from[2]]);
  for (const pane of [...home.windows, home.door]) place(boxed(new PlaneGeometry(pane.size[0], pane.size[1]), glow, edge), pane.center);
  return group;
}

// A large plane behind the scene, top color above and glow below (vertex colors, no texture)
export function skyPlane(top: string, glow: string, size: number, distance: number): Mesh {
  const plane = new PlaneGeometry(size, size);
  const [above, below] = [new Color(top), new Color(glow)];
  const position = plane.getAttribute("position");
  const tones = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index++) {
    const color = position.getY(index) > 0 ? above : below;
    tones.set([color.r, color.g, color.b], index * 3);
  }
  plane.setAttribute("color", new BufferAttribute(tones, 3));
  const sky = new Mesh(plane, new MeshBasicMaterial({ vertexColors: true, depthWrite: false, fog: false }));
  sky.position.z = -distance;
  return sky;
}

// Frees every geometry and material below object
export function disposeAll(object: Object3D) {
  object.traverse(child => {
    if (!(child instanceof Mesh || child instanceof LineSegments)) return;
    const shape: { geometry: BufferGeometry; material: Material | Material[] } = child;
    shape.geometry.dispose();
    for (const material of [shape.material].flat()) material.dispose();
  });
}
