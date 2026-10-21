// Check for shore.ts: the sand lies below the sea level toward the sea and above it toward the camera, it is wet at the
// water and dry up the beach, every surf band runs up periodically and fades. Runs with npm test.
import assert from "node:assert/strict";
import { SHORE, shoreHeight, surfBand, wetness } from "./shore.ts";

// Ufer und Brandung: under water toward the sea, above it toward the camera, all across the view
for (let x = -60; x <= 60; x += 5) {
  assert.ok(shoreHeight(x, SHORE - 6) < 0, `sea at ${x}`);
  assert.ok(shoreHeight(x, SHORE + 12) > 0, `beach at ${x}`);
}
assert.equal(wetness(0), 1);
assert.equal(wetness(1), 0);

// A band starts in the water invisible, runs up, is strongest halfway and fades; after a period it is back
const period = 7;
const start = surfBand(0, 3, 0, period);
assert.ok(start.opacity < 1e-9 && shoreHeight(0, start.z) < 0);
const halfway = surfBand(0, 3, period / 2, period);
assert.ok(halfway.opacity > 0.99 && halfway.z > start.z && halfway.stretch > start.stretch);
assert.ok(surfBand(0, 3, period * 0.99, period).opacity < 0.05);
assert.ok(Math.abs(surfBand(1, 3, 2, period).share - surfBand(1, 3, 2 + period, period).share) < 1e-9);
// The bands run out of step
assert.notEqual(surfBand(0, 3, 1, period).z, surfBand(1, 3, 1, period).z);

console.log("urlaub shore ok");
