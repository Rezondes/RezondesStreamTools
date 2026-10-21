// Check for waterNormals.ts: the normal tile repeats without a seam (the first and the last column and row fit
// together), the same seed gives the same tile, the normals point up. Runs with npm test.
import assert from "node:assert/strict";
import { heightAt, normalAt, waterNormals, waves } from "./waterNormals.ts";

const size = 32;
const list = waves(12);

// Kachelbar: the height field repeats over the tile, so the normal past the last column is the one of the first
for (let index = 0; index < size; index += 7) {
  assert.ok(Math.abs(heightAt(list, index, 0, size) - heightAt(list, index + size, 0, size)) < 1e-9);
  assert.ok(Math.abs(heightAt(list, 0, index, size) - heightAt(list, 0, index + size, size)) < 1e-9);
  const [first, past] = [normalAt(list, 0, index, size), normalAt(list, size, index, size)];
  first.forEach((value, axis) => assert.ok(Math.abs(value - past[axis]) < 1e-9));
}
assert.ok(list.every(wave => Number.isInteger(wave.fx) && Number.isInteger(wave.fy)));

// Deterministic, upward normals (blue above the middle), full alpha
const tile = waterNormals(size, 12);
assert.deepEqual(tile, waterNormals(size, 12));
assert.notDeepEqual(tile, waterNormals(size, 13));
assert.equal(tile.length, size * size * 4);
for (let index = 0; index < tile.length; index += 4) {
  assert.ok(tile[index + 2] > 128 && tile[index + 3] === 255);
}

console.log("urlaub waterNormals ok");
