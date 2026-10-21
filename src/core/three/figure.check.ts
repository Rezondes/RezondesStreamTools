// Check for figure.ts: the default weight starts and ends at rest, a plateau holds in the middle, unknown animations stand
// still, the same time gives the same pose. Runs with npm test.
import assert from "node:assert/strict";
import { envelope, plateau, poser, REST, swing } from "./figure.ts";

const pose = poser({
  wave: part => ({ armL: -2 + swing(part, 2), fall: 0.5 }),
  hold: { shape: () => ({ fall: 1 }), weight: plateau(0.2) },
  stay: { shape: () => ({ fall: 1 }), weight: () => 1 },
});

for (const end of [0, 1]) assert.ok(Object.values(pose("wave", end)).every(value => Math.abs(value) < 1e-9), `wave at ${end}`);
assert.ok(pose("wave", 0.3).armL !== 0);
assert.deepEqual(pose("wave", 0.3), pose("wave", 0.3));
assert.equal(pose("hold", 0.5).fall, 1);
assert.equal(pose("hold", 0.1).fall, 0.5);
assert.equal(pose("hold", 1).fall, 0);
assert.equal(pose("stay", 1).fall, 1);
assert.deepEqual(pose("unknown", 0.5), REST);
assert.equal(envelope(-1), 0);
assert.equal(envelope(0.5), 1);

console.log("figure ok");
