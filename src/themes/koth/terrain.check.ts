// Check for terrain.ts: the hill is highest at the summit and near 0 at the edge of the world, same input same height,
// and the ring of far mountains follows its seed. Runs with npm test.
import assert from "node:assert/strict";
import { hillHeight, mountainRing, WORLD_SIZE } from "./terrain.ts";

const HEIGHT = 7.2;
assert.equal(hillHeight(0, 0, HEIGHT), HEIGHT);
// Hill: no point of a fine grid is higher than the summit
const half = WORLD_SIZE / 2;
for (let x = -half; x <= half; x += 0.5) {
  for (let depth = -half; depth <= half; depth += 0.5) assert.ok(hillHeight(x, depth, HEIGHT) <= HEIGHT + 1e-9, `higher than the summit at ${x}, ${depth}`);
}
// Near 0 at the edge: only the small dunes remain
for (const [x, depth] of [[half, 0], [0, -half], [half, half], [-half, 30]]) assert.ok(Math.abs(hillHeight(x, depth, HEIGHT)) < 1, `edge at ${x}, ${depth}`);
// The height setting scales the hill, the dunes stay
assert.equal(hillHeight(0, 0, 3), 3);
assert.ok(hillHeight(2, 1, 10) > hillHeight(2, 1, 5));
// Same input, same height
assert.equal(hillHeight(12.3, -4.5, HEIGHT), hillHeight(12.3, -4.5, HEIGHT));

// Mountains: a ring far outside the world, same seed same ring, another seed another ring
const ring = mountainRing(301);
assert.equal(ring.length, 16);
assert.ok(ring.every(mountain => {
  const distance = Math.hypot(mountain.x, mountain.z);
  return distance >= 170 && distance <= 195 && mountain.height >= 9 && mountain.height <= 18;
}));
assert.deepEqual(mountainRing(301), ring);
assert.notDeepEqual(mountainRing(302), ring);

console.log("koth terrain ok");
