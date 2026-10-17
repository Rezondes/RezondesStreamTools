// Check for hash.ts: same values as the former function of the matrix stinger, all in [0, 1), seedOf stable.
// Runs with npm test (alone: node src/core/hash.check.ts).
import assert from "node:assert/strict";
import { hash, seedOf } from "./hash.ts";

// Values of the former implementation (src/themes/matrix/stinger.ts), so the matrix renderers stay the same
assert.deepEqual([0, 1, 2, 42, 1337].map(hash), [0.11478774505667388, 0.24678996880538762, 0.02330568921752274, 0.6052086122799665, 0.5768978667911142]);
for (let seed = -50; seed < 50; seed++) assert.ok(hash(seed) >= 0 && hash(seed) < 1, String(seed));

// Same text, same seed; other texts mostly others
assert.equal(seedOf("neo_42"), seedOf("neo_42"));
assert.notEqual(seedOf("neo_42"), seedOf("trinity"));
assert.equal(seedOf(""), 0);

console.log("hash ok");
