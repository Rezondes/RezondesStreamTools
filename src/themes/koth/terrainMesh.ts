// Ground mesh of the KOTH world for the scenes (Terrain.tsx) and the 3D banners: the plane of terrain.ts lifted by
// hillHeight, sand at the foot turning olive towards the top with darker patches from the seed. Check:
// terrainMesh.check.ts.
import { Color, Float32BufferAttribute, PlaneGeometry } from "three";
import { hash } from "../../core/hash.ts";
import { hillHeight, WORLD_SEGMENTS, WORLD_SIZE } from "./terrain.ts";

export type GroundColors = { sand: string; hill: string; shade: string };

// fixed: where sand turns olive (m above the plain) and how strong the dark patches are on the hill and the plain
const OLIVE_FROM = 0.4;
const OLIVE_SPAN = 2.4;
const PATCHES = { hill: 0.35, plain: 0.08, from: 1 };

export function groundGeometry(height: number, seed: number, colors: GroundColors): PlaneGeometry {
  const plane = new PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_SEGMENTS, WORLD_SEGMENTS);
  plane.rotateX(-Math.PI / 2);
  const position = plane.attributes.position;
  const [sand, hill, shade] = [colors.sand, colors.hill, colors.shade].map(color => new Color(color));
  const tints: number[] = [];
  for (let index = 0; index < position.count; index++) {
    const y = hillHeight(position.getX(index), position.getZ(index), height);
    position.setY(index, y);
    const olive = Math.min(1, Math.max(0, (y - OLIVE_FROM) / OLIVE_SPAN));
    const patch = hash(seed * 13 + index) * (y > PATCHES.from ? PATCHES.hill : PATCHES.plain);
    const tint = sand.clone().lerp(hill, olive).lerp(shade, patch);
    tints.push(tint.r, tint.g, tint.b);
  }
  plane.setAttribute("color", new Float32BufferAttribute(tints, 3));
  plane.computeVertexNormals();
  return plane;
}
