// Check for quality.ts: performance levels, bloom limit and particle counts. Runs with npm test.
import assert from "node:assert/strict";
import { clampBloom, MAX_BLOOM, particleCount, quality, QUALITIES } from "./quality.ts";

assert.deepEqual(QUALITIES, ["hoch", "mittel", "niedrig"]);
assert.deepEqual(quality("niedrig"), { pixelRatio: 0.75, bloom: false, antialias: false, shadows: false, particles: 0.4 });
assert.deepEqual(quality("mittel"), { pixelRatio: 1, bloom: true, antialias: false, shadows: true, particles: 0.7 });
assert.deepEqual(quality("hoch"), { pixelRatio: 1, bloom: true, antialias: true, shadows: true, particles: 1 });
assert.deepEqual(quality("ultra"), quality("mittel"));

assert.equal(clampBloom(5), MAX_BLOOM);
assert.equal(clampBloom(-1), 0);
assert.equal(clampBloom(0.4), 0.4);

assert.equal(particleCount(2600, "hoch"), 2600);
assert.equal(particleCount(2600, "niedrig"), 1040);
assert.equal(particleCount(1, "niedrig"), 1);

console.log("quality ok");
