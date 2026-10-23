// Check for shutter.ts: the shutter is up before its start, down after its duration, never beyond; slats from the
// bottom up. Runs with npm test.
import assert from "node:assert/strict";
import { shutterAt, shutterSlats } from "./shutter.ts";

assert.equal(shutterAt(0, 1, 1600), 0);
assert.equal(shutterAt(1, 1, 1600), 0);
assert.equal(shutterAt(2.6, 1, 1600), 1);
assert.equal(shutterAt(30, 1, 1600), 1, "never beyond the bottom");
const middle = shutterAt(1.8, 1, 1600);
assert.ok(middle > 0.5 && middle < 1, "eases out: more than half the way at half the time");
assert.equal(shutterAt(0.5, 1, 0), 0);
assert.equal(shutterAt(1, 1, 0), 1, "without duration at once");

assert.deepEqual(shutterSlats(100, 30), [70, 40, 10]);
assert.deepEqual(shutterSlats(100, 0), []);

console.log("kebab shutter ok");
