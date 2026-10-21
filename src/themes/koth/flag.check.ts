// Check for flag.ts: still at the pole, the wave grows towards the free end, a pure function of the time, no wind no
// wave. Runs with npm test.
import assert from "node:assert/strict";
import { flagOffset } from "./flag.ts";

const SIZE = 2.8;
const times = Array.from({ length: 200 }, (_, index) => index * 0.037);

// At the pole: no offset at any time
for (const time of times) {
  const offset = flagOffset(0, 0.5, time, SIZE, 1);
  assert.equal(Math.abs(offset.depth), 0);
  assert.equal(Math.abs(offset.sag), 0);
}
// The wave grows towards the free end (largest swing over time per distance)
const swing = (along: number) => Math.max(...times.map(time => Math.abs(flagOffset(along, 0.5, time, SIZE, 1).depth)));
assert.ok(swing(0.7) < swing(1.4) && swing(1.4) < swing(SIZE), "grows to the free end");
assert.ok(flagOffset(SIZE, 0, 0, SIZE, 1).sag < flagOffset(1, 0, 0, SIZE, 1).sag, "the free end hangs lower");
// Pure function of the time; it moves over time
assert.deepEqual(flagOffset(2, 0.3, 1.25, SIZE, 1), flagOffset(2, 0.3, 1.25, SIZE, 1));
assert.notDeepEqual(flagOffset(2, 0.3, 1.25, SIZE, 1), flagOffset(2, 0.3, 1.5, SIZE, 1));
// The wind scales the wave; without wind the cloth only hangs
assert.equal(Math.abs(flagOffset(2, 0.3, 1.25, SIZE, 0).depth), 0);
assert.ok(Math.abs(flagOffset(2, 0.3, 1.25, SIZE, 2).depth) > Math.abs(flagOffset(2, 0.3, 1.25, SIZE, 1).depth));

console.log("koth flag ok");
