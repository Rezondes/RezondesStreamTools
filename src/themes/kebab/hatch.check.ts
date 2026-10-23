// Check for hatch.ts: the strokes of the meat are deterministic per seed, one stroke per row and copy, and the slide
// repeats after one period, so the turning spit has no seam. Runs with npm test.
import assert from "node:assert/strict";
import { hatchOffset, meatHatch } from "./hatch.ts";

// Same seed, same strokes; another seed, other strokes
assert.equal(meatHatch(11, 32, 42), meatHatch(11, 32, 42));
assert.notEqual(meatHatch(11, 32, 42), meatHatch(12, 32, 42));

// Ten copies per row
assert.equal((meatHatch(11, 32, 42).match(/M/g) ?? []).length, 320);
assert.equal((meatHatch(11, 1, 42).match(/M/g) ?? []).length, 10, "one row works too");

// The slide starts at 0, goes left and is the same again after one period (42 units at 18 per second)
assert.equal(hatchOffset(0, 18, 42), -0);
assert.ok(hatchOffset(1, 18, 42) < 0);
assert.ok(Math.abs(hatchOffset(1, 18, 42) - hatchOffset(1 + 42 / 18, 18, 42)) < 1e-9);
assert.equal(hatchOffset(5, 18, 0), 0, "without a period no slide");

console.log("kebab hatch ok");
