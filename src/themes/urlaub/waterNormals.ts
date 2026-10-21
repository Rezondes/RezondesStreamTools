// The normal map of the realistic Urlaub sea (PLAN-URLAUB.md package 5): a height field summed from waves with whole
// number frequencies over the tile, so the tile repeats without a seam, turned into normals (RGBA bytes) for the Water
// shader of three.js. No picture file needed. Check: waterNormals.check.ts.
import { hash } from "../../core/hash.ts";

// fixed: how many waves, their largest frequency per tile, how flat the normals are
const WAVES = 14;
const MAX_FREQUENCY = 8;
const FLAT = 2.2;

export type Wave = { fx: number; fy: number; amplitude: number; phase: number };

export function waves(seed: number): Wave[] {
  const random = (index: number, salt: number) => hash(seed * 7919 + index * 5 + salt);
  return Array.from({ length: WAVES }, (_, index) => ({
    fx: Math.round((random(index, 0) - 0.5) * 2 * MAX_FREQUENCY),
    fy: Math.round((random(index, 1) - 0.5) * 2 * MAX_FREQUENCY),
    amplitude: 0.4 + random(index, 2),
    phase: random(index, 3) * Math.PI * 2,
  }));
}

export function heightAt(list: readonly Wave[], x: number, y: number, size: number): number {
  return list.reduce((sum, wave) => sum + wave.amplitude * Math.sin(((wave.fx * x + wave.fy * y) * 2 * Math.PI) / size + wave.phase), 0);
}

// The normal at (x, y) from the slope of the height field, as a unit vector
export function normalAt(list: readonly Wave[], x: number, y: number, size: number): [number, number, number] {
  const dx = heightAt(list, x + 1, y, size) - heightAt(list, x - 1, y, size);
  const dy = heightAt(list, x, y + 1, size) - heightAt(list, x, y - 1, size);
  const length = Math.hypot(dx, dy, FLAT);
  return [-dx / length, -dy / length, FLAT / length];
}

// The tile as RGBA bytes, size x size
export function waterNormals(size: number, seed: number): Uint8ClampedArray {
  const list = waves(seed);
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const normal = normalAt(list, x, y, size);
      const index = (y * size + x) * 4;
      for (let axis = 0; axis < 3; axis++) data[index + axis] = (normal[axis] * 0.5 + 0.5) * 255;
      data[index + 3] = 255;
    }
  }
  return data;
}
