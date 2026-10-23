// Check for intro.ts: the entrance keeps the order of the prototype and scales with the speed. Runs with npm test.
import assert from "node:assert/strict";
import { introAt } from "./intro.ts";

const normal = introAt(1);
assert.equal(normal.letters, 0.6);
assert.equal(normal.bon, 2.8);
assert.ok(normal.lights < normal.letters && normal.letters < normal.body && normal.body < normal.arm && normal.arm < normal.idle && normal.idle < normal.shavings);

// Twice as fast, half the time; a speed of 0 falls back to normal
assert.equal(introAt(2).shavings, 1.6);
assert.deepEqual(introAt(0), normal);

console.log("kebab intro ok");
