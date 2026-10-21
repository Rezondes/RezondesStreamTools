// Check for roll.ts of the Dachdecker theme: the blueprint rolls out from the left and covers the picture at the
// transition point, rolls up from the left again and is gone at the end; the roll thins while unrolling and thickens
// while rolling up. Runs with npm test.
import assert from "node:assert/strict";
import { coverage, rollAt } from "./roll.ts";

const timing = { duration: 2.4, cut: 1.2, hold: 0.2, roll: 180 };
assert.equal(coverage(0, timing), 0);
assert.equal(coverage(timing.cut, timing), 1);
assert.equal(coverage(timing.duration, timing), 0);
// Rolling out it grows from the left, rolling up it shrinks from the left
assert.ok(coverage(0.3, timing) < coverage(0.6, timing));
assert.ok(coverage(1.8, timing) > coverage(2.1, timing));
assert.equal(rollAt(0.4, timing).phase, "out");
assert.equal(rollAt(1.9, timing).phase, "up");
assert.ok(rollAt(0.3, timing).x < rollAt(0.6, timing).x && rollAt(1.8, timing).x < rollAt(2.1, timing).x);
assert.ok(rollAt(0.2, timing).radius > rollAt(0.7, timing).radius);
assert.ok(rollAt(1.7, timing).radius < rollAt(2.2, timing).radius);

console.log("dachdecker roll ok");
