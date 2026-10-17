// Check for easing.ts: clamping and curves between 0 and 1. Runs with npm test.
import assert from "node:assert/strict";
import { clamp01, easeIn, easeInOut } from "./easing.ts";

assert.deepEqual([clamp01(-1), clamp01(0.4), clamp01(2)], [0, 0.4, 1]);
// Curves start at 0 and end at 1; easeInOut is at 0.5 in the middle
assert.deepEqual([easeIn(0), easeIn(0.5), easeIn(1)], [0, 0.25, 1]);
assert.deepEqual([easeInOut(0), easeInOut(0.5), easeInOut(1)], [0, 0.5, 1]);
assert.ok(easeInOut(0.25) < 0.25 && easeInOut(0.75) > 0.75);

console.log("easing ok");
