// Check for chance.ts: the stream repeats for the same seed, stays in range and picks by weight. Runs with npm test.
import assert from "node:assert/strict";
import { between, chance, weighted } from "./chance.ts";

// The same seed gives the same stream, another seed another one
const first = chance(5);
const again = chance(5);
const values = Array.from({ length: 50 }, () => first());
assert.deepEqual(Array.from({ length: 50 }, () => again()), values);
assert.notDeepEqual(Array.from({ length: 50 }, chance(6)), values);
assert.ok(values.every(value => value >= 0 && value < 1));

// between stays inside its limits
const random = chance(9);
assert.ok(Array.from({ length: 200 }, () => between(random, -3, 4)).every(value => value >= -3 && value < 4));

// weighted never picks an entry without weight and picks the heavy one most often
const picks = Array.from({ length: 400 }, () => weighted(random, [["never", 0], ["rare", 1], ["often", 9]] as const));
assert.ok(!picks.includes("never"));
assert.ok(picks.filter(pick => pick === "often").length > picks.filter(pick => pick === "rare").length * 4);
// Without any weight the last entry is the fallback
assert.equal(weighted(random, [["a", 0], ["b", 0]] as const), "b");

console.log("chaos chance ok");
