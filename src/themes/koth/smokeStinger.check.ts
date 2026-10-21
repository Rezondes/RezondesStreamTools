// Check for smokeStinger.ts: covered at the transition point and less before and after, the grenade rolls in and pops,
// the puffs follow time and seed, the flag changes at the cut. Runs with npm test.
import assert from "node:assert/strict";
import { flagSide, grenadeAt, popAt, smokeCover, smokePuffs } from "./smokeStinger.ts";

const timing = { duration: 1.6, cut: 0.8 };
// Covered at the cut, less before and after, nothing at the ends
assert.equal(smokeCover(timing.cut, timing), 1);
assert.equal(smokeCover(0, timing), 0);
assert.equal(smokeCover(timing.duration, timing), 0);
assert.ok(smokeCover(0.5, timing) > 0 && smokeCover(0.5, timing) < 1);
assert.ok(smokeCover(1.2, timing) > 0 && smokeCover(1.2, timing) < 1);

// The grenade rolls to the middle and is gone after the pop
assert.ok(grenadeAt(0, timing).x < grenadeAt(0.1, timing).x);
assert.equal(grenadeAt(popAt(timing) - 1e-6, timing).visible, true);
assert.equal(grenadeAt(popAt(timing), timing).visible, false);
assert.ok(Math.abs(grenadeAt(popAt(timing), timing).x) < 1e-9);

// Puffs: invisible before the pop, full at the cut, same time and seed same cloud, another seed another cloud
const count = 30;
assert.ok(smokePuffs(4, count, 0.1, timing).every(puff => puff.opacity === 0));
const atCut = smokePuffs(4, count, timing.cut, timing);
assert.equal(atCut.length, count);
assert.ok(atCut.every(puff => puff.opacity === 1 && puff.y >= 0));
assert.deepEqual(smokePuffs(4, count, 0.6, timing), smokePuffs(4, count, 0.6, timing));
assert.notDeepEqual(smokePuffs(5, count, 0.6, timing), smokePuffs(4, count, 0.6, timing));
assert.ok(atCut[0].scale > smokePuffs(4, count, 0.3, timing)[0].scale, "grows with the cover");

// Flag: first faction before the cut, second from the cut on
assert.equal(flagSide(0.79, timing.cut), 0);
assert.equal(flagSide(0.8, timing.cut), 1);

console.log("koth smokeStinger ok");
