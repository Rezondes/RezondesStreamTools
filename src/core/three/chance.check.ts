// Check for chance.ts: same seed, same sequence in 0 to below 1; another seed, another sequence. Runs with npm test.
import assert from "node:assert/strict";
import { chance } from "./chance.ts";

const take = (seed: number, count: number) => { const random = chance(seed); return Array.from({ length: count }, random.next); };

assert.deepEqual(take(7, 50), take(7, 50));
assert.notDeepEqual(take(7, 50), take(8, 50));
assert.ok(take(3, 1000).every(value => value >= 0 && value < 1));
// The values spread over the range (no constant sequence)
assert.ok(new Set(take(3, 100).map(value => Math.floor(value * 10))).size >= 8);

const range = chance(1);
for (let count = 0; count < 100; count++) {
  const value = range.between(-2, 5);
  assert.ok(value >= -2 && value < 5);
}

console.log("chance ok");
