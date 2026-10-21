// Check for drift.ts of the Plantage theme: leaves and motes follow from seed, index and time alone and repeat after
// their period. Runs with npm test.
import assert from "node:assert/strict";
import { leafAt, leafPeriod, moteAt, MOTE_PERIOD } from "./drift.ts";

const close = (first: Record<string, number>, second: Record<string, number>) =>
  Object.keys(first).every(key => Math.abs(first[key] - second[key]) < 1e-6);

// aus der Zeit: the same input gives the same place, after one period the same again
for (let index = 0; index < 20; index++) {
  assert.deepEqual(leafAt(42, index, 3.7), leafAt(42, index, 3.7));
  assert.ok(close(leafAt(42, index, 3.7), leafAt(42, index, 3.7 + leafPeriod(42, index))), `leaf ${index} repeats`);
  assert.ok(close(moteAt(42, index, 5), moteAt(42, index, 5 + MOTE_PERIOD)), `mote ${index} repeats`);
  const leaf = leafAt(42, index, 12);
  assert.ok(leaf.y >= -40 && leaf.y <= 1120);
  const mote = moteAt(42, index, 12);
  assert.ok(mote.alpha >= 0 && mote.alpha <= 0.6 && mote.size > 0);
}
assert.notDeepEqual(leafAt(42, 0, 1), leafAt(7, 0, 1));
assert.ok(leafAt(42, 0, -5).y >= -40, "negative times stay inside the fall");

console.log("plantage drift ok");
