// Check of particles.ts: the hearts burst after their start, rise and spread over the upper half circle, are gone after
// their flight, and are the same at the same time. Run: node src/themes/dogs/particles.check.ts
import assert from "node:assert/strict";
import { heartsAt } from "./particles.ts";

const origin = [100, 100] as const;
assert.deepEqual(heartsAt(4.9, 5, 7, origin), [], "none before the start");
assert.deepEqual(heartsAt(7, 5, 7, origin), [], "none after the flight");
const flying = heartsAt(5.6, 5, 7, origin);
assert.equal(flying.length, 7);
assert.ok(flying.every(([, y]) => y < origin[1]), "above the head");
assert.ok(flying[0][0] < origin[0] && flying[6][0] > origin[0] - 6, "spread from left to right");
assert.deepEqual(heartsAt(5.6, 5, 7, origin), flying);
assert.equal(heartsAt(5.6, 5, 0, origin).length, 0);
assert.ok(heartsAt(6.15, 5, 7, origin).length < 7, "some blink out at the end");

console.log("dogs particles ok");
